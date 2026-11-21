import React, { useCallback, useEffect, useState } from 'react';
import {
  ChevronDown, Palette, MessageCircle, Mail, CreditCard, FileText, Sparkles, Plug, Save, Zap, CheckCircle2, AlertTriangle, Copy, KeyRound,
} from 'lucide-react';
import { tenantFn, DEFAULT_CONTRATO_CLIENTE, CONTRATO_CLIENTE_VARS } from './data';
import { useToast } from '../crm/ui';

type FieldDef =
  | { k: string; label: string; type?: 'text' | 'url' | 'textarea'; placeholder?: string; hint?: string; secret?: boolean }
  | { k: string; label: string; type: 'select'; options: [string, string][]; hint?: string; secret?: false; placeholder?: undefined };

interface SectionDef {
  id: string;
  title: string;
  desc: string;
  icon: React.ElementType;
  fields: FieldDef[];
  required: string[];
  test?: boolean;
  webhook?: boolean;
}

const SECTIONS: SectionDef[] = [
  {
    id: 'marca', title: 'Marca', icon: Palette,
    desc: 'Nome e logo que aparecem no CRM, nas mensagens e nos contratos enviados aos clientes.',
    required: ['nome_exibicao'],
    fields: [
      { k: 'nome_exibicao', label: 'Nome exibido', placeholder: 'Ex.: Sol do Agreste Energia' },
      { k: 'logo_url', label: 'Logo (endereço da imagem)', type: 'url', placeholder: 'https://…/logo.png', hint: 'PNG ou SVG com fundo transparente fica melhor sobre o tema escuro.' },
      { k: 'site', label: 'Site', type: 'url', placeholder: 'https://' },
      { k: 'assinatura_email', label: 'Assinatura dos e-mails', type: 'textarea', placeholder: 'Equipe comercial\n(84) 9 9999-9999' },
    ],
  },
  {
    id: 'evolution', title: 'WhatsApp · Evolution API', icon: MessageCircle, test: true,
    desc: 'Instância própria do associado para conversar com os clientes e enviar contratos em PDF.',
    required: ['base_url', 'instance', 'api_key'],
    fields: [
      { k: 'base_url', label: 'URL do servidor', type: 'url', placeholder: 'https://evolution.suaempresa.com.br' },
      { k: 'instance', label: 'Instância', placeholder: 'comercial' },
      { k: 'api_key', label: 'API key', secret: true },
    ],
  },
  {
    id: 'resend', title: 'E-mail · Resend', icon: Mail, test: true,
    desc: 'Envia propostas, contratos e lembretes a partir do domínio do associado.',
    required: ['from', 'api_key'],
    fields: [
      { k: 'from', label: 'Remetente', placeholder: 'Sol do Agreste <contato@soldoagreste.com.br>', hint: 'O domínio precisa estar verificado na conta Resend.' },
      { k: 'reply_to', label: 'Responder para', placeholder: 'comercial@soldoagreste.com.br' },
      { k: 'api_key', label: 'API key', secret: true },
    ],
  },
  {
    id: 'asaas', title: 'Cobrança · Asaas', icon: CreditCard, test: true, webhook: true,
    desc: 'Conta Asaas do associado para cobrar os próprios clientes por Pix, boleto ou cartão.',
    required: ['api_key'],
    fields: [
      { k: 'ambiente', label: 'Ambiente', type: 'select', options: [['sandbox', 'Sandbox (testes)'], ['producao', 'Produção']] },
      { k: 'billing_type', label: 'Forma padrão', type: 'select', options: [['UNDEFINED', 'Cliente escolhe'], ['PIX', 'Pix'], ['BOLETO', 'Boleto'], ['CREDIT_CARD', 'Cartão de crédito']] },
      { k: 'api_key', label: 'API key', secret: true },
      { k: 'webhook_token', label: 'Token do webhook', secret: true, hint: 'Crie um token qualquer e cole o mesmo no webhook do Asaas.' },
    ],
  },
  {
    id: 'contrato', title: 'Contrato do cliente', icon: FileText,
    desc: 'Modelo do contrato que o associado assina com o cliente final. Preenchido com os dados do cliente e da proposta.',
    required: ['template'],
    fields: [],
  },
  {
    id: 'openrouter', title: 'Assistente · OpenRouter', icon: Sparkles, test: true,
    desc: 'Modelo de IA que rascunha mensagens de acompanhamento, resumos e respostas aos clientes.',
    required: ['api_key'],
    fields: [
      { k: 'model', label: 'Modelo', placeholder: 'openrouter/auto', hint: 'Qualquer identificador do catálogo OpenRouter, como anthropic/claude-sonnet-4.5.' },
      { k: 'api_key', label: 'API key', secret: true },
      { k: 'system_prompt', label: 'Instruções do assistente', type: 'textarea', placeholder: 'Tom de voz, o que nunca prometer, como assinar…' },
    ],
  },
  {
    id: 'mcp', title: 'Conexão MCP', icon: Plug, test: true,
    desc: 'Liga o CRM a um harness de agentes por MCP (Streamable HTTP). O chat de agentes do associado usa esta conexão na próxima etapa.',
    required: ['server_url'],
    fields: [
      { k: 'harness', label: 'Nome do harness', placeholder: 'Ex.: agentes comerciais' },
      { k: 'server_url', label: 'URL do servidor MCP', type: 'url', placeholder: 'https://mcp.suaempresa.com.br/mcp' },
      { k: 'token', label: 'Token de acesso', secret: true, hint: 'Enviado como Authorization: Bearer.' },
    ],
  },
];

