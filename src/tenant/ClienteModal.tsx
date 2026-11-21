import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Save, User, FileBarChart, FileText, CreditCard, MessageSquareText, History, Plus, ArrowUpRight, Send, Sparkles,
  RefreshCw, ExternalLink, CheckCircle2, MessageCircle, Mail, Trash2,
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { ASAAS_STATUS, brl, dataBR, formatPhone } from '../crm/data';
import { Field, useToast } from '../crm/ui';
import Sheet, { SheetTabs, useSheetBehavior } from '../crm/Sheet';
import {
  CLIENTE_COLS, DEFAULT_CONTRATO_CLIENTE, ETAPAS, ORIGENS, PROPOSTA_STATUS, etapaMeta, formatDoc, kwp, renderTemplate, tenantFn,
  type Cliente, type CobrancaCliente, type ContratoCliente, type EventoCliente, type Proposta, type PropostaStatus,
} from './data';
import { nomeMarca, type Tenant } from './useTenant';

type Tab = 'dados' | 'propostas' | 'contrato' | 'cobranca' | 'mensagens' | 'historico';

const EMPTY: Partial<Cliente> = { nome: '', etapa: 'novo', tipo_ligacao: 'bifasico', uf: 'RN' };
const LIGACOES: [string, string][] = [['monofasico', 'Monofásico'], ['bifasico', 'Bifásico'], ['trifasico', 'Trifásico']];

interface Props {
  id: string; // 'novo' para cadastro
  tenant: Tenant;
  onClose: () => void;
  onCreated: (id: string) => void;
  onChanged: () => void;
}

/** Junta ?t= (modo suporte) a um caminho do CRM. */
export const withT = (path: string, tenant: Tenant) => {
  if (!tenant.suporte) return path;
  const t = tenant.qs.replace('?t=', '');
  return `${path}${path.includes('?') ? '&' : '?'}t=${t}`;
};

