import { PDFDocument, StandardFonts, rgb } from 'npm:pdf-lib@1.17.1';
import {
  handler, json, requireStaff, HttpError, getConfig, requireFields, logEvento,
  evolutionSendText, resendSend, phoneBR, autentiqueGql,
} from '../_shared/crm.ts';

// WinAnsi (fontes padrão do PDF) cobre o português; troca o que estiver fora dela.
const winAnsi = (s: string) =>
  s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-')
    .replace(/[^\x09\x0A\x0D\x20-\x7E -ÿ•]/g, '');

async function renderPdf(title: string, text: string) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const W = 595.28, H = 841.89, M = 64, size = 10.5, lead = 15.5;
  let page = pdf.addPage([W, H]);
  let y = H - M;

  const newPage = () => { page = pdf.addPage([W, H]); y = H - M; };
  const wrap = (line: string, f = font, s = size) => {
    const words = line.split(/\s+/);
    const out: string[] = [];
    let cur = '';
    for (const w of words) {
      const test = cur ? `${cur} ${w}` : w;
      if (f.widthOfTextAtSize(test, s) > W - 2 * M && cur) { out.push(cur); cur = w; } else cur = test;
    }
    out.push(cur);
    return out;
  };

  page.drawText(winAnsi(title), { x: M, y, size: 14, font: bold, color: rgb(0.04, 0.12, 0.23) });
  y -= 30;
  for (const raw of winAnsi(text).split('\n')) {
    const isHeading = /^(CLÁUSULA|CLAUSULA|\d+\.)\s/i.test(raw.trim()) && raw.trim().length < 90;
    const f = isHeading ? bold : font;
    if (!raw.trim()) { y -= lead * 0.6; continue; }
    for (const l of wrap(raw.trim(), f)) {
      if (y < M) newPage();
      page.drawText(l, { x: M, y, size, font: f, color: rgb(0.1, 0.1, 0.1) });
      y -= lead;
    }
    if (isHeading) y -= 2;
  }
  return pdf.save();
}

