import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, LayoutGrid, Rows3, MapPin, Plus, RefreshCw, ArrowUpDown, Zap, Wrench } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { brl, dataBR, formatPhone } from '../crm/data';
import { useToast } from '../crm/ui';
import { CLIENTE_COLS, ETAPAS, etapaMeta, kwp, type Cliente, type Etapa } from './data';
import { useTenant } from './useTenant';
import TenantHeader from './TenantHeader';
import ClienteModal from './ClienteModal';

type View = 'kanban' | 'lista';
type SortKey = 'nome' | 'valor' | 'created_at';
const readView = (): View => { try { return (localStorage.getItem('tenant.view') as View) || 'kanban'; } catch { return 'kanban'; } };

const ClientesPage: React.FC = () => {
  const toast = useToast();
  const tenant = useTenant();
  const { companyId } = tenant;
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [view, setView] = useState<View>(readView);
  const [q, setQ] = useState('');
  const [etapaFilter, setEtapaFilter] = useState<Etapa | 'todas'>('todas');
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'created_at', dir: -1 });
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<Etapa | null>(null);

  const openId = params.get('c');
  const openCliente = (id: string) => setParams((p) => { p.set('c', id); return p; });
  const closeCliente = useCallback(() => setParams((p) => { p.delete('c'); return p; }, { replace: true }), [setParams]);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoadError('');
    const { data, error } = await supabase.from('tenant_clientes').select(CLIENTE_COLS).eq('company_id', companyId).order('created_at', { ascending: false });
    if (error) setLoadError(error.message);
    else setRows((data || []) as Cliente[]);
    setLoading(false);
  }, [companyId]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { try { localStorage.setItem('tenant.view', view); } catch { /* sem storage */ } }, [view]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const digits = term.replace(/\D/g, '');
    if (!term) return rows;
    return rows.filter((r) => [r.nome, r.cidade, r.email, r.origem].some((v) => v?.toLowerCase().includes(term))
      || (digits.length >= 3 && [r.documento, r.telefone].some((v) => v?.includes(digits))));
  }, [rows, q]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { todas: filtered.length };
    for (const e of ETAPAS) c[e.id] = filtered.filter((r) => r.etapa === e.id).length;
    return c;
  }, [filtered]);

  const listRows = useMemo(() => {
    const base = etapaFilter === 'todas' ? filtered : filtered.filter((r) => r.etapa === etapaFilter);
    const val = (r: Cliente) => (sort.key === 'nome' ? r.nome.toLowerCase() : sort.key === 'valor' ? Number(r.valor_estimado || 0) : r.created_at);
    return [...base].sort((a, b) => (val(a) > val(b) ? 1 : val(a) < val(b) ? -1 : 0) * sort.dir);
  }, [filtered, etapaFilter, sort]);

  const funil = useMemo(() => rows.filter((r) => !['ganho', 'perdido'].includes(r.etapa)).reduce((s, r) => s + Number(r.valor_estimado || 0), 0), [rows]);

  const moveTo = async (id: string, etapa: Etapa) => {
    const row = rows.find((r) => r.id === id);
    if (!row || row.etapa === etapa || !companyId) return;
    const prev = row.etapa;
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, etapa } : r)));
    const { error } = await supabase.from('tenant_clientes').update({ etapa, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) {
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, etapa: prev } : r)));
      toast('error', `Não foi possível mover ${row.nome}: ${error.message}`);
      return;
    }
    await supabase.from('tenant_eventos').insert({ company_id: companyId, cliente_id: id, tipo: 'etapa', descricao: `Etapa alterada de ${etapaMeta(prev).label} para ${etapaMeta(etapa).label}.` });
    toast('ok', `${row.nome} agora está em ${etapaMeta(etapa).label}.`);
  };

  const toggleSort = (key: SortKey) => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : 1 }));

  if (!companyId) return null;

  return (
    <div>
      <TenantHeader tenant={tenant} title="Clientes"
        description="Do primeiro contato ao contrato fechado. Arraste um card para mudar a etapa."
        actions={<>
          <button className="btn btn-ghost" onClick={() => { setLoading(true); load(); }} aria-label="Atualizar lista"><RefreshCw size={16} /></button>
          <button className="btn btn-primary" onClick={() => openCliente('novo')}><Plus size={16} /> Novo cliente</button>
        </>}
      />

      <div className="panel glow-corner p-3 md:p-4 mb-5">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="relative flex-1 min-w-0">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-3" />
            <input className="field !pl-9" placeholder="Buscar cliente, cidade, telefone…" title="Busca por nome, cidade, e-mail, origem, CPF/CNPJ ou telefone" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="inline-flex p-1 rounded-[10px] bg-field border border-line self-start" role="tablist" aria-label="Visualização">
            {([['kanban', LayoutGrid, 'Kanban'], ['lista', Rows3, 'Lista']] as const).map(([v, Icon, label]) => (
              <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)}
                className={`h-8 px-3 rounded-[7px] inline-flex items-center gap-2 text-sm font-semibold transition-colors ${view === v ? 'bg-raised text-fg shadow-[0_1px_2px_rgb(0_0_0/.4)]' : 'text-fg-3 hover:text-fg'}`}>
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1 overflow-x-auto overflow-y-hidden pb-px -mx-1 px-1" role="tablist" aria-label="Etapas">
          {[{ id: 'todas' as const, label: 'Todas' }, ...ETAPAS].map((s) => {
            const active = etapaFilter === s.id;
            return (
              <button key={s.id} role="tab" aria-selected={active} onClick={() => setEtapaFilter(s.id)}
                className={`relative h-9 px-3 text-sm font-semibold whitespace-nowrap transition-colors ${active ? 'text-fg' : 'text-fg-3 hover:text-fg-2'}`}>
                {s.label} <span className="tabular-nums text-fg-3 ml-1">{counts[s.id] ?? 0}</span>
                {active && <span className="absolute left-3 right-3 -bottom-px h-[3px] rounded-full bg-energy" />}
              </button>
            );
          })}
          <span className="ml-auto pl-4 text-sm text-fg-3 whitespace-nowrap hidden md:block">
            Em negociação <b className="text-fg tabular-nums">{brl(funil)}</b>
          </span>
        </div>
      </div>

      {loadError && (
        <div className="panel p-4 mb-4 border-danger/40 text-sm">
          Não foi possível carregar os clientes: {loadError}. <button className="underline text-primary" onClick={load}>Tentar de novo</button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-[420px]" />)}</div>
      ) : rows.length === 0 ? (
        <div className="panel px-6 py-16 text-center">
          <Wrench size={26} className="mx-auto text-fg-3" />
          <h2 className="mt-4 text-lg font-bold">Comece pelo primeiro cliente</h2>
          <p className="mt-1 text-sm text-fg-2 max-w-[48ch] mx-auto">Cadastre quem pediu orçamento. Depois é só dimensionar, montar a proposta e enviar o contrato daqui mesmo.</p>
          <button className="btn btn-secondary mt-6" onClick={() => openCliente('novo')}><Plus size={16} /> Cadastrar cliente</button>
        </div>
      ) : view === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 snap-x">
          {ETAPAS.filter((s) => etapaFilter === 'todas' || s.id === etapaFilter).map((col) => {
            const items = filtered.filter((r) => r.etapa === col.id);
            const total = items.reduce((acc, r) => acc + Number(r.valor_estimado || 0), 0);
            return (
              <section key={col.id} aria-label={col.label}
                onDragOver={(e) => { e.preventDefault(); setOverCol(col.id); }}
                onDragLeave={() => setOverCol((c) => (c === col.id ? null : c))}
                onDrop={(e) => { e.preventDefault(); setOverCol(null); if (dragId) moveTo(dragId, col.id); setDragId(null); }}
                className={`snap-start shrink-0 w-[264px] flex flex-col rounded-[16px] border transition-colors ${overCol === col.id ? 'border-primary bg-primary/5' : 'border-line bg-panel/60'}`}>
                <header className="px-4 pt-4 pb-3">
                  <div className="flex items-center gap-2">
                    <span className={`size-2 rounded-full ${col.bg}`} />
                    <h2 className="text-sm font-bold">{col.label}</h2>
                    <span className="ml-auto text-xs font-semibold tabular-nums text-fg-3 bg-raised rounded-full px-2 py-0.5">{items.length}</span>
                  </div>
                  <p className="text-xs text-fg-3 mt-1">{col.hint}{total > 0 && <> · <span className="tabular-nums">{brl(total)}</span></>}</p>
                </header>
                <div className="flex-1 px-2.5 pb-2.5 space-y-2 overflow-y-auto max-h-[calc(100vh-330px)] min-h-[160px]">
                  {items.length === 0 && (
                    <p className="text-xs text-fg-3 text-center px-4 py-8 border border-dashed border-line rounded-[10px]">Arraste um card para cá.</p>
                  )}
                  {items.map((r) => (
                    <article key={r.id} draggable tabIndex={0}
                      onDragStart={(e) => { setDragId(r.id); e.dataTransfer.effectAllowed = 'move'; }}
                      onDragEnd={() => { setDragId(null); setOverCol(null); }}
                      onClick={() => openCliente(r.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter') openCliente(r.id); }}
                      className={`group rounded-[10px] bg-raised border border-line p-3 cursor-pointer select-none transition-[border-color,transform,opacity] duration-150 hover:border-line-strong active:scale-[.98] ${dragId === r.id ? 'opacity-40' : ''}`}>
                      <h3 className="text-sm font-bold leading-snug text-fg group-hover:text-primary-hover transition-colors line-clamp-2">{r.nome}</h3>
                      {r.cidade && <p className="mt-1 text-xs text-fg-3 flex items-center gap-1"><MapPin size={12} />{r.cidade}{r.uf ? `/${r.uf}` : ''}</p>}
                      {(r.potencia_kwp || r.valor_estimado || r.consumo_kwh) && (
                        <div className="mt-2 pt-2 border-t border-line flex items-center justify-between gap-2 text-xs tabular-nums">
                          <span className="text-fg-2 flex items-center gap-1">
                            <Zap size={12} className="text-fg-3" />
                            {r.potencia_kwp ? kwp(r.potencia_kwp) : r.consumo_kwh ? `${Number(r.consumo_kwh).toLocaleString('pt-BR')} kWh/mês` : '—'}
                          </span>
                          {r.valor_estimado ? <span className="font-bold text-fg">{brl(r.valor_estimado)}</span> : null}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-fg-3 border-b border-line">
                  <th className="font-semibold px-4 py-3 w-[140px]">Etapa</th>
                  <th className="font-semibold px-4 py-3"><button className="inline-flex items-center gap-1 hover:text-fg" onClick={() => toggleSort('nome')}>Cliente <ArrowUpDown size={12} /></button></th>
                  <th className="font-semibold px-4 py-3">Cidade</th>
                  <th className="font-semibold px-4 py-3">WhatsApp</th>
                  <th className="font-semibold px-4 py-3 text-right">Potência</th>
                  <th className="font-semibold px-4 py-3 text-right"><button className="inline-flex items-center gap-1 hover:text-fg" onClick={() => toggleSort('valor')}>Valor <ArrowUpDown size={12} /></button></th>
                  <th className="font-semibold px-4 py-3">Origem</th>
                  <th className="font-semibold px-4 py-3"><button className="inline-flex items-center gap-1 hover:text-fg" onClick={() => toggleSort('created_at')}>Cadastro <ArrowUpDown size={12} /></button></th>
                </tr>
              </thead>
              <tbody>
                {listRows.length === 0 && <tr><td colSpan={8} className="px-4 py-16 text-center text-fg-3">Nenhum cliente com esses filtros. Limpe a busca ou escolha outra etapa.</td></tr>}
                {listRows.map((r) => {
                  const m = etapaMeta(r.etapa);
                  return (
                    <tr key={r.id} className="border-b border-line last:border-0 hover:bg-raised/60 transition-colors">
                      <td className="px-4 py-3.5"><span className={`chip ${m.color}`}><span className={`size-1.5 rounded-full ${m.bg}`} />{m.label}</span></td>
                      <td className="px-4 py-3.5 max-w-[260px]">
                        <button className="text-left font-semibold text-primary hover:text-primary-hover hover:underline truncate max-w-full block" onClick={() => openCliente(r.id)}>{r.nome}</button>
                        {r.email && <span className="block text-xs text-fg-3 truncate">{r.email}</span>}
                      </td>
                      <td className="px-4 py-3.5 text-fg-2 whitespace-nowrap">{r.cidade ? `${r.cidade}${r.uf ? `/${r.uf}` : ''}` : '—'}</td>
                      <td className="px-4 py-3.5 text-fg-2 whitespace-nowrap tabular-nums">{r.telefone ? formatPhone(r.telefone) : '—'}</td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap tabular-nums text-fg-2">{kwp(r.potencia_kwp)}</td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap tabular-nums">{brl(r.valor_estimado)}</td>
                      <td className="px-4 py-3.5 text-fg-2 whitespace-nowrap">{r.origem || '—'}</td>
                      <td className="px-4 py-3.5 text-fg-3 whitespace-nowrap tabular-nums">{dataBR(r.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {openId && (
        <ClienteModal key={openId} id={openId} tenant={tenant} onClose={closeCliente}
          onCreated={(id) => { load(); openCliente(id); }} onChanged={load} />
      )}
    </div>
  );
};

export default ClientesPage;
