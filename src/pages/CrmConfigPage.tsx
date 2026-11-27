import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Save, PlugZap, Trash2, Copy, Eye, EyeOff, Lock, Check, ShieldCheck, Webhook } from 'lucide-react';
import { setTicketsEnabled, useTicketsEnabled } from '../crm/settings';
import { matriculaLabel, nomeAssociado } from '../crm/data';
import { supabase } from '../supabaseClient';
import { CICLO_LABEL, CONTRATO_VARS, DEFAULT_CONTRATO, brl, callFn, type Plano } from '../crm/data';
import { Field, PageHeader, useToast } from '../crm/ui';
import { useSession } from '../components/AppLayout';

type SectionId = 'sistema' | 'planos' | 'contrato' | 'evolution' | 'resend' | 'asaas';
const SECTIONS: { id: SectionId; label: string; desc: string }[] = [
  { id: 'sistema', label: 'Sistema e acessos', desc: 'Módulo de tickets e administradores' },
  { id: 'planos', label: 'Planos e valores', desc: 'Mensalidades oferecidas aos associados' },
  { id: 'contrato', label: 'Contrato e assinatura', desc: 'Modelo do contrato e Documenso' },
  { id: 'evolution', label: 'Evolution', desc: 'WhatsApp' },
  { id: 'resend', label: 'Resend', desc: 'E-mail transacional' },
  { id: 'asaas', label: 'Asaas', desc: 'Cobrança recorrente' },
];

type Cfg = Record<string, any>;
/** Credenciais e API keys: visíveis e editáveis só pelo superadmin. */
const CREDENCIAIS: SectionId[] = ['evolution', 'resend', 'asaas'];