Deno.serve(handler(async (req) => {
  const body = await req.json().catch(() => ({}));
  const { db, user } = await requireStaff(req);

  const { data: contrato } = await db.from('contratos').select('*').eq('id', body.contrato_id).maybeSingle();
  if (!contrato) throw new HttpError(404, 'Contrato não encontrado.');
  const { data: c } = await db.from('companies')
    .select('id, razao_social, nome_fantasia, email, telefone, contato_nome, matricula')
    .eq('id', contrato.company_id).single();

  if (body.action === 'verificar') {
    if (!contrato.autentique_document_id) throw new HttpError(400, 'Contrato ainda não foi enviado ao Autentique.');
    const cfg = await getConfig(db, 'autentique');
    requireFields(cfg, ['token'], 'Autentique');
    const d = await autentiqueGql(cfg, `query($id: UUID!) { document(id: $id) { id signatures { public_id action { name } signed { created_at } rejected { created_at } } } }`, { id: contrato.autentique_document_id });
    const sigs = (d.document?.signatures || []).filter((s: any) => s.action?.name !== 'NONE' || s.signed || s.rejected);
    const rejected = sigs.some((s: any) => s.rejected);
    const signed = sigs.length > 0 && sigs.filter((s: any) => s.action).every((s: any) => s.signed);
    let status = contrato.status;
    if (rejected) status = 'recusado';
    else if (signed) status = 'assinado';
    if (status !== contrato.status) {
      await db.from('contratos').update({ status, assinado_em: status === 'assinado' ? new Date().toISOString() : null }).eq('id', contrato.id);
      await logEvento(db, contrato.company_id, 'contrato', status === 'assinado' ? 'Contrato de adesão assinado.' : 'Contrato de adesão recusado.', user.id);
    }
    return json({ ok: true, status });
  }

  if (body.action !== 'enviar') throw new HttpError(400, 'Ação inválida.');
  const canais = { whatsapp: body.canais?.whatsapp !== false, email: body.canais?.email !== false };

  const aut = await getConfig(db, 'autentique');
  requireFields(aut, ['token'], 'Autentique');
  if (!c.email && !c.telefone) throw new HttpError(400, 'O associado precisa de e-mail ou telefone para assinar.');

  const nome = c.nome_fantasia || c.razao_social || 'Associado';
  const titulo = `Contrato de adesão FPGD — ${nome}`;
  const pdfBytes = await renderPdf(titulo, contrato.conteudo);

  // Upload multipart (GraphQL multipart request spec)
  const signer = c.email
    ? { email: c.email, action: 'SIGN', name: c.contato_nome || nome }
    : { name: c.contato_nome || nome, action: 'SIGN', phone: `+${phoneBR(c.telefone)}`, delivery_method: 'DELIVERY_METHOD_LINK' };
  const operations = {
    query: `mutation($document: DocumentInput!, $signers: [SignerInput!]!, $file: Upload!, $sandbox: Boolean) {
      createDocument(document: $document, signers: $signers, file: $file, sandbox: $sandbox) {
        id name signatures { public_id name email action { name } link { short_link } }
      }
    }`,
    variables: {
      document: { name: titulo, message: aut.mensagem || 'Contrato de adesão à Frente Potiguar de Geração Distribuída.' },
      signers: [signer],
      file: null,
      sandbox: aut.sandbox === true || aut.sandbox === 'true',
    },
  };
  const form = new FormData();
  form.append('operations', JSON.stringify(operations));
  form.append('map', JSON.stringify({ file: ['variables.file'] }));
  form.append('file', new Blob([pdfBytes], { type: 'application/pdf' }), `contrato-fpgd-${c.matricula ?? c.id}.pdf`);
  const r = await fetch('https://api.autentique.com.br/v2/graphql', {
    method: 'POST', headers: { Authorization: `Bearer ${aut.token}` }, body: form,
  });
  const res = await r.json().catch(() => ({}));
  if (!r.ok || res.errors) throw new HttpError(502, `Autentique: ${res.errors?.[0]?.message || r.statusText}`);
  const doc = res.data.createDocument;
  const sig = (doc.signatures || []).find((s: any) => s.action?.name === 'SIGN') || doc.signatures?.[0];
  const link = sig?.link?.short_link || null;

  const avisos: string[] = [];
  let enviado_whatsapp = false, enviado_email = false;
  const saudacao = c.contato_nome ? `Olá, ${c.contato_nome.split(' ')[0]}!` : 'Olá!';
  const msg = `${saudacao} Seu contrato de adesão à FPGD RN está pronto para assinatura: ${link ?? '(link enviado pelo Autentique)'}`;

  if (canais.whatsapp && c.telefone) {
    try {
      const evo = await getConfig(db, 'evolution');
      requireFields(evo, ['base_url', 'instance', 'api_key'], 'Evolution');
      await evolutionSendText(evo, phoneBR(c.telefone), msg);
      enviado_whatsapp = true;
    } catch (e) { avisos.push((e as Error).message); }
  }
  if (canais.email && c.email) {
    try {
      const rs = await getConfig(db, 'resend');
      requireFields(rs, ['api_key', 'from'], 'Resend');
      await resendSend(rs, c.email, 'Seu contrato de adesão à FPGD RN', `
        <div style="font-family:Arial,sans-serif;font-size:15px;color:#0B1F3A;line-height:1.5">
          <p>${saudacao}</p>
          <p>O contrato de adesão da <b>${nome}</b> à Frente Potiguar de Geração Distribuída está pronto para assinatura eletrônica.</p>
          ${link ? `<p><a href="${link}" style="background:#1747A6;color:#fff;padding:12px 20px;text-decoration:none;display:inline-block">Assinar contrato</a></p>` : ''}
          <p style="color:#4b5a70;font-size:13px">FPGD RN · Natal/RN</p>
        </div>`);
      enviado_email = true;
    } catch (e) { avisos.push((e as Error).message); }
  }

  await db.from('contratos').update({
    status: 'enviado', autentique_document_id: doc.id, link_assinatura: link,
    enviado_whatsapp, enviado_email, enviado_em: new Date().toISOString(),
  }).eq('id', contrato.id);
  const via = [enviado_whatsapp && 'WhatsApp', enviado_email && 'e-mail'].filter(Boolean).join(' e ') || 'Autentique';
  await logEvento(db, contrato.company_id, 'contrato', `Contrato enviado para assinatura via ${via}.`, user.id);

  return json({ ok: true, link, enviado_whatsapp, enviado_email, avisos });
}));
