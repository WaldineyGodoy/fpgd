// Contrato de adesão: assinatura eletrônica pelo Documenso (Autentique só para contratos antigos).
import { renderPdfComAssinatura } from '../_shared/pdf.ts';
import {
  handler, json, requireStaff, HttpError, getConfig, requireFields, logEvento,
  evolutionSendText, phoneBR, autentiqueGql, documensoEnviar, documensoStatus,
} from '../_shared/crm.ts';

Deno.serve(handler(async (req) => {
  const body = await req.json().catch(() => ({}));
  const { db, user } = await requireStaff(req);

  const { data: contrato } = await db.from('contratos').select('*').eq('id', body.contrato_id).maybeSingle();
  if (!contrato) throw new HttpError(404, 'Contrato não encontrado.');
  const { data: c } = await db.from('companies')
    .select('id, razao_social, nome_fantasia, email, telefone, contato_nome, matricula')
    .eq('id', contrato.company_id).single();

  if (body.action === 'verificar' && contrato.documenso_document_id) {
    const cfg = await getConfig(db, 'documenso');
    requireFields(cfg, ['api_token'], 'Documenso');
    const status = await documensoStatus(cfg, contrato.documenso_document_id);
    if (status !== contrato.status) {
      await db.from('contratos').update({ status, assinado_em: status === 'assinado' ? new Date().toISOString() : null }).eq('id', contrato.id);
      await logEvento(db, contrato.company_id, 'contrato', status === 'assinado' ? 'Contrato de adesão assinado (Documenso).' : status === 'recusado' ? 'Contrato de adesão recusado (Documenso).' : 'Contrato aguardando assinatura.', user.id);
    }
    return json({ ok: true, status });
  }

  if (body.action === 'verificar') {
    if (!contrato.autentique_document_id) throw new HttpError(400, 'Contrato ainda não foi enviado para assinatura.');
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

  const doc = await getConfig(db, 'documenso');
  requireFields(doc, ['api_token'], 'Documenso');
  if (!c.email) throw new HttpError(400, 'O associado precisa de e-mail: o Documenso identifica o signatário pelo e-mail.');

  const nome = c.nome_fantasia || c.razao_social || 'Associado';
  const signatario = c.contato_nome || nome;
  const titulo = `Contrato de adesão FPGD — ${nome}`;
  const { bytes, campo } = await renderPdfComAssinatura(titulo, contrato.conteudo, `${signatario} — ${c.razao_social || nome}`);

  const env = await documensoEnviar(doc, {
    titulo, pdf: bytes, campo, externalId: `fpgd:contrato:${contrato.id}`,
    signatario: { nome: signatario, email: c.email },
    assunto: 'Seu contrato de adesão à FPGD RN',
    mensagem: doc.mensagem || 'Contrato de adesão à Frente Potiguar de Geração Distribuída. Leia e assine pelo botão abaixo.',
    enviarEmail: canais.email,
  });
  const link = env.link;

  const avisos: string[] = [];
  let enviado_whatsapp = false;
  const enviado_email = canais.email;
  const saudacao = c.contato_nome ? `Olá, ${c.contato_nome.split(' ')[0]}!` : 'Olá!';
  const msg = `${saudacao} Seu contrato de adesão à FPGD RN está pronto para assinatura eletrônica: ${link ?? '(link enviado por e-mail)'}`;

  if (canais.whatsapp && c.telefone) {
    try {
      const evo = await getConfig(db, 'evolution');
      requireFields(evo, ['base_url', 'instance', 'api_key'], 'Evolution');
      await evolutionSendText(evo, phoneBR(c.telefone), msg);
      enviado_whatsapp = true;
    } catch (e) { avisos.push((e as Error).message); }
  }

  await db.from('contratos').update({
    status: 'enviado', provedor: 'documenso', documenso_document_id: env.documentId, link_assinatura: link,
    enviado_whatsapp, enviado_email, enviado_em: new Date().toISOString(),
  }).eq('id', contrato.id);
  const via = [enviado_whatsapp && 'WhatsApp', enviado_email && 'e-mail'].filter(Boolean).join(' e ') || 'link do Documenso';
  await logEvento(db, contrato.company_id, 'contrato', `Contrato enviado para assinatura no Documenso via ${via}.`, user.id);

  return json({ ok: true, link, enviado_whatsapp, enviado_email, avisos });
}));
