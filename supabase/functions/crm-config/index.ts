import {
  handler, json, requireStaff, HttpError, SECRET_FIELDS, getConfig,
  autentiqueGql, asaas, requireFields, requireAsaas, CREDENTIAL_KEYS, documenso, normalizeConfig,
} from '../_shared/crm.ts';

const KEYS = Object.keys(SECRET_FIELDS);
const mask = (v: string) => (v.length <= 4 ? '••••' : `••••${v.slice(-4)}`);

/** Nunca devolve segredos ao navegador: só a máscara e se está preenchido. */
function redact(chave: string, valor: Record<string, any>) {
  const out: Record<string, any> = { ...valor };
  for (const f of SECRET_FIELDS[chave] || []) {
    out[f] = '';
    out[`${f}__set`] = Boolean(valor[f]);
    out[`${f}__mask`] = valor[f] ? mask(String(valor[f])) : '';
  }
  return out;
}

Deno.serve(handler(async (req) => {
  const body = await req.json().catch(() => ({}));
  const action = body.action as string;

  if (action === 'get') {
    const { db, root } = await requireStaff(req);
    const { data } = await db.from('crm_config').select('chave, valor, updated_at');
    const result: Record<string, any> = {};
    // credenciais (mesmo mascaradas) só chegam ao superadmin
    for (const k of KEYS.filter((k) => root || !CREDENTIAL_KEYS.includes(k))) {
      const row = data?.find((r) => r.chave === k);
      result[k] = { ...redact(k, normalizeConfig(k, row?.valor)), __updated_at: row?.updated_at || null };
    }
    const fnBase = `${Deno.env.get('SUPABASE_URL')}/functions/v1/crm-webhooks`;
    if (root) result.webhooks = { asaas: `${fnBase}?src=asaas`, documenso: `${fnBase}?src=documenso`, autentique: `${fnBase}?src=autentique` };
    return json(result);
  }

  if (action === 'save') {
    const { db, user, root } = await requireStaff(req, true);
    const chave = body.chave as string;
    if (!KEYS.includes(chave)) throw new HttpError(400, 'Seção desconhecida.');
    if (CREDENTIAL_KEYS.includes(chave) && !root) throw new HttpError(403, 'Só o superadmin altera credenciais e API keys.');
    const current = await getConfig(db, chave);
    const incoming = (body.valor || {}) as Record<string, any>;
    const next: Record<string, any> = { ...current };
    for (const [k, v] of Object.entries(incoming)) {
      if (k.includes('__')) continue;
      // campo secreto vazio = manter o valor guardado
      if ((SECRET_FIELDS[chave] || []).includes(k) && (v === '' || v == null)) continue;
      next[k] = typeof v === 'string' ? v.trim() : v;
    }
    const { error } = await db.from('crm_config').upsert({
      chave, valor: next, updated_at: new Date().toISOString(), updated_by: user.id,
    });
    if (error) throw new HttpError(500, error.message);
    return json({ ok: true, valor: redact(chave, next) });
  }

  if (action === 'test') {
    const { db, root } = await requireStaff(req, true);
    if (!root) throw new HttpError(403, 'Só o superadmin testa credenciais.');
    const chave = body.chave as string;
    const cfg = await getConfig(db, chave);
    if (chave === 'documenso') {
      requireFields(cfg, ['api_token'], 'Documenso');
      const r = await documenso(cfg, '/documents?page=1&perPage=1');
      return json({ ok: true, detalhe: `Conectado ao Documenso (${r.totalPages ?? 0} página(s) de documentos)` });
    }
    if (chave === 'autentique') {
      requireFields(cfg, ['token'], 'Autentique');
      const d = await autentiqueGql(cfg, 'query { me { name email } }');
      return json({ ok: true, detalhe: `Conectado como ${d.me?.name || d.me?.email}` });
    }
    if (chave === 'evolution') {
      requireFields(cfg, ['base_url', 'instance', 'api_key'], 'Evolution');
      const base = String(cfg.base_url).replace(/\/+$/, '');
      const r = await fetch(`${base}/instance/connectionState/${encodeURIComponent(cfg.instance)}`, { headers: { apikey: cfg.api_key } });
      const b = await r.json().catch(() => ({}));
      if (!r.ok) throw new HttpError(502, `Evolution respondeu ${r.status}`);
      return json({ ok: true, detalhe: `Instância ${cfg.instance}: ${b.instance?.state || b.state || 'ok'}` });
    }
    if (chave === 'resend') {
      requireFields(cfg, ['api_key', 'from'], 'Resend');
      const r = await fetch('https://api.resend.com/domains', { headers: { Authorization: `Bearer ${cfg.api_key}` } });
      if (!r.ok) throw new HttpError(502, `Resend respondeu ${r.status}`);
      const b = await r.json();
      const n = b.data?.length ?? 0;
      return json({ ok: true, detalhe: `${n} domínio(s) na conta` });
    }
    if (chave === 'asaas') {
      requireAsaas(cfg);
      const b = await asaas(cfg, '/myAccount/commercialInfo');
      return json({ ok: true, detalhe: `Conta ${b.name || b.companyName || 'Asaas'} (${cfg.ambiente === 'producao' ? 'produção' : 'sandbox'})` });
    }
    throw new HttpError(400, 'Nada para testar nesta seção.');
  }

  // Cadastra (ou atualiza) o webhook da FPGD no Asaas do ambiente escolhido, com token gerado aqui.
  if (action === 'asaas_webhook') {
    const { db, user, root } = await requireStaff(req, true);
    if (!root) throw new HttpError(403, 'Só o superadmin configura o webhook.');
    const cfg = await getConfig(db, 'asaas');
    requireAsaas(cfg);
    const url = `${Deno.env.get('SUPABASE_URL')}/functions/v1/crm-webhooks?src=asaas`;
    const token = cfg.webhook_token || `fpgd_${crypto.randomUUID().replace(/-/g, '')}${crypto.randomUUID().replace(/-/g, '')}`;
    const conta = await asaas(cfg, '/myAccount/commercialInfo');
    const payload = {
      name: 'FPGD CRM', url, email: conta.email, enabled: true, interrupted: false, apiVersion: 3,
      authToken: token, sendType: 'SEQUENTIALLY',
      events: [
        'PAYMENT_CREATED', 'PAYMENT_UPDATED', 'PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED', 'PAYMENT_OVERDUE',
        'PAYMENT_DELETED', 'PAYMENT_RESTORED', 'PAYMENT_REFUNDED', 'PAYMENT_RECEIVED_IN_CASH_UNDONE',
      ],
    };
    const lista = await asaas(cfg, '/webhooks?limit=100');
    const existente = (lista.data || []).find((w: any) => w.url === url);
    const w = existente
      ? await asaas(cfg, `/webhooks/${existente.id}`, { method: 'PUT', body: payload })
      : await asaas(cfg, '/webhooks', { method: 'POST', body: payload });
    if (token !== cfg.webhook_token) {
      const next = { ...cfg, webhook_token: token };
      const { error } = await db.from('crm_config').upsert({ chave: 'asaas', valor: next, updated_at: new Date().toISOString(), updated_by: user.id });
      if (error) throw new HttpError(500, error.message);
    }
    const amb = cfg.ambiente === 'producao' ? 'produção' : 'sandbox';
    return json({ ok: true, detalhe: `Webhook ${existente ? 'atualizado' : 'cadastrado'} no Asaas (${amb}), ${payload.events.length} eventos de cobrança${w.id ? `, id ${w.id}` : ''}.` });
  }

  throw new HttpError(400, 'Ação inválida.');
}));
