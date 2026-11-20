import {
  handler, json, requireStaff, HttpError, SECRET_FIELDS, getConfig,
  autentiqueGql, asaas, requireFields, CREDENTIAL_KEYS,
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
      result[k] = { ...redact(k, row?.valor || {}), __updated_at: row?.updated_at || null };
    }
    const fnBase = `${Deno.env.get('SUPABASE_URL')}/functions/v1/crm-webhooks`;
    if (root) result.webhooks = { asaas: `${fnBase}?src=asaas`, autentique: `${fnBase}?src=autentique` };
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
      requireFields(cfg, ['api_key'], 'Asaas');
      const b = await asaas(cfg, '/myAccount/commercialInfo');
      return json({ ok: true, detalhe: `Conta ${b.name || b.companyName || 'Asaas'} (${cfg.ambiente === 'producao' ? 'produção' : 'sandbox'})` });
    }
    throw new HttpError(400, 'Nada para testar nesta seção.');
  }

  throw new HttpError(400, 'Ação inválida.');
}));
