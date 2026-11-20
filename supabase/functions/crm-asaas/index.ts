import {
  handler, json, requireStaff, HttpError, getConfig, requireFields, logEvento, asaas, onlyDigits, upsertCobranca,
} from '../_shared/crm.ts';

const today = () => new Date().toISOString().slice(0, 10);

function nextDue(dia: number) {
  const d = new Date();
  const candidate = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), dia));
  if (candidate.toISOString().slice(0, 10) <= today()) candidate.setUTCMonth(candidate.getUTCMonth() + 1);
  return candidate.toISOString().slice(0, 10);
}

Deno.serve(handler(async (req) => {
  const body = await req.json().catch(() => ({}));
  const { db, user } = await requireStaff(req);
  const cfg = await getConfig(db, 'asaas');
  requireFields(cfg, ['api_key'], 'Asaas');

  // ---------- Ações globais (página Pagamentos) ----------
  if (body.action === 'saldo') {
    const b = await asaas(cfg, '/finance/balance');
    return json({ ok: true, saldo: Number(b.balance ?? 0) });
  }

  if (body.action === 'sync_all') {
    let offset = 0, total = 0;
    for (let page = 0; page < 20; page++) {
      const r = await asaas(cfg, `/payments?limit=100&offset=${offset}`);
      for (const p of (r.data || [])) { await upsertCobranca(db, p); total++; }
      if (!r.hasMore) break;
      offset += 100;
    }
    // reflete atrasos no status do associado
    const { data: atrasados } = await db.from('cobrancas').select('company_id').eq('status', 'OVERDUE').not('company_id', 'is', null);
    const ids = [...new Set((atrasados || []).map((x) => x.company_id))];
    if (ids.length) {
      const { data: ativos } = await db.from('companies').select('id').in('id', ids).eq('status_associado', 'ativo');
      for (const a of ativos || []) {
        await db.from('companies').update({ status_associado: 'inadimplente' }).eq('id', a.id);
        await logEvento(db, a.id, 'status', 'Status alterado para inadimplente (cobrança vencida no Asaas).', user.id);
      }
    }
    return json({ ok: true, total });
  }

  if (body.action === 'receber_dinheiro') {
    const { data: cb } = await db.from('cobrancas').select('*').eq('id', body.cobranca_id).maybeSingle();
    if (!cb?.asaas_payment_id) throw new HttpError(400, 'Cobrança não encontrada no Asaas.');
    const p = await asaas(cfg, `/payments/${cb.asaas_payment_id}/receiveInCash`, {
      method: 'POST', body: { paymentDate: body.data || today(), value: Number(cb.valor), notifyCustomer: false },
    });
    await upsertCobranca(db, p, cb.company_id);
    if (cb.company_id) await logEvento(db, cb.company_id, 'pagamento', `Recebimento em dinheiro de R$ ${Number(cb.valor).toFixed(2).replace('.', ',')} confirmado no Asaas.`, user.id);
    return json({ ok: true });
  }

  const companyId = body.company_id as string;
  const { data: c } = await db.from('companies').select('*').eq('id', companyId).maybeSingle();
  if (!c) throw new HttpError(404, 'Associado não encontrado.');
  const { data: fin } = await db.from('associado_financeiro').select('*').eq('company_id', companyId).maybeSingle();

  if (body.action === 'assinar') {
    const { data: plano } = await db.from('planos').select('*').eq('id', body.plano_id || c.plano_id).maybeSingle();
    if (!plano) throw new HttpError(400, 'Escolha um plano para o associado.');
    if (fin?.asaas_subscription_id && fin.status_assinatura === 'ACTIVE') {
      throw new HttpError(409, 'Este associado já tem assinatura ativa no Asaas.');
    }

    let customerId = fin?.asaas_customer_id as string | undefined;
    const doc = onlyDigits(c.cnpj);
    if (!customerId) {
      const found = await asaas(cfg, `/customers?cpfCnpj=${doc}`);
      customerId = found.data?.[0]?.id;
    }
    if (!customerId) {
      const created = await asaas(cfg, '/customers', {
        method: 'POST',
        body: {
          name: c.razao_social || c.nome_fantasia, cpfCnpj: doc, email: c.email || undefined,
          mobilePhone: onlyDigits(c.telefone) || undefined, postalCode: onlyDigits(c.cep) || undefined,
          address: c.logradouro || undefined, addressNumber: c.numero || undefined, province: c.bairro || undefined,
          externalReference: c.id, notificationDisabled: false,
        },
      });
      customerId = created.id;
    }

    const due = body.next_due_date || nextDue(plano.dia_vencimento);
    const sub = await asaas(cfg, '/subscriptions', {
      method: 'POST',
      body: {
        customer: customerId, billingType: body.billing_type || cfg.billing_type || 'UNDEFINED',
        value: Number(plano.valor), nextDueDate: due, cycle: plano.ciclo,
        description: `Mensalidade FPGD RN — ${plano.nome}`, externalReference: c.id,
      },
    });
    const pays = await asaas(cfg, `/subscriptions/${sub.id}/payments`);
    const first = pays.data?.[0];
    for (const p of (pays.data || [])) await upsertCobranca(db, p, c.id);

    await db.from('associado_financeiro').upsert({
      company_id: c.id, asaas_customer_id: customerId, asaas_subscription_id: sub.id, valor: plano.valor,
      proximo_vencimento: sub.nextDueDate || due, status_assinatura: sub.status || 'ACTIVE',
      ultimo_pagamento_status: first?.status || null, invoice_url: first?.invoiceUrl || null,
      updated_at: new Date().toISOString(),
    });
    await db.from('companies').update({ plano_id: plano.id }).eq('id', c.id);
    await logEvento(db, c.id, 'cobranca', `Assinatura criada no Asaas: ${plano.nome}, R$ ${Number(plano.valor).toFixed(2).replace('.', ',')}, 1º vencimento ${due.split('-').reverse().join('/')}.`, user.id);
    return json({ ok: true, subscription_id: sub.id, invoice_url: first?.invoiceUrl || null });
  }

  if (body.action === 'sincronizar') {
    if (!fin?.asaas_subscription_id) throw new HttpError(400, 'Sem assinatura no Asaas.');
    const sub = await asaas(cfg, `/subscriptions/${fin.asaas_subscription_id}`);
    const pays = await asaas(cfg, `/subscriptions/${fin.asaas_subscription_id}/payments?limit=12`);
    const list = (pays.data || []) as any[];
    for (const p of list) await upsertCobranca(db, p, c.id);
    const overdue = list.find((p) => p.status === 'OVERDUE');
    const latest = overdue || list.find((p) => p.status === 'PENDING') || list[0];
    const paid = list.filter((p) => ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(p.status))
      .sort((a, b) => (b.paymentDate || '').localeCompare(a.paymentDate || ''))[0];
    await db.from('associado_financeiro').update({
      status_assinatura: sub.status, proximo_vencimento: sub.nextDueDate,
      ultimo_pagamento_status: latest?.status || null, invoice_url: latest?.invoiceUrl || null,
      ultimo_pagamento_em: paid?.paymentDate || fin.ultimo_pagamento_em, updated_at: new Date().toISOString(),
    }).eq('company_id', c.id);

    let status = c.status_associado;
    if (overdue && status === 'ativo') status = 'inadimplente';
    if (!overdue && paid && (status === 'inadimplente' || status === 'inscrito')) status = 'ativo';
    if (status !== c.status_associado) {
      await db.from('companies').update({ status_associado: status }).eq('id', c.id);
      await logEvento(db, c.id, 'status', `Status alterado para ${status} pela sincronização do Asaas.`, user.id);
    }
    return json({ ok: true, status, pagamentos: list.slice(0, 6).map((p) => ({ id: p.id, valor: p.value, vencimento: p.dueDate, status: p.status, url: p.invoiceUrl })) });
  }

  if (body.action === 'cancelar') {
    if (!fin?.asaas_subscription_id) throw new HttpError(400, 'Sem assinatura no Asaas.');
    await asaas(cfg, `/subscriptions/${fin.asaas_subscription_id}`, { method: 'DELETE' });
    await db.from('associado_financeiro').update({ status_assinatura: 'INACTIVE', updated_at: new Date().toISOString() }).eq('company_id', c.id);
    await logEvento(db, c.id, 'cobranca', 'Assinatura cancelada no Asaas.', user.id);
    return json({ ok: true });
  }

  throw new HttpError(400, 'Ação inválida.');
}));
