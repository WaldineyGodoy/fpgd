// CRM próprio do associado (white label). Cada associado usa as próprias credenciais.
// Acesso: o próprio associado (com CRM habilitado) ou o superadmin da FPGD (manutenção).
// Segredos nunca voltam ao navegador: só máscara e "preenchido".
import { renderPdf } from '../_shared/pdf.ts';
import {
  admin, handler, json, HttpError, asaas, onlyDigits, phoneBR, requireFields,
  evolutionSendText, evolutionSendDocument, resendSend, toBase64, maskSecret,
} from '../_shared/crm.ts';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.93.3';

const TENANT_SECRETS: Record<string, string[]> = {
  marca: [],
  evolution: ['api_key'],
  resend: ['api_key'],
  asaas: ['api_key', 'webhook_token'],
  contrato: [],
  openrouter: ['api_key'],
  mcp: ['token'],
};
const KEYS = Object.keys(TENANT_SECRETS);

async function requireTenant(req: Request, companyId: string) {
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) throw new HttpError(401, 'Sessão ausente.');
  const db = admin();
  const { data: { user }, error } = await db.auth.getUser(token);
  if (error || !user) throw new HttpError(401, 'Sessão inválida.');
  if (!companyId) throw new HttpError(400, 'Associado não informado.');
  const { data: me } = await db.from('companies').select('id, user_type, crm_habilitado').eq('auth_user_id', user.id).maybeSingle();
  const root = me?.user_type === 'superadmin';
  const owner = me?.id === companyId && me?.crm_habilitado === true;
  if (!root && !owner) throw new HttpError(403, 'Sem acesso a este CRM.');
  const { data: company } = await db.from('companies').select('*').eq('id', companyId).maybeSingle();
  if (!company) throw new HttpError(404, 'Associado não encontrado.');
  return { db, user, root, company };
}

async function getTenantConfig(db: SupabaseClient, companyId: string, chave: string) {
  const { data } = await db.from('tenant_config').select('valor').eq('company_id', companyId).eq('chave', chave).maybeSingle();
  return (data?.valor || {}) as Record<string, any>;
}

function redact(chave: string, valor: Record<string, any>) {
  const out: Record<string, any> = { ...valor };
  for (const f of TENANT_SECRETS[chave] || []) {
    out[f] = '';
    out[`${f}__set`] = Boolean(valor[f]);
    out[`${f}__mask`] = valor[f] ? maskSecret(String(valor[f])) : '';
  }
  return out;
}

async function logT(db: SupabaseClient, company_id: string, cliente_id: string | null, tipo: string, descricao: string, autor?: string) {
  await db.from('tenant_eventos').insert({ company_id, cliente_id, tipo, descricao, autor: autor ?? null });
}

async function getCliente(db: SupabaseClient, companyId: string, clienteId: string) {
  const { data } = await db.from('tenant_clientes').select('*').eq('id', clienteId).eq('company_id', companyId).maybeSingle();
  if (!data) throw new HttpError(404, 'Cliente não encontrado.');
  return data;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const textToHtml = (t: string, marca: Record<string, any>) =>
  `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#1b2433">${esc(t).replace(/\n/g, '<br>')}` +
  (marca.assinatura_email ? `<p style="margin-top:24px;color:#5b6577">${esc(marca.assinatura_email).replace(/\n/g, '<br>')}</p>` : '') + '</div>';

// ---------- MCP (Streamable HTTP / JSON-RPC) ----------
async function mcpCall(cfg: Record<string, any>, method: string, params: Record<string, unknown>, session?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
  };
  if (cfg.token) headers.Authorization = `Bearer ${cfg.token}`;
  if (session) headers['mcp-session-id'] = session;
  const r = await fetch(cfg.server_url, {
    method: 'POST', headers,
    body: JSON.stringify({ jsonrpc: '2.0', id: crypto.randomUUID(), method, params }),
  });
  if (!r.ok) throw new HttpError(502, `MCP respondeu ${r.status}`);
  const sid = r.headers.get('mcp-session-id') || session;
  const ct = r.headers.get('content-type') || '';
  const raw = await r.text();
  let msg: any = {};
  if (ct.includes('text/event-stream')) {
    const line = raw.split('\n').filter((l) => l.startsWith('data:')).pop();
    msg = line ? JSON.parse(line.slice(5).trim()) : {};
  } else msg = raw ? JSON.parse(raw) : {};
  if (msg.error) throw new HttpError(502, `MCP: ${msg.error.message || 'erro'}`);
  return { result: msg.result, session: sid };
}

async function mcpNotifyInitialized(cfg: Record<string, any>, session?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' };
  if (cfg.token) headers.Authorization = `Bearer ${cfg.token}`;
  if (session) headers['mcp-session-id'] = session;
  await fetch(cfg.server_url, { method: 'POST', headers, body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) }).catch(() => {});
}