const CrmConfigPage: React.FC = () => {
  const { role, canManage } = useSession();
  const readOnly = !canManage;
  const [section, setSection] = useState<SectionId>('sistema');
  const [cfg, setCfg] = useState<Record<string, Cfg> | null>(null);
  const [cfgError, setCfgError] = useState('');

  const loadCfg = useCallback(async () => {
    try { setCfg(await callFn('crm-config', { action: 'get' })); setCfgError(''); }
    catch (e) { setCfgError((e as Error).message); }
  }, []);
  useEffect(() => { loadCfg(); }, [loadCfg]);

  return (
    <div>
      <PageHeader title="Configurações do CRM"
        description="Planos, contrato e credenciais das integrações. Credenciais e API keys são exclusivas do superadmin; ficam no servidor e nunca voltam inteiras para o navegador." />

      {readOnly && (
        <div className="panel p-3.5 mb-5 flex items-center gap-3 text-sm text-fg-2"><Lock size={16} className="text-fg-3" /> Você pode consultar as configurações. Só superadmin e admins podem alterá-las.</div>
      )}

      <div className="grid lg:grid-cols-[240px_1fr] gap-6 items-start">
        <nav className="panel p-2 lg:sticky lg:top-4 flex lg:flex-col gap-1 overflow-x-auto" aria-label="Seções">
          {SECTIONS.filter((s) => role === 'superadmin' || !CREDENCIAIS.includes(s.id)).map((s) => {
            const active = section === s.id;
            const ok = !['planos', 'sistema'].includes(s.id) && cfg && isConfigured(s.id, cfg[s.id === 'contrato' ? 'documenso' : s.id]);
            return (
              <button key={s.id} onClick={() => setSection(s.id)}
                className={`text-left rounded-[10px] px-3 py-2.5 shrink-0 transition-colors ${active ? 'bg-energy-soft text-fg' : 'text-fg-2 hover:bg-raised hover:text-fg'}`}>
                <span className="flex items-center gap-2 text-sm font-semibold">
                  {s.label}
                  {ok && <Check size={14} className="text-ok" aria-label="configurado" />}
                </span>
                <span className="hidden lg:block text-xs text-fg-3 mt-0.5">{s.desc}</span>
              </button>
            );
          })}
        </nav>

        <div className="min-w-0">
          {cfgError && !['planos', 'sistema'].includes(section) && (
            <div className="panel p-4 mb-4 text-sm">Não foi possível ler as configurações: {cfgError}</div>
          )}
          {section === 'sistema' && <SistemaSection readOnly={readOnly} isRoot={role === 'superadmin'} />}
          {section === 'planos' && <PlanosSection readOnly={readOnly} />}
          {section === 'contrato' && cfg && (
            <div className="space-y-6">
              <ContratoSection cfg={cfg.contrato} readOnly={readOnly} onSaved={loadCfg} />
              {role === 'superadmin' && (
                <IntegrationSection chave="documenso" title="Assinatura eletrônica · Documenso" readOnly={readOnly} cfg={cfg.documenso} onSaved={loadCfg}
                  intro={<>Os contratos de adesão saem pelo Documenso da FPGD em <b>docs.b2wenergia.com.br</b>. Gere o token em <b>Documenso › Configurações › Tokens de API</b>. Em <b>Webhooks</b>, cadastre a URL abaixo com os eventos “Documento concluído” e “Documento recusado” e o mesmo segredo informado aqui. Integradores sem conta própria também enviam os contratos dos clientes por esta conta.</>}
                  webhook={cfg.webhooks?.documenso}
                  fields={[
                    { key: 'base_url', label: 'Endereço do Documenso', placeholder: 'https://docs.b2wenergia.com.br' },
                    { key: 'api_token', label: 'Token da API', secret: true },
                    { key: 'mensagem', label: 'Mensagem do convite', type: 'textarea', placeholder: 'Contrato de adesão à Frente Potiguar de Geração Distribuída. Leia e assine pelo botão abaixo.' },
                    { key: 'webhook_secret', label: 'Segredo do webhook', secret: true, hint: 'Invente uma senha longa e cole a mesma no campo Secret do webhook no Documenso.' },
                  ]} />
              )}
            </div>
          )}
          {section === 'evolution' && cfg && (
            <IntegrationSection chave="evolution" title="Evolution API" readOnly={readOnly} cfg={cfg.evolution} onSaved={loadCfg}
              intro="Envia o link do contrato pelo WhatsApp da FPGD. A instância precisa estar conectada (QR code lido)."
              fields={[
                { key: 'base_url', label: 'URL do servidor', placeholder: 'https://evolution.seudominio.com.br' },
                { key: 'instance', label: 'Nome da instância', placeholder: 'fpgd' },
                { key: 'api_key', label: 'API key', secret: true },
              ]} />
          )}
          {section === 'resend' && cfg && (
            <IntegrationSection chave="resend" title="Resend" readOnly={readOnly} cfg={cfg.resend} onSaved={loadCfg}
              intro="Envia o contrato por e-mail. O domínio do remetente precisa estar verificado no Resend."
              fields={[
                { key: 'api_key', label: 'API key', secret: true },
                { key: 'from', label: 'Remetente', placeholder: 'FPGD RN <contato@fpgd.site>' },
                { key: 'reply_to', label: 'Responder para', placeholder: 'fpgd.rn@gmail.com' },
              ]} />
          )}
          {section === 'asaas' && cfg && (
            <IntegrationSection chave="asaas" title="Asaas" readOnly={readOnly} cfg={cfg.asaas} onSaved={loadCfg}
              intro={<>Cada ambiente guarda a própria chave; o seletor Ambiente escolhe qual o CRM usa. Crie as chaves em <b>Asaas › Integrações › Chave de API</b> (sandbox.asaas.com para testes). No webhook, marque os eventos de cobrança (pagamento recebido, confirmado e vencido) e use o token abaixo como “token de autenticação”.</>}
              webhook={cfg.webhooks?.asaas}
              fields={[
                { key: 'ambiente', label: 'Ambiente', type: 'select', options: [['sandbox', 'Sandbox (testes)'], ['producao', 'Produção']] },
                { key: 'api_key_sandbox', label: 'Chave de API · Sandbox', secret: true, hint: 'Começa com $aact_hmlg_. Usada quando o ambiente é Sandbox.' },
                { key: 'api_key_producao', label: 'Chave de API · Produção', secret: true, hint: 'Começa com $aact_prod_. Usada quando o ambiente é Produção.' },
                { key: 'billing_type', label: 'Forma de pagamento padrão', type: 'select', options: [['UNDEFINED', 'Associado escolhe'], ['PIX', 'Pix'], ['BOLETO', 'Boleto'], ['CREDIT_CARD', 'Cartão de crédito']] },
                { key: 'webhook_token', label: 'Token do webhook', secret: true, hint: 'Gerado pelo botão “Configurar webhook automaticamente”, ou o mesmo valor informado no painel do Asaas.' },
              ]} />
          )}
          {!['planos', 'sistema'].includes(section) && !cfg && !cfgError && <div className="skeleton h-80" />}
        </div>
      </div>
    </div>
  );
};

