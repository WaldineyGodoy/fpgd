// Webhooks públicos (verify_jwt desligado): Asaas, Documenso e Autentique (legado).
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
          await db.from('companies').update({ status_associado: 'ativo', data_adesao: c.data_adesao || new Date().toLocaleDateString('en-CA', { timeZone: 'America/Fortaleza' }) }).eq('id', fin.company_id);
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

    // Asaas do próprio associado (CRM white label): ?src=tenant-asaas&t=<company_id>
    if (src === 'tenant-asaas') {
      const t = url.searchParams.get('t') || '';
      const { data: row } = await db.from('tenant_config').select('valor').eq('company_id', t).eq('chave', 'asaas').maybeSingle();
      const token = (row?.valor as Record<string, any> | undefined)?.webhook_token;
      if (!token || req.headers.get('asaas-access-token') !== token) return deny();
      const p = payload.payment;
      if (!p?.id) return ok();
      const { data: cb } = await db.from('tenant_cobrancas').select('id, cliente_id, company_id').eq('asaas_payment_id', p.id).maybeSingle();
      if (cb && cb.company_id !== t) return deny(); // pagamento de outro associado: nunca sobrescrever
      let clienteId = cb?.cliente_id ?? null;
      if (!clienteId && p.externalReference) {
        const { data: cli } = await db.from('tenant_clientes').select('id').eq('company_id', t).eq('id', p.externalReference).maybeSingle();
        clienteId = cli?.id ?? null;
      }
      await db.from('tenant_cobrancas').upsert({
        company_id: t, cliente_id: clienteId, asaas_payment_id: p.id, descricao: p.description ?? null,
        valor: Number(p.value || 0), forma: p.billingType ?? null, status: p.status, vencimento: p.dueDate,
        pago_em: p.clientPaymentDate || p.paymentDate || null, invoice_url: p.invoiceUrl ?? null, updated_at: new Date().toISOString(),
      }, { onConflict: 'asaas_payment_id' });
      if (clienteId && PAGO.includes(payload.event)) {
        await db.from('tenant_eventos').insert({ company_id: t, cliente_id: clienteId, tipo: 'pagamento', descricao: `Pagamento de R$ ${Number(p.value || 0).toFixed(2).replace('.', ',')} confirmado.` });
      }
      return ok();
    }

    if (src === 'documenso') {
      // ?tenant=<company_id> quando o associado usa a própria conta do Documenso
      const tenant = url.searchParams.get('tenant');
      let secret: string | undefined;
      if (tenant) {
        const { data } = await db.from('tenant_config').select('valor').eq('company_id', tenant).eq('chave', 'documenso').maybeSingle();
        secret = (data?.valor as any)?.webhook_secret;
      } else secret = (await getConfig(db, 'documenso')).webhook_secret;
      if (!secret || req.headers.get('x-documenso-secret') !== secret) return deny();

      const event = String(payload.event || '').toUpperCase();
      const d = payload.payload || {};
      const ext = String(d.externalId || '');
      const docId = d.id != null ? String(d.id) : '';
      const recs = (d.recipients || d.Recipient || []) as any[];
      const rejected = event === 'DOCUMENT_REJECTED' || String(d.status).toUpperCase() === 'REJECTED'
        || recs.some((r) => String(r.signingStatus).toUpperCase() === 'REJECTED');
      const completed = event === 'DOCUMENT_COMPLETED' || String(d.status).toUpperCase() === 'COMPLETED';
      if (!rejected && !completed) return ok();
      const status = rejected ? 'recusado' : 'assinado';
      const agora = new Date().toISOString();

      if (ext.startsWith('tenant:contrato:') || tenant) {
        let q = db.from('tenant_contratos').select('id, company_id, cliente_id, status');
        q = ext.startsWith('tenant:contrato:') ? q.eq('id', ext.slice('tenant:contrato:'.length)) : q.eq('documenso_document_id', docId);
        if (tenant) q = q.eq('company_id', tenant);
        const { data: ct } = await q.maybeSingle();
        if (!ct || ct.status === status) return ok();
        await db.from('tenant_contratos').update({ status, assinado_em: status === 'assinado' ? agora : null, updated_at: agora }).eq('id', ct.id);
        if (status === 'assinado') await db.from('tenant_clientes').update({ etapa: 'ganho', updated_at: agora }).eq('id', ct.cliente_id);
        await db.from('tenant_eventos').insert({ company_id: ct.company_id, cliente_id: ct.cliente_id, tipo: 'contrato',
          descricao: status === 'assinado' ? 'Contrato assinado no Documenso. Cliente movido para Fechado.' : 'Cliente recusou o contrato no Documenso.' });
        return ok();
      }

      let q = db.from('contratos').select('id, company_id, status');
      q = ext.startsWith('fpgd:contrato:') ? q.eq('id', ext.slice('fpgd:contrato:'.length)) : q.eq('documenso_document_id', docId);
      const { data: ct } = await q.maybeSingle();
      if (!ct || ct.status === status) return ok();
      await db.from('contratos').update({ status, assinado_em: status === 'assinado' ? agora : null }).eq('id', ct.id);
      await logEvento(db, ct.company_id, 'contrato', status === 'assinado' ? 'Contrato de adesão assinado (Documenso).' : 'Contrato de adesão recusado (Documenso).');
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