type Config = Record<string, Record<string, any>>;

const isSet = (sec: SectionDef, v: Record<string, any> = {}) =>
  sec.required.every((k) => (v[`${k}__set`] !== undefined ? v[`${k}__set`] : Boolean(v[k])));

const TenantConfigPanel: React.FC<{ companyId: string; onSaved?: (chave: string) => void; initialOpen?: string }> = ({ companyId, onSaved, initialOpen }) => {
  const toast = useToast();
  const [cfg, setCfg] = useState<Config | null>(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState<string | null>(initialOpen ?? null);

  const load = useCallback(async () => {
    setError('');
    try { setCfg(await tenantFn<Config>(companyId, 'config_get')); }
    catch (e) { setError((e as Error).message); }
  }, [companyId]);
  useEffect(() => { load(); }, [load]);

  if (error) {
    return (
      <div className="rounded-[10px] border border-danger/30 bg-danger/5 p-4 text-sm">
        Não foi possível abrir as configurações: {error} <button className="text-primary underline ml-1" onClick={load}>Tentar de novo</button>
      </div>
    );
  }
  if (!cfg) return <div className="space-y-2">{SECTIONS.map((s) => <div key={s.id} className="skeleton h-[68px]" />)}</div>;

  const prontas = SECTIONS.filter((s) => isSet(s, cfg[s.id])).length;

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 h-1.5 rounded-full bg-raised overflow-hidden" aria-hidden>
          <div className="h-full bg-primary rounded-full transition-[width] duration-500" style={{ width: `${(prontas / SECTIONS.length) * 100}%` }} />
        </div>
        <p className="text-xs text-fg-3 tabular-nums whitespace-nowrap"><b className="text-fg">{prontas}</b> de {SECTIONS.length} prontas</p>
      </div>
      <ul className="rounded-[16px] border border-line divide-y divide-line overflow-hidden">
        {SECTIONS.map((s) => (
          <Section key={s.id} sec={s} value={cfg[s.id] || {}} open={open === s.id}
            webhookUrl={s.webhook ? cfg.webhooks?.asaas : undefined}
            onToggle={() => setOpen((o) => (o === s.id ? null : s.id))}
            onSave={async (valor, limpar) => {
              const r = await tenantFn<{ valor: Record<string, any> }>(companyId, 'config_save', { chave: s.id, valor, limpar });
              setCfg((c) => ({ ...(c || {}), [s.id]: { ...r.valor, __updated_at: new Date().toISOString() } }));
              toast('ok', `${s.title}: salvo.`);
              onSaved?.(s.id);
            }}
            onTest={() => tenantFn<{ detalhe: string }>(companyId, 'test', { chave: s.id })}
          />
        ))}
      </ul>
      <p className="mt-3 text-xs text-fg-3 flex items-center gap-1.5">
        <KeyRound size={13} /> Chaves ficam no servidor e nunca voltam para a tela: aparece só o final de cada uma.
      </p>
    </div>
  );
};

