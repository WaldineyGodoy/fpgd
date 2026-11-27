// Adesão automática de um integrador recém-cadastrado:
// 1) define o plano, 2) gera e envia o termo de adesão (Documenso + WhatsApp),
// 3) cria o 1º boleto (adesão) no Asaas e envia por WhatsApp e e-mail.
// Quando esse boleto é pago, o webhook do Asaas ativa o associado e liga a recorrência mensal.
// Chamada pelo próprio associado ao entrar (só para a empresa dele) ou pela equipe (qualquer empresa).
// Idempotente: cada etapa só roda se ainda não foi feita.
import { renderPdfComAssinatura } from '../_shared/pdf.ts';
import { DEFAULT_CONTRATO, renderContrato } from '../_shared/contrato.ts';
import {
  admin, handler, json, HttpError, getConfig, requireAsaas, logEvento, asaas, upsertCobranca,
  evolutionSendText, resendSend, phoneBR, documensoEnviar, asaasCliente, notificarCobranca, hojeRN, somarDias,
} from '../_shared/crm.ts';

Deno.serve(handler(async (req) => {
  const body = await req.json().catch(() => ({}));
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) throw new HttpError(401, 'Sessão ausente.');
  const db = admin();
  const { data: { user }, error } = await db.auth.getUser(token);
  if (error || !user) throw new HttpError(401, 'Sessão inválida.');
  const { data: me } = await db.from('companies').select('id, user_type, is_admin').eq('auth_user_id', user.id).maybeSingle();
  const equipe = me?.user_type === 'superadmin' || me?.user_type === 'mediador' || me?.is_admin === true;

  const companyId = equipe && body.company_id ? String(body.company_id) : me?.id;
  if (!companyId) throw new HttpError(404, 'Empresa não encontrada para este login.');
  const auto = await getConfig(db, 'automacao');
  if (!equipe && auto.ativo === false) return json({ ok: true, pulado: 'automação desligada' });

  const { data: c } = await db.from('companies').select('*').eq('id', companyId).single();
  if (c.user_type !== 'integrador') return json({ ok: true, pulado: 'não é integrador' });
  if (c.status_associado !== 'inscrito') return json({ ok: true, pulado: `status ${c.status_associado}` });

  const feito: string[] = [];
  const avisos: string[] = [];

  // 1) Plano
  let plano = null as Record<string, any> | null;
  const planoId = c.plano_id || auto.plano_id;
  if (planoId) plano = (await db.from('planos').select('*').eq('id', planoId).maybeSingle()).data;
  if (!plano) plano = (await db.from('planos').select('*').eq('ativo', true).order('valor').limit(1).maybeSingle()).data;
  if (!plano) throw new HttpError(400, 'Nenhum plano ativo em Configurações › Planos e valores.');
  if (c.plano_id !== plano.id) { await db.from('companies').update({ plano_id: plano.id }).eq('id', c.id); c.plano_id = plano.id; }

  // 2) Termo de adesão
  const { data: contratos } = await db.from('contratos').select('*').eq('company_id', c.id).neq('status', 'cancelado').order('created_at', { ascending: false });
  let contrato = contratos?.[0] ?? null;
  if (!contrato || contrato.status === 'recusado') {
    const tpl = (await getConfig(db, 'contrato')).template || DEFAULT_CONTRATO;
    const ins = await db.from('contratos').insert({ company_id: c.id, plano_id: plano.id, conteudo: renderContrato(tpl, c, plano) }).select('*').single();
    if (ins.error) throw new HttpError(500, ins.error.message);
    contrato = ins.data;
    await logEvento(db, c.id, 'contrato', 'Termo de adesão gerado automaticamente.');
  }
  if (contrato.status === 'rascunho') {
    try {
      const doc = await getConfig(db, 'documenso');
      if (!doc.api_token) throw new Error('Documenso não configurado');
      if (!c.email) throw new Error('associado sem e-mail');
      const nome = c.nome_fantasia || c.razao_social || 'Associado';
      const signatario = c.contato_nome || nome;
      const titulo = `Contrato de adesão FPGD — ${nome}`;
      const { bytes, campo } = await renderPdfComAssinatura(titulo, contrato.conteudo, `${signatario} — ${c.razao_social || nome}`);
      const env = await documensoEnviar(doc, {
        titulo, pdf: bytes, campo, externalId: `fpgd:contrato:${contrato.id}`,
        signatario: { nome: signatario, email: c.email },
        assunto: 'Seu termo de adesão à FPGD RN',
        mensagem: doc.mensagem || 'Termo de adesão à Frente Potiguar de Geração Distribuída. Leia e assine pelo botão abaixo.',
        enviarEmail: true,
      });
      let whatsapp = false;
      if (c.telefone && env.link) {
        try {
          const evo = await getConfig(db, 'evolution');
          if (evo.base_url && evo.instance && evo.api_key) {
            const ola = c.contato_nome ? `Olá, ${String(c.contato_nome).split(' ')[0]}!` : 'Olá!';
            await evolutionSendText(evo, phoneBR(c.telefone), `${ola} Seu termo de adesão à FPGD RN está pronto para assinatura eletrônica: ${env.link}`);
            whatsapp = true;
          }
        } catch (e) { avisos.push(`WhatsApp do termo: ${(e as Error).message}`); }
      }
      await db.from('contratos').update({
        status: 'enviado', provedor: 'documenso', documenso_document_id: env.documentId, link_assinatura: env.link,
        enviado_email: true, enviado_whatsapp: whatsapp, enviado_em: new Date().toISOString(),
      }).eq('id', contrato.id);
      await logEvento(db, c.id, 'contrato', `Termo de adesão enviado automaticamente por e-mail${whatsapp ? ' e WhatsApp' : ''}.`);
      feito.push('termo enviado');
    } catch (e) {
      avisos.push(`Termo: ${(e as Error).message}`);
      await logEvento(db, c.id, 'contrato', `Termo gerado, mas não enviado: ${(e as Error).message}. Envie pela aba Contrato.`);
    }
  }

  // 3) 1º boleto (adesão)
  const { data: fin } = await db.from('associado_financeiro').select('*').eq('company_id', c.id).maybeSingle();
  if (!fin?.adesao_payment_id && !fin?.asaas_subscription_id) {
    try {
      const cfg = await getConfig(db, 'asaas');
      requireAsaas(cfg);
      const customer = await asaasCliente(cfg, c, fin?.asaas_customer_id);
      const dias = Math.max(1, Number(auto.dias_vencimento_adesao) || 3);
      const p = await asaas(cfg, '/payments', {
        method: 'POST',
        body: {
          customer, billingType: cfg.billing_type && cfg.billing_type !== 'UNDEFINED' ? cfg.billing_type : 'BOLETO',
          value: Number(plano.valor), dueDate: somarDias(hojeRN(), dias),
          description: `Adesão FPGD RN — 1ª mensalidade (${plano.nome})`, externalReference: c.id,
        },
      });
      await upsertCobranca(db, p, c.id);
      await db.from('associado_financeiro').upsert({
        company_id: c.id, asaas_customer_id: customer, adesao_payment_id: p.id, valor: plano.valor,
        status_assinatura: 'AGUARDANDO_ADESAO', ultimo_pagamento_status: p.status, invoice_url: p.invoiceUrl,
        proximo_vencimento: p.dueDate, onboarding_em: new Date().toISOString(), updated_at: new Date().toISOString(),
      });
      await logEvento(db, c.id, 'cobranca', `Boleto de adesão criado no Asaas: ${plano.nome}, vencimento ${String(p.dueDate).split('-').reverse().join('/')}.`);
      const n = await notificarCobranca(db, p, c.id, true);
      avisos.push(...n.avisos);
      feito.push(n.enviados.length ? `boleto enviado por ${n.enviados.join(' e ')}` : 'boleto criado');
    } catch (e) {
      avisos.push(`Boleto: ${(e as Error).message}`);
      await logEvento(db, c.id, 'cobranca', `Não foi possível criar o boleto de adesão: ${(e as Error).message}`);
    }
  }

  // Aviso à equipe (uma vez, no primeiro onboarding)
  if (!fin?.onboarding_em && auto.email_equipe) {
    try {
      const rs = await getConfig(db, 'resend');
      if (rs.api_key && rs.from) {
        await resendSend(rs, auto.email_equipe, `Novo associado: ${c.nome_fantasia || c.razao_social}`,
          `<p>Novo cadastro na FPGD RN: <b>${c.razao_social || c.nome_fantasia}</b> (CNPJ ${c.cnpj}).</p><p>${feito.join(' · ') || 'Nenhuma etapa automática concluída.'}</p>${avisos.length ? `<p>Pendências: ${avisos.join(' · ')}</p>` : ''}`);
      }
    } catch { /* aviso à equipe é opcional */ }
  }

  return json({ ok: true, feito, avisos });
}));