// ---------- Cobranças ----------
async function upsertTenantCobranca(db: SupabaseClient, companyId: string, clienteId: string | null, p: Record<string, any>) {
  await db.from('tenant_cobrancas').upsert({
    company_id: companyId, cliente_id: clienteId, asaas_payment_id: p.id,
    descricao: p.description ?? null, valor: Number(p.value || 0), forma: p.billingType ?? null, status: p.status,
    vencimento: p.dueDate, pago_em: p.clientPaymentDate || p.paymentDate || null, invoice_url: p.invoiceUrl ?? null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'asaas_payment_id' });
}

Deno.serve(handler(async (req) => {
  const body = await req.json().catch(() => ({}));
  const action = body.action as string;
  const { db, user, company } = await requireTenant(req, body.company_id);
  const cid = company.id as string;

  if (action === 'config_get') {
    const { data } = await db.from('tenant_config').select('chave, valor, updated_at').eq('company_id', cid);
    const result: Record<string, any> = {};
    for (const k of KEYS) {
      const row = data?.find((r) => r.chave === k);
      result[k] = { ...redact(k, row?.valor || {}), __updated_at: row?.updated_at || null };
    }
    result.webhooks = { asaas: `${Deno.env.get('SUPABASE_URL')}/functions/v1/crm-webhooks?src=tenant-asaas&t=${cid}` };
    return json(result);
  }

  if (action === 'config_save') {
    const chave = body.chave as string;
    if (!KEYS.includes(chave)) throw new HttpError(400, 'Seção desconhecida.');
    const current = await getTenantConfig(db, cid, chave);
    const next: Record<string, any> = { ...current };
    for (const [k, v] of Object.entries((body.valor || {}) as Record<string, any>)) {
      if (k.includes('__')) continue;
      if ((TENANT_SECRETS[chave] || []).includes(k) && (v === '' || v == null)) continue;
      next[k] = typeof v === 'string' ? v.trim() : v;
    }
    if (body.limpar && (TENANT_SECRETS[chave] || []).includes(body.limpar)) delete next[body.limpar];
    const { error } = await db.from('tenant_config').upsert({
      company_id: cid, chave, valor: next, updated_at: new Date().toISOString(), updated_by: user.id,
    });
    if (error) throw new HttpError(500, error.message);
    return json({ ok: true, valor: redact(chave, next) });
  }

  if (action === 'test') {
    const chave = body.chave as string;
    const cfg = await getTenantConfig(db, cid, chave);
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
      return json({ ok: true, detalhe: `${b.data?.length ?? 0} domínio(s) na conta` });
    }
    if (chave === 'asaas') {
      requireFields(cfg, ['api_key'], 'Asaas');
      const b = await asaas(cfg, '/myAccount/commercialInfo');
      return json({ ok: true, detalhe: `Conta ${b.name || b.companyName || 'Asaas'} (${cfg.ambiente === 'producao' ? 'produção' : 'sandbox'})` });
    }
    if (chave === 'openrouter') {
      requireFields(cfg, ['api_key'], 'OpenRouter');
      const r = await fetch('https://openrouter.ai/api/v1/key', { headers: { Authorization: `Bearer ${cfg.api_key}` } });
      const b = await r.json().catch(() => ({}));
      if (!r.ok) throw new HttpError(502, `OpenRouter respondeu ${r.status}`);
      const d = b.data || {};
      const saldo = d.limit != null ? `limite US$ ${Number(d.limit).toFixed(2)}, uso US$ ${Number(d.usage || 0).toFixed(2)}` : `uso US$ ${Number(d.usage || 0).toFixed(2)}`;
      return json({ ok: true, detalhe: `Chave válida (${saldo})` });
    }
    if (chave === 'mcp') {
      requireFields(cfg, ['server_url'], 'MCP');
      const init = await mcpCall(cfg, 'initialize', {
        protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'fpgd-crm', version: '1.0' },
      });
      await mcpNotifyInitialized(cfg, init.session);
      const tools = await mcpCall(cfg, 'tools/list', {}, init.session).catch(() => ({ result: { tools: [] } }));
      const n = tools.result?.tools?.length ?? 0;
      const nome = init.result?.serverInfo?.name || cfg.harness || 'servidor';
      return json({ ok: true, detalhe: `${nome} conectado, ${n} ferramenta(s) disponível(is)` });
    }
    throw new HttpError(400, 'Nada para testar nesta seção.');
  }

  // ---------- Comunicação com o cliente ----------
  if (action === 'whatsapp') {
    const cli = await getCliente(db, cid, body.cliente_id);
    const cfg = await getTenantConfig(db, cid, 'evolution');
    requireFields(cfg, ['base_url', 'instance', 'api_key'], 'Evolution');
    const numero = phoneBR(cli.telefone);
    if (!numero) throw new HttpError(400, 'O cliente não tem telefone cadastrado.');
    const texto = String(body.texto || '').trim();
    if (!texto) throw new HttpError(400, 'Escreva a mensagem.');
    await evolutionSendText(cfg, numero, texto);
    await logT(db, cid, cli.id, 'whatsapp', `WhatsApp enviado: ${texto.slice(0, 140)}${texto.length > 140 ? '…' : ''}`, user.id);
    return json({ ok: true });
  }

  if (action === 'email') {
    const cli = await getCliente(db, cid, body.cliente_id);
    const cfg = await getTenantConfig(db, cid, 'resend');
    requireFields(cfg, ['api_key', 'from'], 'Resend');
    if (!cli.email) throw new HttpError(400, 'O cliente não tem e-mail cadastrado.');
    const assunto = String(body.assunto || '').trim() || 'Mensagem';
    const texto = String(body.texto || '').trim();
    if (!texto) throw new HttpError(400, 'Escreva a mensagem.');
    const marca = await getTenantConfig(db, cid, 'marca');
    await resendSend(cfg, cli.email, assunto, textToHtml(texto, marca));
    await logT(db, cid, cli.id, 'email', `E-mail enviado: ${assunto}`, user.id);
    return json({ ok: true });
  }

  if (action === 'contrato_enviar') {
    const { data: ct } = await db.from('tenant_contratos').select('*').eq('id', body.contrato_id).eq('company_id', cid).maybeSingle();
    if (!ct) throw new HttpError(404, 'Contrato não encontrado.');
    const cli = await getCliente(db, cid, ct.cliente_id);
    const marca = await getTenantConfig(db, cid, 'marca');
    const empresa = marca.nome_exibicao || company.nome_fantasia || company.razao_social || 'Integradora';
    const pdf = await renderPdf(`Contrato — ${empresa}`, ct.conteudo);
    const b64 = toBase64(pdf);
    const fileName = `contrato-${onlyDigits(cli.documento) || cli.id.slice(0, 8)}.pdf`;
    const enviados: string[] = [];
    const falhas: string[] = [];

    if (body.canais?.email) {
      try {
        const cfg = await getTenantConfig(db, cid, 'resend');
        requireFields(cfg, ['api_key', 'from'], 'Resend');
        if (!cli.email) throw new HttpError(400, 'cliente sem e-mail');
        const msg = `Olá, ${cli.nome}.\n\nSegue em anexo o contrato da ${empresa} para sua análise e assinatura.\n\nQualquer dúvida, responda este e-mail.`;
        await resendSend(cfg, cli.email, `Contrato — ${empresa}`, textToHtml(msg, marca), [{ filename: fileName, content: b64 }]);
        enviados.push('e-mail');
      } catch (e) { falhas.push(`e-mail: ${(e as Error).message}`); }
    }
    if (body.canais?.whatsapp) {
      try {
        const cfg = await getTenantConfig(db, cid, 'evolution');
        requireFields(cfg, ['base_url', 'instance', 'api_key'], 'Evolution');
        const numero = phoneBR(cli.telefone);
        if (!numero) throw new HttpError(400, 'cliente sem telefone');
        await evolutionSendDocument(cfg, numero, b64, fileName, `Olá, ${cli.nome}. Segue o contrato da ${empresa}.`);
        enviados.push('WhatsApp');
      } catch (e) { falhas.push(`WhatsApp: ${(e as Error).message}`); }
    }
    if (!enviados.length) throw new HttpError(502, falhas.join(' · ') || 'Escolha ao menos um canal.');
    await db.from('tenant_contratos').update({ status: 'enviado', enviado_em: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', ct.id);
    await logT(db, cid, cli.id, 'contrato', `Contrato enviado por ${enviados.join(' e ')}.`, user.id);
    return json({ ok: true, enviados, falhas });
  }

  // ---------- Cobrança no Asaas do associado ----------
  if (action === 'cobranca_criar') {
    const cli = await getCliente(db, cid, body.cliente_id);
    const cfg = await getTenantConfig(db, cid, 'asaas');
    requireFields(cfg, ['api_key'], 'Asaas');
    const doc = onlyDigits(cli.documento);
    if (!doc) throw new HttpError(400, 'Cadastre o CPF ou CNPJ do cliente antes de cobrar.');
    const valor = Number(body.valor);
    if (!(valor > 0)) throw new HttpError(400, 'Informe um valor maior que zero.');
    if (!body.vencimento) throw new HttpError(400, 'Informe o vencimento.');

    const found = await asaas(cfg, `/customers?cpfCnpj=${doc}`);
    let customer = found.data?.[0]?.id as string | undefined;
    if (!customer) {
      const c = await asaas(cfg, '/customers', {
        method: 'POST',
        body: {
          name: cli.nome, cpfCnpj: doc, email: cli.email || undefined, mobilePhone: onlyDigits(cli.telefone) || undefined,
          postalCode: onlyDigits(cli.cep) || undefined, externalReference: cli.id,
        },
      });
      customer = c.id;
    }
    const parcelas = Math.max(1, Math.min(24, Number(body.parcelas) || 1));
    const payload: Record<string, unknown> = {
      customer, billingType: body.forma || cfg.billing_type || 'UNDEFINED', dueDate: body.vencimento,
      description: body.descricao || `Sistema fotovoltaico — ${cli.nome}`, externalReference: cli.id,
    };
    if (parcelas > 1) { payload.installmentCount = parcelas; payload.totalValue = valor; } else payload.value = valor;
    const p = await asaas(cfg, '/payments', { method: 'POST', body: payload });
    let lista = [p];
    if (p.installment) {
      const inst = await asaas(cfg, `/installments/${p.installment}/payments`).catch(() => null);
      if (inst?.data?.length) lista = inst.data;
    }
    for (const x of lista) await upsertTenantCobranca(db, cid, cli.id, x);
    const v = `R$ ${valor.toFixed(2).replace('.', ',')}`;
    await logT(db, cid, cli.id, 'cobranca', `Cobrança de ${v}${parcelas > 1 ? ` em ${parcelas}x` : ''} criada no Asaas.`, user.id);
    return json({ ok: true, invoice_url: p.invoiceUrl });
  }

  if (action === 'cobranca_sync') {
    const cfg = await getTenantConfig(db, cid, 'asaas');
    requireFields(cfg, ['api_key'], 'Asaas');
    let q = db.from('tenant_cobrancas').select('id, asaas_payment_id, cliente_id').eq('company_id', cid).not('asaas_payment_id', 'is', null);
    if (body.cliente_id) q = q.eq('cliente_id', body.cliente_id);
    const { data } = await q.limit(200);
    for (const c of data || []) {
      const p = await asaas(cfg, `/payments/${c.asaas_payment_id}`).catch(() => null);
      if (p?.id) await upsertTenantCobranca(db, cid, c.cliente_id, p);
    }
    return json({ ok: true, total: data?.length || 0 });
  }

  // ---------- Assistente (OpenRouter) ----------
  if (action === 'ia') {
    const cfg = await getTenantConfig(db, cid, 'openrouter');
    requireFields(cfg, ['api_key'], 'OpenRouter');
    const marca = await getTenantConfig(db, cid, 'marca');
    const empresa = marca.nome_exibicao || company.nome_fantasia || company.razao_social || 'a integradora';
    let contexto = '';
    if (body.cliente_id) {
      const cli = await getCliente(db, cid, body.cliente_id);
      const { data: ev } = await db.from('tenant_eventos').select('descricao, created_at').eq('cliente_id', cli.id).order('created_at', { ascending: false }).limit(8);
      const { data: pr } = await db.from('tenant_propostas').select('titulo, potencia_kwp, preco_venda, economia_mensal, payback_anos, status').eq('cliente_id', cli.id).order('created_at', { ascending: false }).limit(3);
      contexto = JSON.stringify({
        cliente: { nome: cli.nome, cidade: cli.cidade, uf: cli.uf, etapa: cli.etapa, consumo_kwh: cli.consumo_kwh, potencia_kwp: cli.potencia_kwp, observacoes: cli.observacoes },
        propostas: pr || [], historico: (ev || []).map((e) => e.descricao),
      });
    }
    const system = (cfg.system_prompt as string) ||
      `Você é o assistente comercial da ${empresa}, integradora de energia solar. Escreva em português do Brasil, tom cordial e direto, sem inventar números que não estejam no contexto.`;
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.api_key}`, 'Content-Type': 'application/json', 'X-Title': 'FPGD CRM' },
      body: JSON.stringify({
        model: cfg.model || 'openrouter/auto',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: `${contexto ? `Contexto do cliente: ${contexto}\n\n` : ''}${String(body.pedido || 'Escreva uma mensagem de acompanhamento para WhatsApp.')}` },
        ],
        max_tokens: 700,
      }),
    });
    const b = await r.json().catch(() => ({}));
    if (!r.ok) throw new HttpError(502, `OpenRouter: ${b.error?.message || r.status}`);
    return json({ ok: true, texto: b.choices?.[0]?.message?.content?.trim() || '', modelo: b.model });
  }

  throw new HttpError(400, 'Ação inválida.');
}));
