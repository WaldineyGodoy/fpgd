import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Save, FileText, Send, RefreshCw, ExternalLink, MessageCircle, Mail, CreditCard, History, Building2, Copy, Ban, ShieldCheck, LayoutPanelLeft,
} from 'lucide-react';
import TenantCrmTab from '../tenant/TenantCrmTab';
import { supabase } from '../supabaseClient';
import {
  ASSOCIADO_COLS, STATUS, ASAAS_STATUS, CICLO_LABEL, DEFAULT_CONTRATO, brl, callFn, dataBR, formatCnpj, formatPhone,
  matriculaLabel, nomeAssociado, renderContrato,
  type Associado, type Contrato, type Evento, type Financeiro, type Plano,
} from './data';
import { Field, StatusChip, contratoMeta, useToast } from './ui';
import { useSession } from '../components/AppLayout';
import Shell from './Sheet';

type Tab = 'dados' | 'contrato' | 'cobranca' | 'crm' | 'historico';
const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'dados', label: 'Dados', icon: Building2 },
  { id: 'contrato', label: 'Contrato', icon: FileText },
  { id: 'cobranca', label: 'Cobrança', icon: CreditCard },
  { id: 'crm', label: 'CRM do associado', icon: LayoutPanelLeft },
  { id: 'historico', label: 'Histórico', icon: History },
];

interface Props { id: string; planos: Plano[]; onClose: () => void; onChanged: () => void }