function isConfigured(id: string, c?: Cfg) {
  if (!c) return false;
  if (id === 'contrato') return c.api_token__set;
  if (id === 'evolution') return c.api_key__set && c.base_url && c.instance;
  if (id === 'resend') return c.api_key__set && c.from;
  if (id === 'asaas') return c.ambiente === 'producao' ? c.api_key_producao__set : c.api_key_sandbox__set;
  return false;
}

// ---------- Sistema e acessos ----------
interface AdminRow { id: string; nome_fantasia: string | null; razao_social: string | null; matricula: number | null; email: string | null; auth_user_id: string | null; is_admin: boolean }

const SistemaSection: React.FC<{ readOnly: boolean; isRoot: boolean }> = ({ readOnly, isRoot }) => {
  const toast = useToast();
  const tickets = useTicketsEnabled();
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<AdminRow[] | null>(null);
  const [pick, setPick] = useState('');

  const load = useCallback(async () => {
    const { data } = await supabase.from('companies').select('id, nome_fantasia, razao_social, matricula, email, auth_user_id, is_admin')
      .eq('user_type', 'integrador').order('nome_fantasia');
    setRows((data || []) as AdminRow[]);
  }, []);
  useEffect(() => { load(); }, [load]);

  const toggleTickets = async (v: boolean) => {
    setSaving(true);
    try { await setTicketsEnabled(v); toast('ok', v ? 'Sistema de tickets visível para todos.' : 'Sistema de tickets oculto.'); }
    catch (e) { toast('error', (e as Error).message); }
    setSaving(false);
  };

  const setAdmin = async (id: string, v: boolean) => {
    const { error } = await supabase.from('companies').update({ is_admin: v }).eq('id', id);
    if (error) { toast('error', error.message); return; }
    const r = rows?.find((x) => x.id === id);
    await supabase.from('crm_eventos').insert({ company_id: id, tipo: 'acesso', descricao: v ? 'Promovido a administrador da FPGD.' : 'Acesso de administrador removido.' });
    toast('ok', `${r ? nomeAssociado(r) : 'Empresa'} ${v ? 'agora é admin' : 'não é mais admin'}.`);
    setPick('');
    load();
  };

  const admins = (rows || []).filter((r) => r.is_admin);
  const candidatos = (rows || []).filter((r) => !r.is_admin);

  return (
    <div className="space-y-6">
      <section className="panel">
        <header className="p-5 border-b border-line glow-corner rounded-t-[16px]">
          <h2 className="font-bold">Sistema de tickets</h2>
          <p className="text-sm text-fg-2 mt-1 max-w-2xl">Reclamações, Termômetro da Cosern, status dos tickets e unidades. Quando oculto, some do menu e do site público, e as rotas deixam de abrir. Os dados continuam guardados.</p>
        </header>
        <label className={`m-5 flex items-center justify-between gap-4 rounded-[10px] bg-field border border-line px-4 h-14 ${readOnly ? 'opacity-70' : 'cursor-pointer'}`}>
          <span>
            <span className="block text-sm font-semibold">Exibir sistema de tickets</span>
            <span className="block text-xs text-fg-3">{tickets === null ? 'Carregando…' : tickets ? 'Visível para associados, clientes e visitantes' : 'Oculto para todos'}</span>
          </span>
          <input type="checkbox" role="switch" className="accent-[#2F8CFF] size-5" checked={tickets === true} disabled={readOnly || saving || tickets === null}
            onChange={(e) => toggleTickets(e.target.checked)} />
        </label>
      </section>

      <section className="panel">
        <header className="p-5 border-b border-line">
          <h2 className="font-bold">Administradores</h2>
          <p className="text-sm text-fg-2 mt-1 max-w-2xl">Integradores promovidos a admin acessam o CRM, os Pagamentos e as Configurações com os mesmos poderes do superadmin, exceto ver credenciais e API keys e promover outros admins. Continuam aparecendo como associados.</p>
        </header>
        {isRoot && (
          <div className="p-5 border-b border-line flex flex-col sm:flex-row gap-3 sm:items-end">
            <Field label="Promover integrador" className="flex-1">
              <select className="field" value={pick} onChange={(e) => setPick(e.target.value)}>
                <option value="">Escolha uma empresa</option>
                {candidatos.map((r) => <option key={r.id} value={r.id}>{nomeAssociado(r)} · {matriculaLabel(r.matricula)}{r.auth_user_id ? '' : ' · sem login'}</option>)}
              </select>
            </Field>
            <button className="btn btn-primary" disabled={!pick} onClick={() => setAdmin(pick, true)}><ShieldCheck size={16} /> Promover a admin</button>
          </div>
        )}
        {rows === null ? <div className="p-5"><div className="skeleton h-14" /></div> : admins.length === 0 ? (
          <p className="p-8 text-center text-sm text-fg-3">Nenhum integrador é admin ainda.{isRoot ? ' Escolha uma empresa acima para promover.' : ''}</p>
        ) : (
          <ul className="divide-y divide-line">
            {admins.map((r) => (
              <li key={r.id} className="px-5 py-4 flex flex-wrap items-center gap-3">
                <ShieldCheck size={18} className="text-energy" />
                <div className="flex-1 min-w-[200px]">
                  <p className="font-semibold">{nomeAssociado(r)}</p>
                  <p className="text-xs text-fg-3 tabular-nums">{matriculaLabel(r.matricula)}{r.email ? ` · ${r.email}` : ''}{r.auth_user_id ? '' : ' · ainda sem login no sistema'}</p>
                </div>
                {isRoot && <button className="btn btn-ghost btn-sm" onClick={() => { if (confirm(`Remover o acesso de admin de ${nomeAssociado(r)}?`)) setAdmin(r.id, false); }}>Remover admin</button>}
              </li>
            ))}
          </ul>
        )}
        {!isRoot && <p className="px-5 pb-5 text-xs text-fg-3">Só o superadmin promove ou remove administradores.</p>}
      </section>
    </div>
  );
};

