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
export const CREDENTIAL_KEYS = ['documenso', 'autentique', 'evolution', 'resend', 'asaas'];

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
  documenso: ['api_token', 'webhook_secret'],
  autentique: ['token', 'webhook_token'],
  evolution: ['api_key'],
  resend: ['api_key'],
  asaas: ['api_key_sandbox', 'api_key_producao', 'webhook_token'],
  automacao: [],
  contrato: [],
};

export async function getConfig<T = Record<string, any>>(db: SupabaseClient, chave: string): Promise<T> {
  const { data } = await db.from('crm_config').select('valor').eq('chave', chave).maybeSingle();
  return normalizeConfig(chave, data?.valor) as T;
}

/** Asaas: a chave antiga única (era a de produção) passa a ser api_key_producao. */
export function normalizeConfig(chave: string, valor?: Record<string, any> | null) {
  const v = { ...(valor || {}) } as Record<string, any>;
  if (chave === 'asaas') {
    if (v.api_key && !v.api_key_producao) v.api_key_producao = v.api_key;
    delete v.api_key;
  }
  return v;
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

/** Envia um PDF como documento pelo WhatsApp (Evolution API). */
export async function evolutionSendDocument(cfg: Record<string, any>, number: string, base64: string, fileName: string, caption = '') {
  const base = String(cfg.base_url || '').replace(/\/+$/, '');
  const r = await fetch(`${base}/message/sendMedia/${encodeURIComponent(cfg.instance)}`, {
    method: 'POST',
    headers: { apikey: cfg.api_key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ number, mediatype: 'document', mimetype: 'application/pdf', media: base64, fileName, caption }),
  });
  if (!r.ok) throw new HttpError(502, `Evolution: ${r.status} ${(await r.text()).slice(0, 200)}`);
  return r.json().catch(() => ({}));
}

export type Anexo = { filename: string; content: string }; // content em base64

export async function resendSend(cfg: Record<string, any>, to: string, subject: string, html: string, attachments?: Anexo[]) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.api_key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: cfg.from, to: [to], subject, html, reply_to: cfg.reply_to || undefined, attachments }),
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new HttpError(502, `Resend: ${body.message || r.statusText}`);
  return body;
}

/** Chave do Asaas do ambiente escolhido (cada ambiente guarda a sua). CRM do associado usa api_key. */
export function asaasKey(cfg: Record<string, any>) {
  const k = cfg.ambiente === 'producao' ? cfg.api_key_producao : cfg.api_key_sandbox;
  return (k || cfg.api_key) as string | undefined;
}

export function requireAsaas(cfg: Record<string, any>) {
  if (!asaasKey(cfg)) {
    throw new HttpError(400, `Asaas: configure a chave de ${cfg.ambiente === 'producao' ? 'produção' : 'sandbox'} em Configurações.`);
  }
}

export function asaasBase(cfg: Record<string, any>) {
  return cfg.ambiente === 'producao' ? 'https://api.asaas.com/v3' : 'https://api-sandbox.asaas.com/v3';
}