const AssociadoModal: React.FC<Props> = ({ id, planos, onClose, onChanged }) => {
  const toast = useToast();
  const { role, canManage } = useSession();
  const [tab, setTab] = useState<Tab>('dados');
  const [a, setA] = useState<Associado | null>(null);
  const [form, setForm] = useState<Partial<Associado>>({});
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [fin, setFin] = useState<Financeiro | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const [ra, rc, rf, re] = await Promise.all([
      supabase.from('companies').select(ASSOCIADO_COLS).eq('id', id).maybeSingle(),
      supabase.from('contratos').select('*').eq('company_id', id).order('created_at', { ascending: false }),
      supabase.from('associado_financeiro').select('*').eq('company_id', id).maybeSingle(),
      supabase.from('crm_eventos').select('id, tipo, descricao, created_at').eq('company_id', id).order('created_at', { ascending: false }).limit(50),
    ]);
    if (!ra.data) { setNotFound(true); return; }
    setA(ra.data as Associado);
    setForm(ra.data as Associado);
    setContratos((rc.data || []) as Contrato[]);
    setFin((rf.data as Financeiro) || null);
    setEventos((re.data || []) as Evento[]);
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const set = <K extends keyof Associado>(k: K, v: Associado[K]) => setForm((f) => ({ ...f, [k]: v }));
  const dirty = a && (['status_associado', 'plano_id', 'nome_fantasia', 'razao_social', 'contato_nome', 'email', 'telefone', 'municipio', 'uf', 'observacoes_crm'] as const)
    .some((k) => (form[k] ?? '') !== (a[k] ?? ''));

  const saveDados = async () => {
    if (!a) return;
    setBusy('dados');
    const patch = {
      status_associado: form.status_associado, plano_id: form.plano_id || null,
      nome_fantasia: form.nome_fantasia, razao_social: form.razao_social, contato_nome: form.contato_nome,
      email: form.email, telefone: form.telefone, municipio: form.municipio, uf: form.uf, observacoes_crm: form.observacoes_crm,
      ...(form.status_associado === 'ativo' && !a.data_adesao ? { data_adesao: new Date().toISOString().slice(0, 10) } : {}),
    };
    const { error } = await supabase.from('companies').update(patch).eq('id', a.id);
    if (error) { toast('error', `Não foi possível salvar: ${error.message}`); setBusy(null); return; }
    if (form.status_associado !== a.status_associado) {
      const de = STATUS.find((s) => s.id === a.status_associado)?.label;
      const para = STATUS.find((s) => s.id === form.status_associado)?.label;
      await supabase.from('crm_eventos').insert({ company_id: a.id, tipo: 'status', descricao: `Status alterado de ${de} para ${para}.` });
    }
    toast('ok', 'Dados do associado salvos.');
    setBusy(null);
    await load();
    onChanged();
  };

  if (notFound) {
    return (
      <Shell onClose={onClose} panelRef={panelRef} title="Associado não encontrado">
        <p className="p-6 text-sm text-fg-2">Este link aponta para um associado que não existe mais.</p>
      </Shell>
    );
  }

  return (
    <Shell onClose={onClose} panelRef={panelRef} title={a ? nomeAssociado(a) : 'Carregando…'}
      subtitle={a && <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <StatusChip status={a.status_associado} />
        <span className="tabular-nums">{matriculaLabel(a.matricula)}</span>
        <span className="tabular-nums">{formatCnpj(a.cnpj)}</span>
      </span>}>
      <div className="px-6 border-b border-line flex gap-1 overflow-x-auto" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
            className={`relative h-11 px-3 inline-flex items-center gap-2 text-sm font-semibold whitespace-nowrap transition-colors ${tab === t.id ? 'text-fg' : 'text-fg-3 hover:text-fg-2'}`}>
            <t.icon size={15} /> {t.label}
            {tab === t.id && <span className="absolute left-2 right-2 -bottom-px h-[3px] rounded-full bg-energy" />}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {!a ? (
          <div className="p-6 space-y-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-10" />)}</div>
        ) : tab === 'dados' ? (
          <div className="p-6 space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Status">
                <select className="field" value={form.status_associado} onChange={(e) => set('status_associado', e.target.value as Associado['status_associado'])}>
                  {STATUS.map((s) => <option key={s.id} value={s.id}>{s.label.replace(/s$/, '')}</option>)}
                </select>
              </Field>
              <Field label="Plano" hint={!planos.length ? 'Cadastre planos em Configurações.' : undefined}>
                <select className="field" value={form.plano_id || ''} onChange={(e) => set('plano_id', e.target.value || null)}>
                  <option value="">Sem plano</option>
                  {planos.filter((p) => p.ativo || p.id === form.plano_id).map((p) => <option key={p.id} value={p.id}>{p.nome} · {brl(Number(p.valor))} {CICLO_LABEL[p.ciclo]}</option>)}
                </select>
              </Field>
              <Field label="Nome fantasia"><input className="field" value={form.nome_fantasia || ''} onChange={(e) => set('nome_fantasia', e.target.value)} /></Field>
              <Field label="Razão social"><input className="field" value={form.razao_social || ''} onChange={(e) => set('razao_social', e.target.value)} /></Field>
              <Field label="Responsável"><input className="field" value={form.contato_nome || ''} onChange={(e) => set('contato_nome', e.target.value)} /></Field>
              <Field label="WhatsApp" hint="Usado para enviar o contrato pela Evolution."><input className="field tabular-nums" inputMode="tel" value={formatPhone(form.telefone || '')} onChange={(e) => set('telefone', e.target.value.replace(/\D/g, ''))} /></Field>
              <Field label="E-mail" className="sm:col-span-2"><input className="field" type="email" value={form.email || ''} onChange={(e) => set('email', e.target.value)} /></Field>
              <Field label="Cidade"><input className="field" value={form.municipio || ''} onChange={(e) => set('municipio', e.target.value)} /></Field>
              <Field label="UF"><input className="field uppercase" maxLength={2} value={form.uf || ''} onChange={(e) => set('uf', e.target.value.toUpperCase())} /></Field>
              <Field label="Observações internas" className="sm:col-span-2">
                <textarea className="field min-h-[96px]" value={form.observacoes_crm || ''} onChange={(e) => set('observacoes_crm', e.target.value)} placeholder="Visível só para a equipe da FPGD" />
              </Field>
            </div>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm border-t border-line pt-5">
              <div><dt className="text-fg-3 text-xs">Cadastro</dt><dd className="tabular-nums mt-0.5">{dataBR(a.created_at)}</dd></div>
              <div><dt className="text-fg-3 text-xs">Adesão</dt><dd className="tabular-nums mt-0.5">{dataBR(a.data_adesao)}</dd></div>
              <div><dt className="text-fg-3 text-xs">Status desde</dt><dd className="tabular-nums mt-0.5">{dataBR(a.status_alterado_em)}</dd></div>
            </dl>
            {role === 'superadmin' && (
              <label className="flex items-center justify-between gap-4 rounded-[10px] bg-field border border-line px-4 py-3 cursor-pointer">
                <span>
                  <span className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck size={16} className="text-energy" /> Administrador da FPGD</span>
                  <span className="block text-xs text-fg-3 mt-0.5">Acessa CRM, Pagamentos e Configurações. {a.email ? `Entra com ${a.email}.` : 'Precisa de login cadastrado para usar.'}</span>
                </span>
                <input type="checkbox" role="switch" className="accent-[#2F8CFF] size-5" checked={a.is_admin} disabled={busy === 'admin'}
                  onChange={async (e) => {
                    const v = e.target.checked;
                    setBusy('admin');
                    const { error } = await supabase.from('companies').update({ is_admin: v }).eq('id', a.id);
                    if (!error) await supabase.from('crm_eventos').insert({ company_id: a.id, tipo: 'acesso', descricao: v ? 'Promovido a administrador da FPGD.' : 'Acesso de administrador removido.' });
                    setBusy(null);
                    if (error) { toast('error', error.message); return; }
                    toast('ok', v ? `${nomeAssociado(a)} agora é admin.` : `${nomeAssociado(a)} não é mais admin.`);
                    await load();
                  }} />
              </label>
            )}
          </div>
        ) : tab === 'contrato' ? (
          <ContratoTab a={a} planos={planos} contratos={contratos} busy={busy} setBusy={setBusy} reload={async () => { await load(); onChanged(); }} />
        ) : tab === 'cobranca' ? (
          <CobrancaTab a={a} planos={planos} fin={fin} busy={busy} setBusy={setBusy} reload={async () => { await load(); onChanged(); }} canCancel={canManage} />
        ) : tab === 'crm' ? (
          <TenantCrmTab a={a} reload={async () => { await load(); onChanged(); }} />
        ) : (
          <div className="p-6">
            {eventos.length === 0 ? (
              <p className="text-sm text-fg-3 py-10 text-center">Nada registrado ainda. Mudanças de status, contratos e pagamentos aparecem aqui.</p>
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

      {tab === 'dados' && a && (
        <footer className="px-6 py-4 border-t border-line flex items-center justify-end gap-2 bg-panel">
          {dirty && <span className="text-xs text-fg-3 mr-auto">Alterações não salvas</span>}
          <button className="btn btn-ghost" onClick={() => setForm(a)} disabled={!dirty}>Descartar</button>
          <button className="btn btn-primary" onClick={saveDados} disabled={!dirty || busy === 'dados'}>
            <Save size={16} /> {busy === 'dados' ? 'Salvando…' : 'Salvar'}
          </button>
        </footer>
      )}
    </Shell>
  );
};

// ---------- Contrato ----------
const ContratoTab: React.FC<{
  a: Associado; planos: Plano[]; contratos: Contrato[]; busy: string | null; setBusy: (b: string | null) => void; reload: () => Promise<void>;
}> = ({ a, planos, contratos, busy, setBusy, reload }) => {
  const toast = useToast();
  const atual = contratos[0];
  const editavel = !atual || atual.status === 'rascunho';
  const [texto, setTexto] = useState(atual?.conteudo || '');
  const [planoId, setPlanoId] = useState(a.plano_id || '');
  const [canais, setCanais] = useState({ whatsapp: true, email: true });

  useEffect(() => { setTexto(atual?.conteudo || ''); }, [atual?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const gerar = async () => {
    setBusy('gerar');
    let template = DEFAULT_CONTRATO;
    try {
      const cfg = await callFn<Record<string, any>>('crm-config', { action: 'get' });
      if (cfg.contrato?.template) template = cfg.contrato.template;
    } catch { /* usa o modelo padrão */ }
    const plano = planos.find((p) => p.id === planoId) || null;
    const conteudo = renderContrato(template, a, plano);
    const res = atual && atual.status === 'rascunho'
      ? await supabase.from('contratos').update({ conteudo, plano_id: plano?.id ?? null }).eq('id', atual.id)
      : await supabase.from('contratos').insert({ company_id: a.id, plano_id: plano?.id ?? null, conteudo });
    setBusy(null);
    if (res.error) { toast('error', `Não foi possível gerar o contrato: ${res.error.message}`); return; }
    if (!atual || atual.status !== 'rascunho') await supabase.from('crm_eventos').insert({ company_id: a.id, tipo: 'contrato', descricao: 'Contrato de adesão gerado.' });
    toast('ok', 'Contrato gerado. Revise o texto antes de enviar.');
    await reload();
  };

  const salvar = async () => {
    if (!atual) return;
    setBusy('salvar');
    const { error } = await supabase.from('contratos').update({ conteudo: texto }).eq('id', atual.id);
    setBusy(null);
    if (error) toast('error', `Não foi possível salvar: ${error.message}`);
    else { toast('ok', 'Rascunho salvo.'); await reload(); }
  };

  const enviar = async () => {
    if (!atual) return;
    if (texto !== atual.conteudo) await supabase.from('contratos').update({ conteudo: texto }).eq('id', atual.id);
    setBusy('enviar');
    try {
      const r = await callFn<{ link: string | null; enviado_whatsapp: boolean; enviado_email: boolean; avisos: string[] }>('crm-contrato', { action: 'enviar', contrato_id: atual.id, canais });
      const via = [r.enviado_whatsapp && 'WhatsApp', r.enviado_email && 'e-mail'].filter(Boolean).join(' e ');
      toast('ok', via ? `Contrato enviado para assinatura por ${via}.` : 'Contrato criado no Documenso. Nenhuma mensagem foi enviada; copie o link abaixo.');
      r.avisos?.forEach((m) => toast('error', m));
    } catch (e) {
      toast('error', (e as Error).message);
    }
    setBusy(null);
    await reload();
  };

  const verificar = async () => {
    if (!atual) return;
    setBusy('verificar');
    try {
      const r = await callFn<{ status: Contrato['status'] }>('crm-contrato', { action: 'verificar', contrato_id: atual.id });
      toast('ok', `Situação da assinatura: ${contratoMeta(r.status).label.toLowerCase()}.`);
    } catch (e) { toast('error', (e as Error).message); }
    setBusy(null);
    await reload();
  };

  const novo = async () => {
    if (!atual) return;
    await supabase.from('contratos').update({ status: 'cancelado' }).eq('id', atual.id);
    await supabase.from('crm_eventos').insert({ company_id: a.id, tipo: 'contrato', descricao: 'Contrato anterior cancelado para emissão de um novo.' });
    await reload();
  };

  return (
    <div className="p-6 space-y-5">
      {!atual || atual.status === 'cancelado' || atual.status === 'recusado' ? (
        <div className="rounded-[16px] border border-dashed border-line-strong p-6">
          <h3 className="font-bold">{atual ? 'Emitir novo contrato' : 'Gerar contrato de adesão'}</h3>
          <p className="text-sm text-fg-2 mt-1">O texto é montado a partir do modelo em Configurações com os dados deste associado e do plano escolhido.</p>
          <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-end">
            <Field label="Plano do contrato" className="flex-1">
              <select className="field" value={planoId} onChange={(e) => setPlanoId(e.target.value)}>
                <option value="">Escolha um plano</option>
                {planos.filter((p) => p.ativo).map((p) => <option key={p.id} value={p.id}>{p.nome} · {brl(Number(p.valor))} {CICLO_LABEL[p.ciclo]}</option>)}
              </select>
            </Field>
            <button className="btn btn-primary" onClick={gerar} disabled={!planoId || busy === 'gerar'}><FileText size={16} /> {busy === 'gerar' ? 'Gerando…' : 'Gerar contrato'}</button>
          </div>
          {!planos.length && <p className="text-xs text-st-inadimplente mt-3">Nenhum plano cadastrado. Crie um em Configurações › Planos e valores.</p>}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div>
            <p className={`text-sm font-bold ${contratoMeta(atual.status).cls}`}>{contratoMeta(atual.status).label}</p>
            <p className="text-xs text-fg-3 mt-0.5 tabular-nums">
              Gerado em {dataBR(atual.created_at)}
              {atual.enviado_em && <> · enviado em {dataBR(atual.enviado_em)}{atual.enviado_whatsapp && ' por WhatsApp'}{atual.enviado_email && (atual.enviado_whatsapp ? ' e e-mail' : ' por e-mail')}</>}
              {atual.assinado_em && <> · assinado em {dataBR(atual.assinado_em)}</>}
            </p>
          </div>
          {atual.status === 'rascunho' && <button className="btn btn-ghost btn-sm" onClick={gerar} disabled={busy === 'gerar'}><RefreshCw size={14} /> Regerar do modelo</button>}
          {atual.status === 'enviado' && <button className="btn btn-secondary btn-sm" onClick={verificar} disabled={busy === 'verificar'}><RefreshCw size={14} /> {busy === 'verificar' ? 'Consultando…' : 'Verificar assinatura'}</button>}
          {atual.status === 'enviado' && <button className="btn btn-ghost btn-sm" onClick={novo}><Ban size={14} /> Cancelar e emitir outro</button>}
        </div>
      )}

      {atual && atual.status !== 'cancelado' && (
        <>
          {atual.link_assinatura && (
            <div className="flex items-center gap-2 rounded-[10px] bg-field border border-line p-2 pl-3">
              <span className="text-xs text-fg-3 shrink-0">Link de assinatura</span>
              <a className="text-sm text-primary truncate flex-1 hover:underline" href={atual.link_assinatura} target="_blank" rel="noreferrer">{atual.link_assinatura}</a>
              <button className="btn btn-ghost btn-sm" onClick={() => { navigator.clipboard?.writeText(atual.link_assinatura!); toast('ok', 'Link copiado.'); }}><Copy size={14} /> Copiar</button>
              <a className="btn btn-ghost btn-sm" href={atual.link_assinatura} target="_blank" rel="noreferrer" aria-label="Abrir link"><ExternalLink size={14} /></a>
            </div>
          )}
          <Field label={editavel ? 'Texto do contrato (editável até o envio)' : 'Texto enviado'}>
            <textarea className="field min-h-[340px] font-[inherit] text-[13px] leading-relaxed" value={texto} onChange={(e) => setTexto(e.target.value)} readOnly={!editavel} />
          </Field>

          {editavel && (
            <div className="rounded-[16px] bg-raised border border-line p-4">
              <p className="text-sm font-bold">Enviar para assinatura</p>
              <p className="text-xs text-fg-3 mt-0.5">O PDF vai para o Documenso. Por e-mail, o convite sai do próprio Documenso; pelo WhatsApp, enviamos o link de assinatura. O associado precisa ter e-mail cadastrado.</p>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <label className={`inline-flex items-center gap-2 ${!a.telefone ? 'opacity-50' : ''}`}>
                  <input type="checkbox" className="accent-[#2F8CFF] size-4" checked={canais.whatsapp && !!a.telefone} disabled={!a.telefone} onChange={(e) => setCanais((c) => ({ ...c, whatsapp: e.target.checked }))} />
                  <MessageCircle size={15} className="text-fg-2" /> WhatsApp {a.telefone ? <span className="text-fg-3 tabular-nums">{formatPhone(a.telefone)}</span> : <span className="text-fg-3">sem telefone</span>}
                </label>
                <label className={`inline-flex items-center gap-2 ${!a.email ? 'opacity-50' : ''}`}>
                  <input type="checkbox" className="accent-[#2F8CFF] size-4" checked={canais.email && !!a.email} disabled={!a.email} onChange={(e) => setCanais((c) => ({ ...c, email: e.target.checked }))} />
                  <Mail size={15} className="text-fg-2" /> E-mail {a.email ? <span className="text-fg-3">{a.email}</span> : <span className="text-fg-3">sem e-mail</span>}
                </label>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button className="btn btn-secondary" onClick={salvar} disabled={texto === atual.conteudo || busy === 'salvar'}><Save size={15} /> Salvar rascunho</button>
                <button className="btn btn-primary" onClick={enviar} disabled={busy === 'enviar' || !a.email}>
                  <Send size={15} /> {busy === 'enviar' ? 'Enviando…' : 'Enviar para assinatura'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {contratos.length > 1 && (
        <div>
          <p className="text-xs font-semibold text-fg-3 mb-2">Contratos anteriores</p>
          <ul className="divide-y divide-line rounded-[10px] border border-line">
            {contratos.slice(1).map((c) => (
              <li key={c.id} className="px-3 py-2 text-sm flex justify-between gap-3">
                <span className={contratoMeta(c.status).cls}>{contratoMeta(c.status).label}</span>
                <span className="text-fg-3 tabular-nums">{dataBR(c.created_at)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// ---------- Cobrança (Asaas) ----------
const CobrancaTab: React.FC<{
  a: Associado; planos: Plano[]; fin: Financeiro | null; busy: string | null; setBusy: (b: string | null) => void; reload: () => Promise<void>; canCancel: boolean;
}> = ({ a, planos, fin, busy, setBusy, reload, canCancel }) => {
  const toast = useToast();
  const [planoId, setPlanoId] = useState(a.plano_id || '');
  const [billing, setBilling] = useState('UNDEFINED');
  const [due, setDue] = useState('');
  const [pagamentos, setPagamentos] = useState<{ id: string; valor: number; vencimento: string; status: string; url: string }[] | null>(null);
  const ativa = fin?.asaas_subscription_id && fin.status_assinatura === 'ACTIVE';

  const run = async (action: string, extra: Record<string, unknown> = {}, ok?: string) => {
    setBusy(action);
    try {
      const r = await callFn<any>('crm-asaas', { action, company_id: a.id, ...extra });
      if (r.pagamentos) setPagamentos(r.pagamentos);
      if (ok) toast('ok', ok);
    } catch (e) { toast('error', (e as Error).message); }
    setBusy(null);
    await reload();
  };

  return (
    <div className="p-6 space-y-5">
      {fin?.asaas_subscription_id ? (
        <div className="rounded-[16px] border border-line bg-raised p-5 glow-corner">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs text-fg-3">Assinatura no Asaas</p>
              <p className="text-2xl font-extrabold tabular-nums mt-1">{brl(fin.valor)}</p>
              <p className="text-sm text-fg-2 mt-0.5">{ASAAS_STATUS[fin.status_assinatura || ''] || fin.status_assinatura}</p>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-secondary btn-sm" onClick={() => run('sincronizar', {}, 'Cobrança sincronizada com o Asaas.')} disabled={busy === 'sincronizar'}>
                <RefreshCw size={14} /> {busy === 'sincronizar' ? 'Sincronizando…' : 'Sincronizar'}
              </button>
              {fin.invoice_url && <a className="btn btn-secondary btn-sm" href={fin.invoice_url} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Fatura</a>}
            </div>
          </div>
          <dl className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div><dt className="text-xs text-fg-3">Próximo vencimento</dt><dd className="tabular-nums mt-0.5">{dataBR(fin.proximo_vencimento)}</dd></div>
            <div><dt className="text-xs text-fg-3">Última cobrança</dt><dd className="mt-0.5">{ASAAS_STATUS[fin.ultimo_pagamento_status || ''] || '—'}</dd></div>
            <div><dt className="text-xs text-fg-3">Último pagamento</dt><dd className="tabular-nums mt-0.5">{dataBR(fin.ultimo_pagamento_em)}</dd></div>
          </dl>
        </div>
      ) : (
        <div className="rounded-[16px] border border-dashed border-line-strong p-6">
          <h3 className="font-bold">Criar cobrança recorrente no Asaas</h3>
          <p className="text-sm text-fg-2 mt-1">Cadastra o associado como cliente no Asaas (se ainda não existir) e cria a assinatura no valor do plano.</p>
          <div className="mt-4 grid sm:grid-cols-3 gap-3">
            <Field label="Plano">
              <select className="field" value={planoId} onChange={(e) => setPlanoId(e.target.value)}>
                <option value="">Escolha</option>
                {planos.filter((p) => p.ativo).map((p) => <option key={p.id} value={p.id}>{p.nome} · {brl(Number(p.valor))}</option>)}
              </select>
            </Field>
            <Field label="Forma de pagamento">
              <select className="field" value={billing} onChange={(e) => setBilling(e.target.value)}>
                <option value="UNDEFINED">Associado escolhe</option>
                <option value="PIX">Pix</option>
                <option value="BOLETO">Boleto</option>
                <option value="CREDIT_CARD">Cartão de crédito</option>
              </select>
            </Field>
            <Field label="1º vencimento" hint="Vazio = próximo dia de vencimento do plano.">
              <input type="date" className="field" value={due} onChange={(e) => setDue(e.target.value)} />
            </Field>
          </div>
          <div className="mt-4 flex justify-end">
            <button className="btn btn-primary" disabled={!planoId || busy === 'assinar'}
              onClick={() => run('assinar', { plano_id: planoId, billing_type: billing, next_due_date: due || undefined }, 'Assinatura criada no Asaas.')}>
              <CreditCard size={16} /> {busy === 'assinar' ? 'Criando…' : 'Criar assinatura'}
            </button>
          </div>
        </div>
      )}

      {pagamentos && (
        <div>
          <p className="text-xs font-semibold text-fg-3 mb-2">Últimas cobranças</p>
          <ul className="divide-y divide-line rounded-[10px] border border-line">
            {pagamentos.map((p) => (
              <li key={p.id} className="px-3 py-2.5 text-sm flex items-center gap-3">
                <span className="tabular-nums text-fg-2 w-24">{dataBR(p.vencimento)}</span>
                <span className="tabular-nums flex-1">{brl(p.valor)}</span>
                <span className={p.status === 'OVERDUE' ? 'text-st-inadimplente' : ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(p.status) ? 'text-st-ativo' : 'text-fg-2'}>{ASAAS_STATUS[p.status] || p.status}</span>
                {p.url && <a className="text-primary hover:underline" href={p.url} target="_blank" rel="noreferrer">Ver</a>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {ativa && canCancel && (
        <div className="pt-4 border-t border-line flex items-center justify-between gap-3">
          <p className="text-xs text-fg-3">Cancelar interrompe as próximas cobranças. As já emitidas continuam no Asaas.</p>
          <button className="btn btn-danger btn-sm" disabled={busy === 'cancelar'}
            onClick={() => { if (confirm('Cancelar a assinatura deste associado no Asaas?')) run('cancelar', {}, 'Assinatura cancelada.'); }}>
            <Ban size={14} /> Cancelar assinatura
          </button>
        </div>
      )}
    </div>
  );
};

export default AssociadoModal;