const Section: React.FC<{
  sec: SectionDef;
  value: Record<string, any>;
  open: boolean;
  webhookUrl?: string;
  onToggle: () => void;
  onSave: (v: Record<string, any>, limpar?: string) => Promise<void>;
  onTest: () => Promise<{ detalhe: string }>;
}> = ({ sec, value, open, webhookUrl, onToggle, onSave, onTest }) => {
  const toast = useToast();
  const [form, setForm] = useState<Record<string, any>>({});
  const [busy, setBusy] = useState<'save' | 'test' | null>(null);
  const [test, setTest] = useState<{ ok: boolean; text: string } | null>(null);
  const pronta = isSet(sec, value);

  useEffect(() => {
    const f: Record<string, any> = {};
    for (const fd of sec.fields) f[fd.k] = fd.secret ? '' : value[fd.k] ?? (fd.type === 'select' ? fd.options[0][0] : '');
    if (sec.id === 'contrato') f.template = value.template || DEFAULT_CONTRATO_CLIENTE;
    setForm(f);
  }, [sec, value]);

  const dirty = sec.fields.some((fd) => (fd.secret ? form[fd.k] : (form[fd.k] ?? '') !== (value[fd.k] ?? (fd.type === 'select' ? fd.options[0][0] : ''))))
    || (sec.id === 'contrato' && form.template !== (value.template || DEFAULT_CONTRATO_CLIENTE))
    || (sec.id === 'contrato' && !value.template);

  const save = async (limpar?: string) => {
    setBusy('save');
    try { await onSave(form, limpar); setTest(null); }
    catch (e) { toast('error', `${sec.title}: ${(e as Error).message}`); }
    setBusy(null);
  };
  const runTest = async () => {
    setBusy('test');
    try { const r = await onTest(); setTest({ ok: true, text: r.detalhe }); }
    catch (e) { setTest({ ok: false, text: (e as Error).message }); }
    setBusy(null);
  };

  return (
    <li className={open ? 'bg-panel' : 'bg-panel/40'}>
      <button className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-raised/50 transition-colors" onClick={onToggle} aria-expanded={open}>
        <span className="size-9 shrink-0 rounded-[10px] bg-raised border border-line grid place-items-center text-fg-2"><sec.icon size={17} /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold">{sec.title}</span>
          <span className={`block text-xs text-fg-3 ${open ? '' : 'truncate'}`}>{sec.desc}</span>
        </span>
        <span className={`text-xs font-semibold whitespace-nowrap ${pronta ? 'text-ok' : 'text-fg-3'}`}>{pronta ? 'Pronta' : 'Pendente'}</span>
        <ChevronDown size={16} className={`text-fg-3 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 animate-[sheet-in_.2s_cubic-bezier(.23,1,.32,1)]">
          {sec.id === 'contrato' ? (
            <div>
              <textarea className="field min-h-[320px] font-[inherit] leading-relaxed text-[13px]" value={form.template || ''}
                onChange={(e) => setForm((f) => ({ ...f, template: e.target.value }))} spellCheck />
              <p className="mt-2 text-xs text-fg-3">Campos preenchidos automaticamente (clique para copiar):</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {CONTRATO_CLIENTE_VARS.map((v) => (
                  <button key={v} type="button" className="h-6 px-2 rounded-full bg-raised border border-line text-xs text-fg-2 hover:text-fg hover:border-line-strong tabular-nums"
                    onClick={() => { navigator.clipboard?.writeText(`{{${v}}}`); toast('ok', `{{${v}}} copiado.`); }}>
                    {`{{${v}}}`}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {sec.fields.map((fd) => {
                const wide = fd.type === 'textarea' || fd.k === 'base_url' || fd.k === 'server_url' || fd.k === 'from' || fd.k === 'logo_url';
                const savedMask = fd.secret ? value[`${fd.k}__mask`] : '';
                return (
                  <label key={fd.k} className={`block ${wide ? 'sm:col-span-2' : ''}`}>
                    <span className="label">{fd.label}</span>
                    {fd.type === 'select' ? (
                      <select className="field" value={form[fd.k] ?? ''} onChange={(e) => setForm((f) => ({ ...f, [fd.k]: e.target.value }))}>
                        {fd.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    ) : fd.type === 'textarea' ? (
                      <textarea className="field min-h-[84px]" placeholder={fd.placeholder} value={form[fd.k] ?? ''} onChange={(e) => setForm((f) => ({ ...f, [fd.k]: e.target.value }))} />
                    ) : (
                      <input className="field" type={fd.secret ? 'password' : fd.type === 'url' ? 'url' : 'text'} autoComplete="off" spellCheck={false}
                        placeholder={fd.secret ? (savedMask ? `Guardada ${savedMask} · deixe vazio para manter` : 'Cole a chave aqui') : fd.placeholder}
                        value={form[fd.k] ?? ''} onChange={(e) => setForm((f) => ({ ...f, [fd.k]: e.target.value }))} />
                    )}
                    {(fd.hint || (fd.secret && savedMask)) && (
                      <span className="mt-1.5 flex items-center gap-2 text-xs text-fg-3">
                        <span className="flex-1">{fd.hint}</span>
                        {fd.secret && savedMask && (
                          <button type="button" className="text-danger-text hover:underline whitespace-nowrap" onClick={() => { if (confirm(`Apagar ${fd.label.toLowerCase()} guardada?`)) save(fd.k); }}>
                            Apagar chave
                          </button>
                        )}
                      </span>
                    )}
                  </label>
                );
              })}
              {sec.id === 'marca' && form.logo_url && (
                <div className="sm:col-span-2 flex items-center gap-3 rounded-[10px] bg-field border border-line p-3">
                  <img src={form.logo_url} alt="Prévia do logo" className="h-9 max-w-[180px] object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0.2'; }} />
                  <span className="text-xs text-fg-3">Prévia do logo sobre o tema do CRM</span>
                </div>
              )}
            </div>
          )}

          {webhookUrl && (
            <div className="mt-3 rounded-[10px] bg-field border border-line p-3">
              <p className="text-xs font-semibold text-fg-2">URL do webhook (cole no painel do Asaas)</p>
              <div className="mt-1.5 flex items-center gap-2">
                <code className="flex-1 min-w-0 truncate text-xs text-fg tabular-nums">{webhookUrl}</code>
                <button type="button" className="btn btn-ghost btn-sm !px-2" onClick={() => { navigator.clipboard?.writeText(webhookUrl); toast('ok', 'URL copiada.'); }} aria-label="Copiar URL do webhook"><Copy size={14} /></button>
              </div>
            </div>
          )}

          {test && (
            <p className={`mt-3 text-sm flex items-start gap-2 ${test.ok ? 'text-ok' : 'text-danger-text'}`} role="status">
              {test.ok ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <AlertTriangle size={16} className="mt-0.5 shrink-0" />}
              <span>{test.text}</span>
            </p>
          )}

          <div className="mt-4 flex items-center justify-end gap-2">
            {value.__updated_at && <span className="mr-auto text-xs text-fg-3 tabular-nums">Salvo em {new Date(value.__updated_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>}
            {sec.test && (
              <button className="btn btn-secondary btn-sm" onClick={runTest} disabled={busy !== null || !pronta || dirty} title={dirty ? 'Salve antes de testar' : undefined}>
                <Zap size={14} /> {busy === 'test' ? 'Testando…' : 'Testar conexão'}
              </button>
            )}
            <button className="btn btn-primary btn-sm" onClick={() => save()} disabled={busy !== null || !dirty}>
              <Save size={14} /> {busy === 'save' ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </div>
      )}
    </li>
  );
};

export default TenantConfigPanel;