export async function asaas(cfg: Record<string, any>, path: string, init: { method?: string; body?: unknown } = {}) {
  const r = await fetch(`${asaasBase(cfg)}${path}`, {
    method: init.method || 'GET',
    headers: { access_token: asaasKey(cfg) as string, 'Content-Type': 'application/json', 'User-Agent': 'fpgd-crm' },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new HttpError(502, `Asaas: ${body.errors?.[0]?.description || r.statusText}`);
  return body;
}

export function toBase64(bytes: Uint8Array) {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

export const maskSecret = (v: string) => (v.length <= 4 ? '••••' : `••••${v.slice(-4)}`);

// ---------- Documenso (API v1 da instância própria) ----------
export const DOCUMENSO_URL = 'https://docs.b2wenergia.com.br';
const documensoBase = (cfg: Record<string, any>) => String(cfg.base_url || DOCUMENSO_URL).replace(/\/+$/, '');

export async function documenso(cfg: Record<string, any>, path: string, init: { method?: string; body?: unknown } = {}) {
  const r = await fetch(`${documensoBase(cfg)}/api/v1${path}`, {
    method: init.method || 'GET',
    headers: { Authorization: cfg.api_token, 'Content-Type': 'application/json' },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new HttpError(502, `Documenso: ${body.message || body.error || r.status + ' ' + r.statusText}`);
  return body;
}

export interface DocumensoEnvio {
  titulo: string; pdf: Uint8Array; externalId: string;
  signatario: { nome: string; email: string };
  campo: { page: number; x: number; y: number; w: number; h: number } | null;
  assunto?: string; mensagem?: string; enviarEmail: boolean;
}

/** Cria o documento, sobe o PDF, posiciona a assinatura e distribui. Devolve id e link de assinatura. */
export async function documensoEnviar(cfg: Record<string, any>, e: DocumensoEnvio) {
  const created = await documenso(cfg, '/documents', {
    method: 'POST',
    body: {
      title: e.titulo, externalId: e.externalId,
      recipients: [{ name: e.signatario.nome, email: e.signatario.email, role: 'SIGNER' }],
      meta: {
        subject: e.assunto || e.titulo, message: e.mensagem || undefined,
        language: 'pt-BR', timezone: 'America/Fortaleza', dateFormat: 'dd/MM/yyyy HH:mm',
        distributionMethod: e.enviarEmail ? 'EMAIL' : 'NONE',
      },
    },
  });
  const up = await fetch(created.uploadUrl, { method: 'PUT', headers: { 'Content-Type': 'application/pdf' }, body: e.pdf });
  if (!up.ok) throw new HttpError(502, `Documenso: falha ao enviar o PDF (${up.status}).`);
  const rec = created.recipients?.[0];
  const c = e.campo || { page: 1, x: 10, y: 80, w: 40, h: 8 };
  await documenso(cfg, `/documents/${created.documentId}/fields`, {
    method: 'POST',
    body: { recipientId: rec.recipientId, type: 'SIGNATURE', pageNumber: c.page, pageX: c.x, pageY: c.y, pageWidth: c.w, pageHeight: c.h },
  });
  await documenso(cfg, `/documents/${created.documentId}/send`, { method: 'POST', body: { sendEmail: e.enviarEmail, sendCompletionEmails: true } });
  return { documentId: String(created.documentId), link: rec?.signingUrl as string | null };
}

/** Situação do documento no Documenso: assinado, recusado ou enviado. */
export async function documensoStatus(cfg: Record<string, any>, documentId: string) {
  const d = await documenso(cfg, `/documents/${documentId}`);
  const st = String(d.status || '').toUpperCase();
  const recs = (d.recipients || []) as any[];
  if (st === 'REJECTED' || recs.some((r) => String(r.signingStatus).toUpperCase() === 'REJECTED')) return 'recusado';
  if (st === 'COMPLETED') return 'assinado';
  return 'enviado';
}

// ---------- Automação da adesão ----------

/** Data de hoje (AAAA-MM-DD) no fuso do RN. */
export const hojeRN = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Fortaleza' });

export function somarDias(iso: string, dias: number) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** Próximo dia `dia` do mês que caia pelo menos `folga` dias depois de hoje. */
export function proximoVencimento(dia: number, folga = 0) {
  const limite = somarDias(hojeRN(), folga);
  const [y, m] = hojeRN().split('-').map(Number);
  for (let i = 0; i < 3; i++) {
    const iso = new Date(Date.UTC(y, m - 1 + i, Math.min(dia, 28))).toISOString().slice(0, 10);
    if (iso > limite) return iso;
  }
  return somarDias(limite, 30);
}

const brlFmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dataFmt = (iso: string) => iso.slice(0, 10).split('-').reverse().join('/');

/** Cliente do associado no Asaas (reaproveita, busca pelo CNPJ ou cria). */
export async function asaasCliente(cfg: Record<string, any>, c: Record<string, any>, existente?: string | null, notificar = false) {
  if (existente) return existente;
  const doc = onlyDigits(c.cnpj);
  const found = await asaas(cfg, `/customers?cpfCnpj=${doc}`);
  if (found.data?.[0]?.id) return found.data[0].id as string;
  const created = await asaas(cfg, '/customers', {
    method: 'POST',
    body: {
      name: c.razao_social || c.nome_fantasia, cpfCnpj: doc, email: c.email || undefined,
      mobilePhone: onlyDigits(c.telefone) || undefined, postalCode: onlyDigits(c.cep) || undefined,
      address: c.logradouro || undefined, addressNumber: c.numero || undefined, province: c.bairro || undefined,
      externalReference: c.id, notificationDisabled: !notificar,
    },
  });
  return created.id as string;
}

/**
 * Envia o boleto/fatura ao associado pelo WhatsApp (Evolution) e e-mail (Resend).
 * Marca cobrancas.notificado_em para nunca mandar a mesma cobrança duas vezes.
 */
export async function notificarCobranca(db: SupabaseClient, p: Record<string, any>, companyId: string, primeira = false) {
  const { data: cb } = await db.from('cobrancas').select('id, notificado_em').eq('asaas_payment_id', p.id).maybeSingle();
  if (cb?.notificado_em) return { enviados: [] as string[], avisos: [] as string[] };
  const { data: c } = await db.from('companies').select('nome_fantasia, razao_social, contato_nome, email, telefone').eq('id', companyId).single();
  const nome = c.nome_fantasia || c.razao_social || 'associado';
  const ola = c.contato_nome ? `Olá, ${String(c.contato_nome).split(' ')[0]}!` : 'Olá!';
  const valor = brlFmt(Number(p.value || 0));
  const venc = dataFmt(String(p.dueDate));
  const link = p.invoiceUrl as string;
  const boleto = (p.bankSlipUrl as string) || null;
  const assunto = primeira ? `Boleto de adesão à FPGD RN — ${valor}` : `Mensalidade FPGD RN — vence em ${venc}`;
  const texto = primeira
    ? `${ola} Bem-vindo à FPGD RN. O boleto da adesão (1ª mensalidade) de ${valor} vence em ${venc}. Assim que for pago, sua associação fica ativa. Pague por aqui: ${link}`
    : `${ola} Sua mensalidade da FPGD RN de ${valor} vence em ${venc}. Pague por aqui: ${link}`;
  const enviados: string[] = [];
  const avisos: string[] = [];

  if (c.telefone) {
    try {
      const evo = await getConfig(db, 'evolution');
      requireFields(evo, ['base_url', 'instance', 'api_key'], 'Evolution');
      await evolutionSendText(evo, phoneBR(c.telefone), texto);
      enviados.push('WhatsApp');
    } catch (e) { avisos.push((e as Error).message); }
  }
  if (c.email) {
    try {
      const rs = await getConfig(db, 'resend');
      requireFields(rs, ['api_key', 'from'], 'Resend');
      const corpo = primeira
        ? `Bem-vindo à <b>FPGD RN</b>. O boleto da adesão da <b>${nome}</b> (1ª mensalidade) está disponível. Assim que for pago, a associação fica ativa e as próximas mensalidades passam a chegar todo mês.`
        : `A mensalidade da <b>${nome}</b> à FPGD RN está disponível.`;
      await resendSend(rs, c.email, assunto, `
        <div style="font-family:Arial,sans-serif;font-size:15px;color:#0B1F3A;line-height:1.55">
          <p>${ola}</p>
          <p>${corpo}</p>
          <p style="font-size:17px"><b>${valor}</b> · vence em <b>${venc}</b></p>
          <p><a href="${link}" style="background:#1747A6;color:#fff;padding:12px 20px;text-decoration:none;display:inline-block">Pagar agora</a></p>
          ${boleto ? `<p style="font-size:13px"><a href="${boleto}">Baixar o boleto em PDF</a></p>` : ''}
          <p style="color:#4b5a70;font-size:13px">FPGD RN · Frente Potiguar de Geração Distribuída</p>
        </div>`);
      enviados.push('e-mail');
    } catch (e) { avisos.push((e as Error).message); }
  }
  if (enviados.length) {
    await db.from('cobrancas').update({ notificado_em: new Date().toISOString() }).eq('asaas_payment_id', p.id);
    await logEvento(db, companyId, 'cobranca', `${primeira ? 'Boleto de adesão' : 'Mensalidade'} de ${valor} (vence ${venc}) enviado por ${enviados.join(' e ')}.`);
  } else {
    await logEvento(db, companyId, 'cobranca', `Cobrança de ${valor} criada, mas não foi enviada: ${avisos.join(' · ') || 'associado sem e-mail e sem telefone'}.`);
  }
  return { enviados, avisos };
}

/** Depois do 1º pagamento: cria a assinatura mensal no Asaas a partir do próximo vencimento do plano. */
export async function ativarRecorrencia(db: SupabaseClient, companyId: string) {
  const { data: fin } = await db.from('associado_financeiro').select('*').eq('company_id', companyId).maybeSingle();
  if (!fin || fin.asaas_subscription_id) return null;
  const { data: c } = await db.from('companies').select('*').eq('id', companyId).single();
  const { data: plano } = await db.from('planos').select('*').eq('id', c.plano_id).maybeSingle();
  if (!plano) throw new HttpError(400, 'Associado sem plano: não dá para ligar a cobrança recorrente.');
  const cfg = await getConfig(db, 'asaas');
  requireAsaas(cfg);
  const customer = await asaasCliente(cfg, c, fin.asaas_customer_id);
  const due = proximoVencimento(plano.dia_vencimento, 20);
  const sub = await asaas(cfg, '/subscriptions', {
    method: 'POST',
    body: {
      customer, billingType: cfg.billing_type && cfg.billing_type !== 'UNDEFINED' ? cfg.billing_type : 'BOLETO',
      value: Number(plano.valor), nextDueDate: due, cycle: plano.ciclo,
      description: `Mensalidade FPGD RN — ${plano.nome}`, externalReference: c.id,
    },
  });
  await db.from('associado_financeiro').update({
    asaas_customer_id: customer, asaas_subscription_id: sub.id, status_assinatura: sub.status || 'ACTIVE',
    proximo_vencimento: sub.nextDueDate || due, valor: plano.valor, updated_at: new Date().toISOString(),
  }).eq('company_id', companyId);
  await logEvento(db, companyId, 'cobranca', `Cobrança recorrente ligada no Asaas: ${plano.nome}, ${brlFmt(Number(plano.valor))}, próximo vencimento ${dataFmt(due)}.`);
  return sub;
}
