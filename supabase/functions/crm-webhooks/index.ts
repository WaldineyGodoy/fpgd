// Webhooks públicos (verify_jwt desligado): Asaas e Autentique.
// Autenticação por token guardado em Configurações.
import { admin, cors, getConfig, logEvento, upsertCobranca } from '../_shared/crm.ts';

const ok = () => new Response('ok', { headers: cors });
const deny = () => new Response('forbidden', { status: 403, headers: cors });

const PAGO = ['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED_IN_CASH'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return ok();
  const url = new URL(req.url);
  const src = url.searchParams.get('src');
  const db = admin();
  const payload = await req.json().catch(() => ({}));

  try {
    if (src === 'asaas') {
      const cfg = await getConfig(db, 'asaas');
      if (!cfg.webhook_token || req.headers.get('asaas-access-token') !== cfg.webhook_token) return deny();
      const event = payload.event as string;
      const p = payload.payment;
      if (!p) return ok();
      await upsertCobranca(db, p);
      const { data: fin } = await db.from('associado_financeiro').select('company_id')
        .or(`asaas_customer_id.eq.${p.customer},asaas_subscription_id.eq.${p.subscription}`).maybeSingle();
      if (!fin) return ok();
      const { data: c } = await db.from('companies').select('status_associado, data_adesao').eq('id', fin.company_id).single();

      await db.from('associado_financeiro').update({
        ultimo_pagamento_status: p.status, invoice_url: p.invoiceUrl,
        ...(PAGO.includes(event) ? { ultimo_pagamento_em: p.paymentDate || new Date().toISOString() } : {}),
        updated_at: new Date().toISOString(),
      }).eq('company_id', fin.company_id);

      const valor = `R$ ${Number(p.value || 0).toFixed(2).replace('.', ',')}`;
      if (PAGO.includes(event)) {
        await logEvento(db, fin.company_id, 'pagamento', `Mensalidade de ${valor} paga.`);
        if (['inscrito', 'inadimplente'].includes(c.status_associado)) {
          await db.from('companies').update({ status_associado: 'ativo', data_adesao: c.data_adesao || new Date().toISOString().slice(0, 10) }).eq('id', fin.company_id);
          await logEvento(db, fin.company_id, 'status', 'Status alterado para ativo após pagamento.');
        }
      } else if (event === 'PAYMENT_OVERDUE') {
        await logEvento(db, fin.company_id, 'pagamento', `Mensalidade de ${valor} venceu sem pagamento.`);
        if (c.status_associado === 'ativo') {
          await db.from('companies').update({ status_associado: 'inadimplente' }).eq('id', fin.company_id);
          await logEvento(db, fin.company_id, 'status', 'Status alterado para inadimplente (mensalidade vencida).');
        }
      }
      return ok();
    }

    if (src === 'autentique') {
      const cfg = await getConfig(db, 'autentique');
      if (!cfg.webhook_token || url.searchParams.get('token') !== cfg.webhook_token) return deny();
      const type = String(payload.event?.type || payload.type || payload.event || '').toLowerCase();
      const data = payload.event?.data || payload.data || payload;
      const docId = data?.document?.id || data?.document_id || data?.id || payload.document?.id;
      if (!docId) return ok();
      const { data: ct } = await db.from('contratos').select('id, company_id, status').eq('autentique_document_id', docId).maybeSingle();
      if (!ct) return ok();
      if (/(finish|signed|accept)/.test(type) && ct.status !== 'assinado') {
        await db.from('contratos').update({ status: 'assinado', assinado_em: new Date().toISOString() }).eq('id', ct.id);
        await logEvento(db, ct.company_id, 'contrato', 'Contrato de adesão assinado (Autentique).');
      } else if (/reject|refus/.test(type)) {
        await db.from('contratos').update({ status: 'recusado' }).eq('id', ct.id);
        await logEvento(db, ct.company_id, 'contrato', 'Contrato de adesão recusado (Autentique).');
      }
      return ok();
    }
  } catch (e) {
    console.error(e);
    return new Response('error', { status: 500, headers: cors });
  }
  return new Response('unknown source', { status: 400, headers: cors });
});