// ---------- Planos ----------
const emptyPlano = (): Omit<Plano, 'id'> => ({ nome: '', descricao: '', valor: 0, ciclo: 'MONTHLY', dia_vencimento: 10, ativo: true });

const PlanosSection: React.FC<{ readOnly: boolean }> = ({ readOnly }) => {
  const toast = useToast();
  const [planos, setPlanos] = useState<Plano[] | null>(null);
  const [draft, setDraft] = useState<(Omit<Plano, 'id'> & { id?: string }) | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from('planos').select('*').order('valor');
    setPlanos((data || []) as Plano[]);
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!draft) return;
    if (!draft.nome.trim()) { toast('error', 'Dê um nome ao plano.'); return; }
    setSaving(true);
    const { id, ...row } = draft;
    const payload = { ...row, valor: Number(row.valor) };
    const { error } = id ? await supabase.from('planos').update(payload).eq('id', id) : await supabase.from('planos').insert(payload);
    setSaving(false);
    if (error) { toast('error', `Não foi possível salvar o plano: ${error.message}`); return; }
    toast('ok', `Plano ${draft.nome} salvo.`);
    setDraft(null);
    load();
  };

  const remove = async (p: Plano) => {
    if (!confirm(`Excluir o plano ${p.nome}? Associados com este plano ficam sem plano.`)) return;
    const { error } = await supabase.from('planos').delete().eq('id', p.id);
    if (error) toast('error', error.message); else { toast('ok', 'Plano excluído.'); load(); }
  };

  return (
    <section className="panel">
      <header className="flex items-center justify-between gap-3 p-5 border-b border-line">
        <div>
          <h2 className="font-bold">Planos e valores</h2>
          <p className="text-sm text-fg-2 mt-0.5">O valor do plano vira a mensalidade no Asaas e entra no contrato.</p>
        </div>
        {!readOnly && <button className="btn btn-primary" onClick={() => setDraft(emptyPlano())}><Plus size={16} /> Novo plano</button>}
      </header>

      {draft && (
        <div className="p-5 border-b border-line bg-raised/50 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Nome" className="lg:col-span-2"><input className="field" value={draft.nome} onChange={(e) => setDraft({ ...draft, nome: e.target.value })} placeholder="Ex.: Associado padrão" autoFocus /></Field>
          <Field label="Valor (R$)"><input className="field tabular-nums" type="number" min={0} step="0.01" value={draft.valor} onChange={(e) => setDraft({ ...draft, valor: Number(e.target.value) })} /></Field>
          <Field label="Ciclo">
            <select className="field" value={draft.ciclo} onChange={(e) => setDraft({ ...draft, ciclo: e.target.value as Plano['ciclo'] })}>
              {Object.entries(CICLO_LABEL).map(([k, v]) => <option key={k} value={k}>{v[0].toUpperCase() + v.slice(1)}</option>)}
            </select>
          </Field>
          <Field label="Descrição" className="lg:col-span-2"><input className="field" value={draft.descricao || ''} onChange={(e) => setDraft({ ...draft, descricao: e.target.value })} placeholder="O que o plano inclui" /></Field>
          <Field label="Dia de vencimento"><input className="field tabular-nums" type="number" min={1} max={28} value={draft.dia_vencimento} onChange={(e) => setDraft({ ...draft, dia_vencimento: Number(e.target.value) })} /></Field>
          <label className="flex items-center gap-2 text-sm self-end h-10">
            <input type="checkbox" className="accent-[#2F8CFF] size-4" checked={draft.ativo} onChange={(e) => setDraft({ ...draft, ativo: e.target.checked })} /> Disponível para novos associados
          </label>
          <div className="sm:col-span-2 lg:col-span-4 flex justify-end gap-2">
            <button className="btn btn-ghost" onClick={() => setDraft(null)}>Cancelar</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}><Save size={16} /> {saving ? 'Salvando…' : 'Salvar plano'}</button>
          </div>
        </div>
      )}

      {planos === null ? (
        <div className="p-5 space-y-3">{[0, 1].map((i) => <div key={i} className="skeleton h-14" />)}</div>
      ) : planos.length === 0 && !draft ? (
        <div className="p-10 text-center">
          <p className="font-semibold">Nenhum plano cadastrado</p>
          <p className="text-sm text-fg-2 mt-1">Crie o primeiro plano para poder gerar contratos e cobranças.</p>
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {planos.map((p) => (
            <li key={p.id} className="p-5 flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <p className="font-semibold flex items-center gap-2">{p.nome}{!p.ativo && <span className="chip text-fg-3">Inativo</span>}</p>
                {p.descricao && <p className="text-sm text-fg-2 mt-0.5">{p.descricao}</p>}
              </div>
              <div className="text-right">
                <p className="text-lg font-extrabold tabular-nums">{brl(Number(p.valor))}</p>
                <p className="text-xs text-fg-3">{CICLO_LABEL[p.ciclo]} · vence dia {p.dia_vencimento}</p>
              </div>
              {!readOnly && (
                <div className="flex gap-1">
                  <button className="btn btn-secondary btn-sm" onClick={() => setDraft({ ...p })}>Editar</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => remove(p)} aria-label={`Excluir ${p.nome}`}><Trash2 size={14} /></button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

// ---------- Modelo de contrato ----------
const ContratoSection: React.FC<{ cfg: Cfg; readOnly: boolean; onSaved: () => void }> = ({ cfg, readOnly, onSaved }) => {
  const toast = useToast();
  const [text, setText] = useState<string>(cfg?.template || DEFAULT_CONTRATO);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try { await callFn('crm-config', { action: 'save', chave: 'contrato', valor: { template: text } }); toast('ok', 'Modelo de contrato salvo.'); onSaved(); }
    catch (e) { toast('error', (e as Error).message); }
    setSaving(false);
  };
  return (
    <section className="panel">
      <header className="p-5 border-b border-line">
        <h2 className="font-bold">Modelo do contrato de adesão</h2>
        <p className="text-sm text-fg-2 mt-0.5">Use as variáveis abaixo; elas são trocadas pelos dados do associado ao gerar o contrato. Revise o texto com o jurídico da Frente antes de usar.</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {CONTRATO_VARS.map((v) => (
            <button key={v} type="button" className="chip text-fg-2 hover:text-fg font-medium" disabled={readOnly}
              onClick={() => { navigator.clipboard?.writeText(`{{${v}}}`); toast('ok', `{{${v}}} copiado.`); }}>{`{{${v}}}`}</button>
          ))}
        </div>
      </header>
      <div className="p-5">
        <textarea className="field min-h-[520px] text-[13px] leading-relaxed" value={text} onChange={(e) => setText(e.target.value)} readOnly={readOnly} />
      </div>
      {!readOnly && (
        <footer className="p-5 pt-0 flex justify-between gap-2">
          <button className="btn btn-ghost" onClick={() => setText(DEFAULT_CONTRATO)}>Restaurar modelo padrão</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}><Save size={16} /> {saving ? 'Salvando…' : 'Salvar modelo'}</button>
        </footer>
      )}
    </section>
  );
};

// ---------- Integrações ----------
interface FieldDef {
  key: string; label: string; secret?: boolean; placeholder?: string; hint?: string;
  type?: 'text' | 'toggle' | 'textarea' | 'select'; options?: [string, string][];
}

const IntegrationSection: React.FC<{
  chave: string; title: string; intro: React.ReactNode; fields: FieldDef[]; cfg: Cfg; readOnly: boolean; onSaved: () => void;
  webhook?: string; webhookParam?: string;
}> = ({ chave, title, intro, fields, cfg, readOnly, onSaved, webhook, webhookParam }) => {
  const toast = useToast();
  const [values, setValues] = useState<Cfg>(() => Object.fromEntries(fields.map((f) => [f.key, f.secret ? '' : (cfg?.[f.key] ?? (f.type === 'toggle' ? false : f.options?.[0][0] ?? ''))])));
  const [show, setShow] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [test, setTest] = useState<{ ok: boolean; text: string } | null>(null);

  const save = async () => {
    setSaving(true);
    try {
      await callFn('crm-config', { action: 'save', chave, valor: values });
      toast('ok', `${title}: configurações salvas.`);
      setValues((v) => Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fields.find((f) => f.key === k)?.secret ? '' : x])));
      onSaved();
    } catch (e) { toast('error', (e as Error).message); }
    setSaving(false);
  };
  const runTest = async () => {
    setTesting(true); setTest(null);
    try { const r = await callFn<{ detalhe: string }>('crm-config', { action: 'test', chave }); setTest({ ok: true, text: r.detalhe }); }
    catch (e) { setTest({ ok: false, text: (e as Error).message }); }
    setTesting(false);
  };

  const [hooking, setHooking] = useState(false);
  const configurarWebhook = async () => {
    setHooking(true); setTest(null);
    try { const r = await callFn<{ detalhe: string }>('crm-config', { action: 'asaas_webhook' }); setTest({ ok: true, text: r.detalhe }); onSaved(); }
    catch (e) { setTest({ ok: false, text: (e as Error).message }); }
    setHooking(false);
  };

  const webhookUrl = webhook && webhookParam ? `${webhook}&${webhookParam}=<token do webhook>` : webhook;

  return (
    <section className="panel">
      <header className="p-5 border-b border-line glow-corner rounded-t-[16px]">
        <h2 className="font-bold">{title}</h2>
        <p className="text-sm text-fg-2 mt-1 max-w-2xl">{intro}</p>
        {cfg?.__updated_at && <p className="text-xs text-fg-3 mt-2 tabular-nums">Atualizado em {new Date(cfg.__updated_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</p>}
      </header>
      <div className="p-5 grid sm:grid-cols-2 gap-4">
        {fields.map((f) => {
          if (f.type === 'toggle') {
            return (
              <label key={f.key} className="sm:col-span-2 flex items-center justify-between gap-4 rounded-[10px] bg-field border border-line px-4 h-12">
                <span className="text-sm font-semibold text-fg-2">{f.label}</span>
                <input type="checkbox" className="accent-[#2F8CFF] size-4" checked={values[f.key] === true || values[f.key] === 'true'} disabled={readOnly}
                  onChange={(e) => setValues({ ...values, [f.key]: e.target.checked })} />
              </label>
            );
          }
          const set = cfg?.[`${f.key}__set`];
          return (
            <Field key={f.key} label={f.label} className={f.type === 'textarea' || f.secret ? 'sm:col-span-2' : ''}
              hint={f.secret ? (set ? <>Salvo: <span className="tabular-nums">{cfg[`${f.key}__mask`]}</span>. Deixe em branco para manter.</> : f.hint || 'Ainda não configurado.') : f.hint}>
              {f.type === 'textarea' ? (
                <textarea className="field min-h-[80px]" value={values[f.key] ?? ''} placeholder={f.placeholder} readOnly={readOnly} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} />
              ) : f.type === 'select' ? (
                <select className="field" value={values[f.key]} disabled={readOnly} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}>
                  {f.options!.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              ) : (
                <div className="relative">
                  <input className={`field ${f.secret ? '!pr-10 tabular-nums' : ''}`} autoComplete="off" spellCheck={false}
                    type={f.secret && !show[f.key] ? 'password' : 'text'}
                    placeholder={f.secret && set ? '••••••••  (mantido)' : f.placeholder}
                    value={values[f.key] ?? ''} readOnly={readOnly} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} />
                  {f.secret && (
                    <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-fg-3 hover:text-fg" onClick={() => setShow({ ...show, [f.key]: !show[f.key] })} aria-label={show[f.key] ? 'Ocultar' : 'Mostrar'}>
                      {show[f.key] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  )}
                </div>
              )}
            </Field>
          );
        })}
        {webhookUrl && (
          <Field label="URL do webhook" className="sm:col-span-2" hint="Cadastre esta URL no painel do serviço.">
            <div className="flex gap-2">
              <input className="field tabular-nums text-fg-2" readOnly value={webhookUrl} onFocus={(e) => e.target.select()} />
              <button type="button" className="btn btn-secondary" onClick={() => { navigator.clipboard?.writeText(webhookUrl); toast('ok', 'URL copiada.'); }}><Copy size={15} /> Copiar</button>
            </div>
          </Field>
        )}
      </div>
      {test && (
        <p className={`mx-5 mb-4 rounded-[10px] px-3 py-2.5 text-sm border ${test.ok ? 'border-ok/40 text-ok bg-ok/10' : 'border-danger/40 text-[#FF8B95] bg-danger/10'}`}>{test.text}</p>
      )}
      {!readOnly && (
        <footer className="px-5 pb-5 flex flex-wrap justify-end gap-2">
          {chave === 'asaas' && (
            <button className="btn btn-secondary mr-auto" onClick={configurarWebhook} disabled={hooking}
              title="Gera o token, salva aqui e cadastra a URL no Asaas do ambiente escolhido">
              <Webhook size={16} /> {hooking ? 'Configurando…' : 'Configurar webhook automaticamente'}
            </button>
          )}
          <button className="btn btn-secondary" onClick={runTest} disabled={testing}><PlugZap size={16} /> {testing ? 'Testando…' : 'Testar conexão'}</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}><Save size={16} /> {saving ? 'Salvando…' : 'Salvar'}</button>
        </footer>
      )}
    </section>
  );
};

export default CrmConfigPage;
