import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@2.93.3';

export const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export const admin = (): SupabaseClient =>
  createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });

export type Role = 'superadmin' | 'mediador';

/** Valida o JWT do chamador e exige papel de equipe. Retorna o usuário e o papel. */
export async function requireStaff(req: Request, onlySuperadmin = false) {
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) throw new HttpError(401, 'Sessão ausente.');
  const db = admin();
  const { data: { user }, error } = await db.auth.getUser(token);
  if (error || !user) throw new HttpError(401, 'Sessão inválida.');
  const { data: me } = await db.from('companies').select('id, user_type, is_admin').eq('auth_user_id', user.id).maybeSingle();
  const role = me?.user_type as string | undefined;
  const manager = role === 'superadmin' || me?.is_admin === true;
  const allowed = onlySuperadmin ? manager : manager || role === 'mediador';
  if (!allowed) throw new HttpError(403, onlySuperadmin ? 'Só superadmin ou admin pode fazer isso.' : 'Acesso restrito à equipe da FPGD.');
  return { db, user, role: role as Role, root: role === 'superadmin' };
}

/** Credenciais e API keys: somente o superadmin. */
export const CREDENTIAL_KEYS = ['autentique', 'evolution', 'resend', 'asaas'];

/** Espelha um pagamento do Asaas na tabela cobrancas. */
export async function upsertCobranca(db: SupabaseClient, p: Record<string, any>, companyId?: string | null) {
  let company_id = companyId ?? null;
  if (!company_id && p.customer) {
    const { data } = await db.from('associado_financeiro').select('company_id').eq('asaas_customer_id', p.customer).maybeSingle();
    company_id = data?.company_id ?? null;
  }
  if (!company_id && p.externalReference) {
    const { data } = await db.from('companies').select('id').eq('id', p.externalReference).maybeSingle();
    company_id = data?.id ?? null;
  }
  await db.from('cobrancas').upsert({
    asaas_payment_id: p.id, company_id, asaas_customer_id: p.customer ?? null,
    descricao: p.description ?? null, valor: Number(p.value || 0), valor_liquido: p.netValue != null ? Number(p.netValue) : null,
    forma: p.billingType ?? null, status: p.status, vencimento: p.dueDate,
    pago_em: p.clientPaymentDate || p.paymentDate || null, invoice_url: p.invoiceUrl ?? null,
    origem: 'asaas', updated_at: new Date().toISOString(),
  }, { onConflict: 'asaas_payment_id' });
}

export const SECRET_FIELDS: Record<string, string[]> = {
  autentique: ['token', 'webhook_token'],
  evolution: ['api_key'],
  resend: ['api_key'],
  asaas: ['api_key', 'webhook_token'],
  contrato: [],
};

export async function getConfig<T = Record<string, any>>(db: SupabaseClient, chave: string): Promise<T> {
  const { data } = await db.from('crm_config').select('valor').eq('chave', chave).maybeSingle();
  return (data?.valor || {}) as T;
}

export function requireFields(cfg: Record<string, any>, fields: string[], label: string) {
  const missing = fields.filter((f) => !cfg[f]);
  if (missing.length) throw new HttpError(400, `${label}: configure ${missing.join(', ')} em Configurações.`);
}

export async function logEvento(db: SupabaseClient, company_id: string, tipo: string, descricao: string, autor?: string) {
  await db.from('crm_eventos').insert({ company_id, tipo, descricao, autor: autor ?? null });
}

export const onlyDigits = (v?: string | null) => (v || '').replace(/\D/g, '');

/** Telefone em formato internacional BR para a Evolution API. */
export function phoneBR(v?: string | null) {
  const d = onlyDigits(v);
  if (!d) return '';
  return d.startsWith('55') && d.length >= 12 ? d : `55${d}`;
}

export function handler(fn: (req: Request) => Promise<Response>) {
  return async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
    try {
      return await fn(req);
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message }, e.status);
      console.error(e);
      return json({ error: (e as Error).message || 'Erro inesperado.' }, 500);
    }
  };
}

// ---------- Integrações ----------

export async function autentiqueGql(cfg: Record<string, any>, query: string, variables: Record<string, unknown> = {}) {
  const r = await fetch('https://api.autentique.com.br/v2/graphql', {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok || body.errors) throw new HttpError(502, `Autentique: ${body.errors?.[0]?.message || r.statusText}`);
  return body.data;
}

export async function evolutionSendText(cfg: Record<string, any>, number: string, text: string) {
  const base = String(cfg.base_url || '').replace(/\/+$/, '');
  const r = await fetch(`${base}/message/sendText/${encodeURIComponent(cfg.instance)}`, {
    method: 'POST',
    headers: { apikey: cfg.api_key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ number, text }),
  });
  if (!r.ok) throw new HttpError(502, `Evolution: ${r.status} ${(await r.text()).slice(0, 200)}`);
  return r.json().catch(() => ({}));
}

export async function resendSend(cfg: Record<string, any>, to: string, subject: string, html: string) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.api_key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: cfg.from, to: [to], subject, html, reply_to: cfg.reply_to || undefined }),
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new HttpError(502, `Resend: ${body.message || r.statusText}`);
  return body;
}

export function asaasBase(cfg: Record<string, any>) {
  return cfg.ambiente === 'producao' ? 'https://api.asaas.com/v3' : 'https://api-sandbox.asaas.com/v3';
}

export async function asaas(cfg: Record<string, any>, path: string, init: { method?: string; body?: unknown } = {}) {
  const r = await fetch(`${asaasBase(cfg)}${path}`, {
    method: init.method || 'GET',
    headers: { access_token: cfg.api_key, 'Content-Type': 'application/json', 'User-Agent': 'fpgd-crm' },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new HttpError(502, `Asaas: ${body.errors?.[0]?.description || r.statusText}`);
  return body;
}