const ClienteModal: React.FC<Props> = ({ id, tenant, onClose, onCreated, onChanged }) => {
  const toast = useToast();
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);
  useSheetBehavior(panelRef, onClose);
  const novo = id === 'novo';
  const companyId = tenant.companyId!;

  const [tab, setTab] = useState<Tab>('dados');
  const [c, setC] = useState<Cliente | null>(null);
  const [form, setForm] = useState<Partial<Cliente>>(EMPTY);
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [contratos, setContratos] = useState<ContratoCliente[]>([]);
  const [cobrancas, setCobrancas] = useState<CobrancaCliente[]>([]);
  const [eventos, setEventos] = useState<EventoCliente[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    if (novo) return;
    const [rc, rp, rk, rb, re] = await Promise.all([
      supabase.from('tenant_clientes').select(CLIENTE_COLS).eq('id', id).maybeSingle(),
      supabase.from('tenant_propostas').select('*').eq('cliente_id', id).order('created_at', { ascending: false }),
      supabase.from('tenant_contratos').select('*').eq('cliente_id', id).order('created_at', { ascending: false }),
      supabase.from('tenant_cobrancas').select('*').eq('cliente_id', id).order('vencimento', { ascending: true }),
      supabase.from('tenant_eventos').select('id, tipo, descricao, created_at').eq('cliente_id', id).order('created_at', { ascending: false }).limit(60),
    ]);
    if (!rc.data) { setNotFound(true); return; }
    setC(rc.data as Cliente);
    setForm(rc.data as Cliente);
    setPropostas((rp.data || []) as Proposta[]);
    setContratos((rk.data || []) as ContratoCliente[]);
    setCobrancas((rb.data || []) as CobrancaCliente[]);
    setEventos((re.data || []) as EventoCliente[]);
  }, [id, novo]);
  useEffect(() => { load(); }, [load]);

  const log = (tipo: string, descricao: string) => supabase.from('tenant_eventos').insert({ company_id: companyId, cliente_id: id, tipo, descricao });
  const reload = async () => { await load(); onChanged(); };

  const set = <K extends keyof Cliente>(k: K, v: Cliente[K] | null) => setForm((f) => ({ ...f, [k]: v }));
  const KEYS = ['nome', 'documento', 'email', 'telefone', 'cep', 'cidade', 'uf', 'endereco', 'consumo_kwh', 'tipo_ligacao', 'concessionaria', 'etapa', 'valor_estimado', 'origem', 'observacoes', 'motivo_perda'] as const;
  const dirty = novo ? Boolean(form.nome?.trim()) : c ? KEYS.some((k) => String(form[k] ?? '') !== String(c[k] ?? '')) : false;

  const buscarCep = async (cep: string) => {
    const d = cep.replace(/\D/g, '');
    if (d.length !== 8) return;
    try {
      const r = await fetch(`https://viacep.com.br/ws/${d}/json/`);
      const j = await r.json();
      if (j.erro) return;
      setForm((f) => ({ ...f, cidade: j.localidade || f.cidade, uf: j.uf || f.uf, endereco: f.endereco || [j.logradouro, j.bairro].filter(Boolean).join(', ') }));
    } catch { /* sem rede: segue manual */ }
  };

  const saveDados = async () => {
    if (!form.nome?.trim()) { toast('error', 'Informe o nome do cliente.'); return; }
    setBusy('dados');
    const patch: Record<string, unknown> = {};
    for (const k of KEYS) {
      const v = form[k];
      patch[k] = v === '' || v === undefined ? null : v;
    }
    patch.nome = form.nome.trim();
    patch.etapa = form.etapa || 'novo';
    for (const k of ['consumo_kwh', 'valor_estimado']) if (patch[k] != null) patch[k] = Number(String(patch[k]).replace(',', '.')) || null;
    for (const k of ['documento', 'telefone', 'cep']) if (patch[k]) patch[k] = String(patch[k]).replace(/\D/g, '');
    if (novo) {
      const { data, error } = await supabase.from('tenant_clientes').insert({ ...patch, company_id: companyId }).select('id').single();
      setBusy(null);
      if (error) { toast('error', `Não foi possível cadastrar: ${error.message}`); return; }
      await supabase.from('tenant_eventos').insert({ company_id: companyId, cliente_id: data.id, tipo: 'cadastro', descricao: 'Cliente cadastrado.' });
      toast('ok', `${patch.nome} cadastrado.`);
      onCreated(data.id);
      return;
    }
    patch.updated_at = new Date().toISOString();
    const { error } = await supabase.from('tenant_clientes').update(patch).eq('id', id);
    if (!error && c && patch.etapa !== c.etapa) await log('etapa', `Etapa alterada de ${etapaMeta(c.etapa).label} para ${etapaMeta(patch.etapa as Cliente['etapa']).label}.`);
    setBusy(null);
    if (error) { toast('error', `Não foi possível salvar: ${error.message}`); return; }
    toast('ok', 'Dados do cliente salvos.');
    await reload();
  };

  const excluir = async () => {
    if (!c || !confirm(`Excluir ${c.nome}? Propostas ficam guardadas; contratos, cobranças registradas e histórico deste cliente são apagados.`)) return;
    const { error } = await supabase.from('tenant_clientes').delete().eq('id', c.id);
    if (error) { toast('error', error.message); return; }
    toast('ok', `${c.nome} excluído.`);
    onChanged();
    onClose();
  };

  const abrirEstudio = (propostaId?: string) =>
    navigate(withT(propostaId ? `/meu-crm/proposta/${propostaId}` : `/meu-crm/proposta/nova?cliente=${id}`, tenant));

  if (notFound) {
    return (
      <Sheet onClose={onClose} panelRef={panelRef} title="Cliente não encontrado">
        <p className="p-6 text-sm text-fg-2">Este link aponta para um cliente que não existe mais.</p>
      </Sheet>
    );
  }

  const meta = etapaMeta((c?.etapa || form.etapa || 'novo') as Cliente['etapa']);
  const TABS = [
    { id: 'dados' as const, label: 'Dados', icon: User },
    { id: 'propostas' as const, label: 'Propostas', icon: FileBarChart, disabled: novo },
    { id: 'contrato' as const, label: 'Contrato', icon: FileText, disabled: novo },
    { id: 'cobranca' as const, label: 'Cobrança', icon: CreditCard, disabled: novo },
    { id: 'mensagens' as const, label: 'Mensagens', icon: MessageSquareText, disabled: novo },
    { id: 'historico' as const, label: 'Histórico', icon: History, disabled: novo },
  ];

  return (
    <Sheet onClose={onClose} panelRef={panelRef} title={novo ? 'Novo cliente' : c ? c.nome : 'Carregando…'}
      subtitle={!novo && c && (
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className={`chip ${meta.color}`}><span className={`size-1.5 rounded-full ${meta.bg}`} />{meta.label}</span>
          {c.cidade && <span>{c.cidade}{c.uf ? `/${c.uf}` : ''}</span>}
          {c.potencia_kwp ? <span className="tabular-nums">{kwp(c.potencia_kwp)}</span> : null}
          {c.valor_estimado ? <span className="tabular-nums">{brl(Number(c.valor_estimado))}</span> : null}
        </span>
      )}>
      <SheetTabs tabs={TABS} value={tab} onChange={setTab} />

      <div className="flex-1 overflow-y-auto">
        {!novo && !c ? (
          <div className="p-6 space-y-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-10" />)}</div>
        ) : tab === 'dados' ? (
          <div className="p-6 space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Nome" className="sm:col-span-2"><input className="field" autoFocus={novo} value={form.nome || ''} onChange={(e) => set('nome', e.target.value)} placeholder="Nome do cliente ou da empresa" /></Field>
              <Field label="Etapa">
                <select className="field" value={form.etapa} onChange={(e) => set('etapa', e.target.value as Cliente['etapa'])}>
                  {ETAPAS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </Field>
              <Field label="Origem">
                <select className="field" value={form.origem || ''} onChange={(e) => set('origem', e.target.value)}>
                  <option value="">Não informada</option>
                  {ORIGENS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="CPF ou CNPJ" hint="Necessário para cobrar pelo Asaas."><input className="field tabular-nums" inputMode="numeric" value={formatDoc(form.documento)} onChange={(e) => set('documento', e.target.value.replace(/\D/g, '').slice(0, 14))} /></Field>
              <Field label="WhatsApp"><input className="field tabular-nums" inputMode="tel" value={formatPhone(form.telefone || '')} onChange={(e) => set('telefone', e.target.value.replace(/\D/g, '').slice(0, 13))} /></Field>
              <Field label="E-mail" className="sm:col-span-2"><input className="field" type="email" value={form.email || ''} onChange={(e) => set('email', e.target.value)} /></Field>
              <Field label="CEP" hint="Preenche cidade e endereço."><input className="field tabular-nums" inputMode="numeric" value={form.cep || ''} onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 8); set('cep', v); buscarCep(v); }} /></Field>
              <div className="grid grid-cols-[1fr_72px] gap-3">
                <Field label="Cidade"><input className="field" value={form.cidade || ''} onChange={(e) => set('cidade', e.target.value)} /></Field>
                <Field label="UF"><input className="field uppercase" maxLength={2} value={form.uf || ''} onChange={(e) => set('uf', e.target.value.toUpperCase())} /></Field>
              </div>
              <Field label="Endereço" className="sm:col-span-2"><input className="field" value={form.endereco || ''} onChange={(e) => set('endereco', e.target.value)} /></Field>
            </div>

            <div className="border-t border-line pt-5">
              <h3 className="text-sm font-bold mb-3">Energia</h3>
              <div className="grid sm:grid-cols-3 gap-4">
                <Field label="Consumo médio (kWh/mês)"><input className="field tabular-nums" inputMode="decimal" value={form.consumo_kwh ?? ''} onChange={(e) => set('consumo_kwh', e.target.value as unknown as number)} /></Field>
                <Field label="Ligação">
                  <select className="field" value={form.tipo_ligacao || 'bifasico'} onChange={(e) => set('tipo_ligacao', e.target.value)}>
                    {LIGACOES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </Field>
                <Field label="Distribuidora"><input className="field" placeholder="Neoenergia Cosern" value={form.concessionaria || ''} onChange={(e) => set('concessionaria', e.target.value)} /></Field>
                <Field label="Valor estimado (R$)" hint="Atualizado ao salvar uma proposta."><input className="field tabular-nums" inputMode="decimal" value={form.valor_estimado ?? ''} onChange={(e) => set('valor_estimado', e.target.value as unknown as number)} /></Field>
              </div>
            </div>

            {form.etapa === 'perdido' && (
              <Field label="Por que não avançou?"><input className="field" value={form.motivo_perda || ''} onChange={(e) => set('motivo_perda', e.target.value)} placeholder="Preço, prazo, escolheu concorrente…" /></Field>
            )}
            <Field label="Observações"><textarea className="field min-h-[88px]" value={form.observacoes || ''} onChange={(e) => set('observacoes', e.target.value)} placeholder="Telhado, sombreamento, horário para visita…" /></Field>

            {!novo && (
              <div className="pt-2">
                <button className="btn btn-ghost btn-sm text-danger-text" onClick={excluir}><Trash2 size={14} /> Excluir cliente</button>
              </div>
            )}
          </div>
        ) : tab === 'propostas' && c ? (
          <PropostasTab propostas={propostas} onNova={() => abrirEstudio()} onAbrir={abrirEstudio} reload={reload} log={log} />
        ) : tab === 'contrato' && c ? (
          <ContratoTab c={c} tenant={tenant} propostas={propostas} contratos={contratos} busy={busy} setBusy={setBusy} reload={reload} log={log} />
        ) : tab === 'cobranca' && c ? (
          <CobrancaTab c={c} tenant={tenant} propostas={propostas} cobrancas={cobrancas} busy={busy} setBusy={setBusy} reload={reload} />
        ) : tab === 'mensagens' && c ? (
          <MensagensTab c={c} tenant={tenant} reload={reload} />
        ) : (
          <div className="p-6">
            {eventos.length === 0 ? (
              <p className="text-sm text-fg-3 py-10 text-center">Nada registrado ainda. Etapas, propostas, mensagens e pagamentos aparecem aqui.</p>
            ) : (
              <ol className="relative border-l border-line ml-2 space-y-5">
                {eventos.map((e) => (
                  <li key={e.id} className="pl-5 relative">
                    <span className="absolute -left-[5px] top-1.5 size-2.5 rounded-full bg-raised border-2 border-cyan" />
                    <p className="text-sm text-fg">{e.descricao}</p>
                    <p className="text-xs text-fg-3 tabular-nums mt-0.5">{new Date(e.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </div>

      {tab === 'dados' && (novo || c) && (
        <footer className="px-6 py-4 border-t border-line flex items-center justify-end gap-2 bg-panel">
          {dirty && !novo && <span className="text-xs text-fg-3 mr-auto">Alterações não salvas</span>}
          {novo
            ? <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            : <button className="btn btn-ghost" onClick={() => c && setForm(c)} disabled={!dirty}>Descartar</button>}
          <button className="btn btn-primary" onClick={saveDados} disabled={!dirty || busy === 'dados'}>
            <Save size={16} /> {busy === 'dados' ? 'Salvando…' : novo ? 'Cadastrar cliente' : 'Salvar'}
          </button>
        </footer>
      )}
    </Sheet>
  );
};

// ---------- Propostas ----------
const PropostasTab: React.FC<{
  propostas: Proposta[]; onNova: () => void; onAbrir: (id: string) => void; reload: () => Promise<void>; log: (t: string, d: string) => unknown;
}> = ({ propostas, onNova, onAbrir, reload, log }) => {
  const toast = useToast();
  const mudarStatus = async (p: Proposta, status: PropostaStatus) => {
    const { error } = await supabase.from('tenant_propostas').update({ status, updated_at: new Date().toISOString() }).eq('id', p.id);
    if (error) { toast('error', error.message); return; }
    await log('proposta', `Proposta "${p.titulo}" marcada como ${PROPOSTA_STATUS[status].label.toLowerCase()}.`);
    await reload();
  };
  return (
    <div className="p-6 space-y-4">
      {propostas.length === 0 ? (
        <div className="rounded-[16px] border border-dashed border-line px-6 py-10 text-center">
          <p className="text-sm font-semibold">Nenhuma proposta para este cliente</p>
          <p className="mt-1 text-sm text-fg-3 max-w-[44ch] mx-auto">O estúdio já abre com o consumo e a cidade do cliente. Dimensione, precifique e salve.</p>
          <button className="btn btn-primary mt-5" onClick={onNova}><Plus size={16} /> Montar proposta</button>
        </div>
      ) : (
        <>
          <div className="flex justify-end"><button className="btn btn-secondary btn-sm" onClick={onNova}><Plus size={14} /> Nova proposta</button></div>
          <ul className="space-y-2">
            {propostas.map((p) => (
              <li key={p.id} className="rounded-[10px] bg-raised border border-line p-4">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate">{p.titulo}</p>
                    <p className="text-xs text-fg-3 tabular-nums mt-0.5">Salva em {dataBR(p.updated_at)}</p>
                  </div>
                  <select className={`field !h-8 !py-0 !w-auto text-xs font-semibold ${PROPOSTA_STATUS[p.status].cls}`} value={p.status}
                    onChange={(e) => mudarStatus(p, e.target.value as PropostaStatus)} aria-label="Status da proposta">
                    {Object.entries(PROPOSTA_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <button className="btn btn-ghost btn-sm !px-2" onClick={() => onAbrir(p.id)} aria-label="Abrir no estúdio" title="Abrir no estúdio"><ArrowUpRight size={16} /></button>
                </div>
                <dl className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-px bg-line rounded-[8px] overflow-hidden text-sm">
                  {[['Potência', kwp(p.potencia_kwp)], ['Preço', brl(p.preco_venda == null ? null : Number(p.preco_venda))],
                    ['Economia/mês', brl(p.economia_mensal == null ? null : Number(p.economia_mensal))],
                    ['Retorno', p.payback_anos ? `${Number(p.payback_anos).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} anos` : '—']].map(([k, v]) => (
                    <div key={k} className="bg-panel px-3 py-2"><dt className="text-xs text-fg-3">{k}</dt><dd className="font-bold tabular-nums">{v}</dd></div>
                  ))}
                </dl>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

// ---------- Contrato ----------
const CONTRATO_META: Record<ContratoCliente['status'], { label: string; cls: string }> = {
  rascunho: { label: 'Rascunho', cls: 'text-fg-3' },
  enviado: { label: 'Enviado ao cliente', cls: 'text-st-inadimplente' },
  assinado: { label: 'Assinado', cls: 'text-st-ativo' },
  recusado: { label: 'Recusado', cls: 'text-st-cancelado' },
  cancelado: { label: 'Cancelado', cls: 'text-fg-3' },
};

const ContratoTab: React.FC<{
  c: Cliente; tenant: Tenant; propostas: Proposta[]; contratos: ContratoCliente[];
  busy: string | null; setBusy: (b: string | null) => void; reload: () => Promise<void>; log: (t: string, d: string) => unknown;
}> = ({ c, tenant, propostas, contratos, busy, setBusy, reload, log }) => {
  const toast = useToast();
  const atual = contratos[0];
  const [texto, setTexto] = useState(atual?.conteudo || '');
  const [canais, setCanais] = useState({ whatsapp: Boolean(c.telefone), email: Boolean(c.email) });
  useEffect(() => { setTexto(atual?.conteudo || ''); }, [atual?.id, atual?.conteudo]);

  const proposta = propostas.find((p) => p.status === 'aceita') || propostas[0];

  const gerar = async () => {
    setBusy('gerar');
    let tpl = DEFAULT_CONTRATO_CLIENTE;
    try { const cfg = await tenantFn<Record<string, any>>(tenant.companyId!, 'config_get'); if (cfg.contrato?.template) tpl = cfg.contrato.template; } catch { /* usa o padrão */ }
    const num = (v: number | null | undefined, d = 2) => (v == null ? '—' : Number(v).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }));
    const conteudo = renderTemplate(tpl, {
      empresa: nomeMarca(tenant),
      empresa_cnpj: formatDoc(tenant.empresa?.cnpj) || '—',
      cliente: c.nome,
      cliente_documento: formatDoc(c.documento) || '—',
      cliente_endereco: c.endereco || '—',
      cliente_cidade: c.cidade || '—',
      cliente_uf: c.uf || '—',
      concessionaria: c.concessionaria || 'distribuidora local',
      potencia_kwp: num(proposta?.potencia_kwp ?? c.potencia_kwp),
      qtd_modulos: proposta?.qtd_modulos != null ? String(proposta.qtd_modulos) : '—',
      geracao_mensal: num(proposta?.geracao_mensal_kwh, 0),
      valor_total: brl(proposta?.preco_venda != null ? Number(proposta.preco_venda) : c.valor_estimado != null ? Number(c.valor_estimado) : null),
      cidade_empresa: tenant.empresa?.cidade || c.cidade || '—',
      data: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }),
    });
    const { error } = await supabase.from('tenant_contratos').insert({ company_id: tenant.companyId, cliente_id: c.id, proposta_id: proposta?.id ?? null, conteudo });
    setBusy(null);
    if (error) { toast('error', error.message); return; }
    await log('contrato', 'Contrato gerado a partir do modelo.');
    toast('ok', 'Contrato gerado. Revise antes de enviar.');
    await reload();
  };

  const salvar = async () => {
    if (!atual) return;
    setBusy('salvar');
    const { error } = await supabase.from('tenant_contratos').update({ conteudo: texto, updated_at: new Date().toISOString() }).eq('id', atual.id);
    setBusy(null);
    if (error) { toast('error', error.message); return; }
    toast('ok', 'Contrato salvo.');
    await reload();
  };

  const enviar = async () => {
    if (!atual) return;
    if (texto !== atual.conteudo) await supabase.from('tenant_contratos').update({ conteudo: texto }).eq('id', atual.id);
    setBusy('enviar');
    try {
      const r = await tenantFn<{ enviados: string[]; falhas: string[] }>(tenant.companyId!, 'contrato_enviar', { contrato_id: atual.id, canais });
      toast('ok', `Contrato enviado por ${r.enviados.join(' e ')}.`);
      if (r.falhas.length) toast('error', `Não foi: ${r.falhas.join(' · ')}`);
      await reload();
    } catch (e) { toast('error', (e as Error).message); }
    setBusy(null);
  };

  const marcar = async (status: 'assinado' | 'recusado') => {
    if (!atual) return;
    setBusy(status);
    const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    if (status === 'assinado') patch.assinado_em = new Date().toISOString();
    const { error } = await supabase.from('tenant_contratos').update(patch).eq('id', atual.id);
    if (!error && status === 'assinado' && c.etapa !== 'ganho') {
      await supabase.from('tenant_clientes').update({ etapa: 'ganho', updated_at: new Date().toISOString() }).eq('id', c.id);
    }
    if (!error) await log('contrato', status === 'assinado' ? 'Contrato assinado. Cliente movido para Fechado.' : 'Cliente recusou o contrato.');
    setBusy(null);
    if (error) { toast('error', error.message); return; }
    toast('ok', status === 'assinado' ? 'Contrato assinado. Cliente em Fechado.' : 'Contrato marcado como recusado.');
    await reload();
  };

  if (!atual) {
    return (
      <div className="p-6">
        <div className="rounded-[16px] border border-dashed border-line px-6 py-10 text-center">
          <p className="text-sm font-semibold">Sem contrato ainda</p>
          <p className="mt-1 text-sm text-fg-3 max-w-[46ch] mx-auto">
            {proposta ? `Usa o modelo das configurações com os dados do cliente e da proposta "${proposta.titulo}".` : 'Usa o modelo das configurações com os dados do cliente. Salve uma proposta antes para preencher potência e valor.'}
          </p>
          <button className="btn btn-primary mt-5" onClick={gerar} disabled={busy === 'gerar'}><FileText size={16} /> {busy === 'gerar' ? 'Gerando…' : 'Gerar contrato'}</button>
        </div>
      </div>
    );
  }

  const m = CONTRATO_META[atual.status];
  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className={`chip ${m.cls}`}>{m.label}</span>
        {atual.enviado_em && <span className="text-xs text-fg-3 tabular-nums">Enviado em {dataBR(atual.enviado_em)}</span>}
        {atual.assinado_em && <span className="text-xs text-fg-3 tabular-nums">Assinado em {dataBR(atual.assinado_em)}</span>}
        <button className="btn btn-ghost btn-sm ml-auto" onClick={gerar} disabled={busy !== null}><RefreshCw size={14} /> Gerar de novo</button>
      </div>
      <textarea className="field min-h-[340px] leading-relaxed text-[13px]" value={texto} onChange={(e) => setTexto(e.target.value)} disabled={atual.status === 'assinado'} />
      {atual.status !== 'assinado' && (
        <div className="rounded-[10px] bg-field border border-line p-4">
          <p className="text-sm font-semibold">Enviar ao cliente em PDF</p>
          <div className="mt-2 flex flex-wrap gap-4 text-sm">
            <label className={`inline-flex items-center gap-2 ${c.telefone ? '' : 'opacity-50'}`}>
              <input type="checkbox" className="accent-[#2F8CFF] size-4" checked={canais.whatsapp} disabled={!c.telefone} onChange={(e) => setCanais((x) => ({ ...x, whatsapp: e.target.checked }))} />
              <MessageCircle size={15} className="text-fg-3" /> WhatsApp {c.telefone ? <span className="text-fg-3 tabular-nums">{formatPhone(c.telefone)}</span> : <span className="text-fg-3">sem número</span>}
            </label>
            <label className={`inline-flex items-center gap-2 ${c.email ? '' : 'opacity-50'}`}>
              <input type="checkbox" className="accent-[#2F8CFF] size-4" checked={canais.email} disabled={!c.email} onChange={(e) => setCanais((x) => ({ ...x, email: e.target.checked }))} />
              <Mail size={15} className="text-fg-3" /> E-mail {c.email ? <span className="text-fg-3">{c.email}</span> : <span className="text-fg-3">sem e-mail</span>}
            </label>
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-end gap-2">
        {atual.status === 'enviado' && (
          <>
            <button className="btn btn-ghost btn-sm mr-auto" onClick={() => marcar('recusado')} disabled={busy !== null}>Cliente recusou</button>
            <button className="btn btn-secondary btn-sm" onClick={() => marcar('assinado')} disabled={busy !== null}><CheckCircle2 size={14} /> Marcar como assinado</button>
          </>
        )}
        {atual.status !== 'assinado' && (
          <>
            <button className="btn btn-secondary btn-sm" onClick={salvar} disabled={busy !== null || texto === atual.conteudo}><Save size={14} /> Salvar</button>
            <button className="btn btn-primary btn-sm" onClick={enviar} disabled={busy !== null || (!canais.whatsapp && !canais.email)}>
              <Send size={14} /> {busy === 'enviar' ? 'Enviando…' : atual.status === 'enviado' ? 'Reenviar' : 'Enviar contrato'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// ---------- Cobrança (Asaas do associado) ----------
const PAGO = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'];

const CobrancaTab: React.FC<{
  c: Cliente; tenant: Tenant; propostas: Proposta[]; cobrancas: CobrancaCliente[];
  busy: string | null; setBusy: (b: string | null) => void; reload: () => Promise<void>;
}> = ({ c, tenant, propostas, cobrancas, busy, setBusy, reload }) => {
  const toast = useToast();
  const sugerido = propostas.find((p) => p.status === 'aceita')?.preco_venda ?? c.valor_estimado;
  const hoje = new Date();
  const em7 = new Date(hoje.getTime() + 7 * 864e5).toISOString().slice(0, 10);
  const [valor, setValor] = useState(sugerido != null ? String(Number(sugerido).toFixed(2)).replace('.', ',') : '');
  const [parcelas, setParcelas] = useState('1');
  const [forma, setForma] = useState('UNDEFINED');
  const [venc, setVenc] = useState(em7);
  const [desc, setDesc] = useState(`Sistema fotovoltaico — ${c.nome}`);

  const totais = useMemo(() => ({
    pago: cobrancas.filter((x) => PAGO.includes(x.status || '')).reduce((s, x) => s + Number(x.valor), 0),
    aberto: cobrancas.filter((x) => !PAGO.includes(x.status || '') && !['REFUNDED', 'DELETED'].includes(x.status || '')).reduce((s, x) => s + Number(x.valor), 0),
  }), [cobrancas]);

  const criar = async () => {
    const v = Number(valor.replace(/\./g, '').replace(',', '.'));
    setBusy('cobrar');
    try {
      const r = await tenantFn<{ invoice_url?: string }>(tenant.companyId!, 'cobranca_criar', { cliente_id: c.id, valor: v, parcelas: Number(parcelas), forma, vencimento: venc, descricao: desc });
      toast('ok', 'Cobrança criada no Asaas.');
      if (r.invoice_url) window.open(r.invoice_url, '_blank', 'noopener');
      await reload();
    } catch (e) { toast('error', (e as Error).message); }
    setBusy(null);
  };
  const sync = async () => {
    setBusy('sync');
    try { await tenantFn(tenant.companyId!, 'cobranca_sync', { cliente_id: c.id }); toast('ok', 'Cobranças atualizadas com o Asaas.'); await reload(); }
    catch (e) { toast('error', (e as Error).message); }
    setBusy(null);
  };

  return (
    <div className="p-6 space-y-6">
      {cobrancas.length > 0 && (
        <div>
          <div className="flex items-center gap-4 mb-2">
            <p className="text-sm"><span className="text-fg-3">Recebido</span> <b className="tabular-nums">{brl(totais.pago)}</b></p>
            <p className="text-sm"><span className="text-fg-3">Em aberto</span> <b className="tabular-nums">{brl(totais.aberto)}</b></p>
            <button className="btn btn-ghost btn-sm ml-auto" onClick={sync} disabled={busy !== null}><RefreshCw size={14} /> {busy === 'sync' ? 'Atualizando…' : 'Atualizar'}</button>
          </div>
          <ul className="divide-y divide-line rounded-[10px] border border-line">
            {cobrancas.map((p) => (
              <li key={p.id} className="px-3 py-2.5 text-sm flex items-center gap-3">
                <span className="tabular-nums text-fg-2 w-24">{dataBR(p.vencimento)}</span>
                <span className="tabular-nums flex-1">{brl(Number(p.valor))}</span>
                <span className={p.status === 'OVERDUE' ? 'text-st-inadimplente' : PAGO.includes(p.status || '') ? 'text-st-ativo' : 'text-fg-2'}>{ASAAS_STATUS[p.status || ''] || p.status}</span>
                {p.invoice_url && <a className="text-primary hover:underline inline-flex items-center gap-1" href={p.invoice_url} target="_blank" rel="noreferrer">Fatura <ExternalLink size={12} /></a>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-[16px] border border-dashed border-line p-5">
        <h3 className="text-sm font-bold">Nova cobrança</h3>
        <p className="text-xs text-fg-3 mt-0.5">Emitida na conta Asaas da {nomeMarca(tenant)}. O cliente recebe o link de pagamento.</p>
        {!c.documento && <p className="mt-3 text-sm text-st-inadimplente">Cadastre o CPF ou CNPJ do cliente na aba Dados para cobrar.</p>}
        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          <Field label="Valor total (R$)"><input className="field tabular-nums" inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} /></Field>
          <Field label="Parcelas">
            <select className="field" value={parcelas} onChange={(e) => setParcelas(e.target.value)}>
              {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((n) => <option key={n} value={n}>{n === '1' ? 'À vista' : `${n}x`}</option>)}
            </select>
          </Field>
          <Field label="Forma de pagamento">
            <select className="field" value={forma} onChange={(e) => setForma(e.target.value)}>
              <option value="UNDEFINED">Cliente escolhe</option>
              <option value="PIX">Pix</option>
              <option value="BOLETO">Boleto</option>
              <option value="CREDIT_CARD">Cartão de crédito</option>
            </select>
          </Field>
          <Field label="1º vencimento"><input type="date" className="field" value={venc} onChange={(e) => setVenc(e.target.value)} /></Field>
          <Field label="Descrição" className="sm:col-span-2"><input className="field" value={desc} onChange={(e) => setDesc(e.target.value)} /></Field>
        </div>
        <div className="mt-4 flex justify-end">
          <button className="btn btn-primary" onClick={criar} disabled={busy !== null || !c.documento || !valor || !venc}>
            <CreditCard size={16} /> {busy === 'cobrar' ? 'Criando…' : 'Criar cobrança'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------- Mensagens (WhatsApp / e-mail + assistente) ----------
const PEDIDOS: [string, string][] = [
  ['acompanhamento', 'Escreva uma mensagem curta de WhatsApp para retomar a conversa e marcar o próximo passo.'],
  ['proposta', 'Escreva uma mensagem apresentando a proposta mais recente, destacando economia mensal e tempo de retorno.'],
  ['visita', 'Escreva uma mensagem propondo uma visita técnica, pedindo dia e horário.'],
  ['cobranca', 'Escreva um lembrete cordial de pagamento em aberto, sem tom de cobrança agressiva.'],
  ['pos', 'Escreva uma mensagem de pós-venda perguntando como está a geração e pedindo uma indicação.'],
];
const PEDIDO_LABEL: Record<string, string> = { acompanhamento: 'Retomar conversa', proposta: 'Apresentar proposta', visita: 'Marcar visita', cobranca: 'Lembrar pagamento', pos: 'Pós-venda' };

const MensagensTab: React.FC<{ c: Cliente; tenant: Tenant; reload: () => Promise<void> }> = ({ c, tenant, reload }) => {
  const toast = useToast();
  const [canal, setCanal] = useState<'whatsapp' | 'email'>(c.telefone ? 'whatsapp' : 'email');
  const [assunto, setAssunto] = useState('');
  const [texto, setTexto] = useState('');
  const [pedido, setPedido] = useState('acompanhamento');
  const [busy, setBusy] = useState<'ia' | 'send' | null>(null);
  const destino = canal === 'whatsapp' ? (c.telefone ? formatPhone(c.telefone) : null) : c.email;

  const rascunhar = async () => {
    setBusy('ia');
    try {
      const base = PEDIDOS.find(([k]) => k === pedido)?.[1] || '';
      const r = await tenantFn<{ texto: string }>(tenant.companyId!, 'ia', {
        cliente_id: c.id,
        pedido: `${base}${canal === 'email' ? ' Formato de e-mail, sem assunto no corpo.' : ' Máximo de 5 linhas, sem markdown.'}`,
      });
      setTexto(r.texto);
      if (canal === 'email' && !assunto) setAssunto(PEDIDO_LABEL[pedido]);
    } catch (e) { toast('error', (e as Error).message); }
    setBusy(null);
  };
  const enviar = async () => {
    setBusy('send');
    try {
      await tenantFn(tenant.companyId!, canal, { cliente_id: c.id, texto, assunto });
      toast('ok', canal === 'whatsapp' ? 'WhatsApp enviado.' : 'E-mail enviado.');
      setTexto(''); setAssunto('');
      await reload();
    } catch (e) { toast('error', (e as Error).message); }
    setBusy(null);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="inline-flex p-1 rounded-[10px] bg-field border border-line" role="tablist" aria-label="Canal">
        {([['whatsapp', MessageCircle, 'WhatsApp'], ['email', Mail, 'E-mail']] as const).map(([v, Icon, label]) => (
          <button key={v} role="tab" aria-selected={canal === v} onClick={() => setCanal(v)}
            className={`h-8 px-3 rounded-[7px] inline-flex items-center gap-2 text-sm font-semibold transition-colors ${canal === v ? 'bg-raised text-fg shadow-[0_1px_2px_rgb(0_0_0/.4)]' : 'text-fg-3 hover:text-fg'}`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>
      <p className="text-xs text-fg-3">{destino ? <>Para <span className="text-fg-2 tabular-nums">{destino}</span></> : `O cliente não tem ${canal === 'whatsapp' ? 'WhatsApp' : 'e-mail'} cadastrado.`}</p>

      <div className="rounded-[10px] bg-field border border-line p-3 flex flex-wrap items-center gap-2">
        <Sparkles size={15} className="text-fg-3" />
        <span className="text-sm text-fg-2">Rascunho com IA:</span>
        <select className="field !h-8 !py-0 !w-auto text-sm" value={pedido} onChange={(e) => setPedido(e.target.value)} aria-label="Tipo de mensagem">
          {PEDIDOS.map(([k]) => <option key={k} value={k}>{PEDIDO_LABEL[k]}</option>)}
        </select>
        <button className="btn btn-secondary btn-sm ml-auto" onClick={rascunhar} disabled={busy !== null}>{busy === 'ia' ? 'Escrevendo…' : 'Rascunhar'}</button>
      </div>

      {canal === 'email' && <Field label="Assunto"><input className="field" value={assunto} onChange={(e) => setAssunto(e.target.value)} /></Field>}
      <Field label="Mensagem"><textarea className="field min-h-[180px] leading-relaxed" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={`Olá, ${c.nome.split(' ')[0]}!`} /></Field>
      <div className="flex justify-end">
        <button className="btn btn-primary" onClick={enviar} disabled={busy !== null || !texto.trim() || !destino || (canal === 'email' && !assunto.trim())}>
          <Send size={16} /> {busy === 'send' ? 'Enviando…' : canal === 'whatsapp' ? 'Enviar WhatsApp' : 'Enviar e-mail'}
        </button>
      </div>
    </div>
  );
};

export default ClienteModal;
