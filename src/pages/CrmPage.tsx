import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, LayoutGrid, Rows3, MapPin, FileSignature, RefreshCw, ArrowUpDown, UserPlus } from 'lucide-react';
import { supabase } from '../supabaseClient';
import {
  ASSOCIADO_COLS, STATUS, brl, dataBR, formatCnpj, matriculaLabel, nomeAssociado,
  type Associado, type Contrato, type Financeiro, type Plano, type StatusAssociado, statusLabel,
} from '../crm/data';
import { PageHeader, StatusChip, STATUS_BG, contratoMeta, useToast } from '../crm/ui';
import AssociadoModal from '../crm/AssociadoModal';

type View = 'kanban' | 'lista';
type SortKey = 'matricula' | 'nome' | 'created_at';

const readView = (): View => {
  try { return (localStorage.getItem('crm.view') as View) || 'kanban'; } catch { return 'kanban'; }
};

const CrmPage: React.FC = () => {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState<Associado[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [contratos, setContratos] = useState<Record<string, Contrato['status']>>({});
  const [fin, setFin] = useState<Record<string, Financeiro>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [view, setView] = useState<View>(readView);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusAssociado | 'todos'>('todos');
  const [planoFilter, setPlanoFilter] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'matricula', dir: 1 });
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<StatusAssociado | null>(null);

  const openId = params.get('a');
  const openAssociado = (id: string) => setParams((p) => { p.set('a', id); return p; });
  const closeAssociado = () => setParams((p) => { p.delete('a'); return p; }, { replace: true });

  const load = useCallback(async () => {
    setLoadError('');
    const [a, p, c, f] = await Promise.all([
      supabase.from('companies').select(ASSOCIADO_COLS).eq('user_type', 'integrador').order('matricula', { ascending: true }),
      supabase.from('planos').select('*').order('valor'),
      supabase.from('contratos').select('company_id, status, created_at').order('created_at', { ascending: false }),
      supabase.from('associado_financeiro').select('*'),
    ]);
    if (a.error) { setLoadError(a.error.message); setLoading(false); return; }
    setRows((a.data || []) as Associado[]);
    setPlanos((p.data || []) as Plano[]);
    const cmap: Record<string, Contrato['status']> = {};
    for (const r of (c.data || []) as { company_id: string; status: Contrato['status'] }[]) if (!cmap[r.company_id]) cmap[r.company_id] = r.status;
    setContratos(cmap);
    const fmap: Record<string, Financeiro> = {};
    for (const r of (f.data || []) as Financeiro[]) fmap[r.company_id] = r;
    setFin(fmap);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { try { localStorage.setItem('crm.view', view); } catch { /* sem storage */ } }, [view]);

  const planoById = useMemo(() => Object.fromEntries(planos.map((p) => [p.id, p])), [planos]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const digits = term.replace(/\D/g, '');
    return rows.filter((r) => {
      if (planoFilter && r.plano_id !== planoFilter) return false;
      if (!term) return true;
      return [r.nome_fantasia, r.razao_social, r.municipio, r.email, r.contato_nome].some((v) => v?.toLowerCase().includes(term))
        || (digits.length >= 3 && (r.cnpj?.includes(digits) || String(r.matricula ?? '').includes(digits)));
    });
  }, [rows, q, planoFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { todos: filtered.length };
    for (const s of STATUS) c[s.id] = filtered.filter((r) => r.status_associado === s.id).length;
    return c;
  }, [filtered]);

  const listRows = useMemo(() => {
    const base = statusFilter === 'todos' ? filtered : filtered.filter((r) => r.status_associado === statusFilter);
    const val = (r: Associado) => sort.key === 'nome' ? nomeAssociado(r).toLowerCase() : sort.key === 'matricula' ? (r.matricula ?? 0) : r.created_at;
    return [...base].sort((a, b) => (val(a) > val(b) ? 1 : val(a) < val(b) ? -1 : 0) * sort.dir);
  }, [filtered, statusFilter, sort]);

  const mensalidade = (r: Associado) => fin[r.id]?.valor ?? (r.plano_id ? planoById[r.plano_id]?.valor : null);

  const moveTo = async (id: string, status: StatusAssociado) => {
    const row = rows.find((r) => r.id === id);
    if (!row || row.status_associado === status) return;
    const prev = row.status_associado;
    const patch: Partial<Associado> = { status_associado: status };
    if (status === 'ativo' && !row.data_adesao) patch.data_adesao = new Date().toISOString().slice(0, 10);
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    const { error } = await supabase.from('companies').update(patch).eq('id', id);
    if (error) {
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status_associado: prev } : r)));
      toast('error', `Não foi possível mover ${nomeAssociado(row)}: ${error.message}`);
      return;
    }
    await supabase.from('crm_eventos').insert({ company_id: id, tipo: 'status', descricao: `Status alterado de ${statusLabel(prev)} para ${statusLabel(status)}.` });
    toast('ok', `${nomeAssociado(row)} agora está em ${statusLabel(status)}.`);
  };

  const toggleSort = (key: SortKey) => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : 1 }));

  const mrr = useMemo(() => rows.filter((r) => r.status_associado === 'ativo').reduce((acc, r) => acc + Number(mensalidade(r) || 0), 0), [rows, fin, planoById]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <PageHeader
        title="Associados"
        description="Integradores e instaladores da Frente, do cadastro à mensalidade. Arraste um card para mudar o status."
        actions={<>
          <button className="btn btn-ghost" onClick={() => { setLoading(true); load(); }} aria-label="Atualizar lista"><RefreshCw size={16} /></button>
          <a className="btn btn-secondary" href="#/cadastro" target="_blank" rel="noreferrer"><UserPlus size={16} /> Cadastrar integrador</a>
        </>}
      />

      {/* Barra de filtros */}
      <div className="panel glow-corner p-3 md:p-4 mb-5">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="relative flex-1 min-w-0">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-3" />
            <input className="field !pl-9" placeholder="Buscar associado, CNPJ, cidade…" title="Busca por nome, CNPJ, cidade, e-mail ou matrícula" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className="field lg:!w-56" value={planoFilter} onChange={(e) => setPlanoFilter(e.target.value)} aria-label="Filtrar por plano">
            <option value="">Todos os planos</option>
            {planos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
          <div className="inline-flex p-1 rounded-[10px] bg-field border border-line self-start" role="tablist" aria-label="Visualização">
            {([['kanban', LayoutGrid, 'Kanban'], ['lista', Rows3, 'Lista']] as const).map(([v, Icon, label]) => (
              <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)}
                className={`h-8 px-3 rounded-[7px] inline-flex items-center gap-2 text-sm font-semibold transition-colors ${view === v ? 'bg-raised text-fg shadow-[0_1px_2px_rgb(0_0_0/.4)]' : 'text-fg-3 hover:text-fg'}`}>
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1 overflow-x-auto -mx-1 px-1" role="tablist" aria-label="Status">
          {[{ id: 'todos' as const, label: 'Todos' }, ...STATUS].map((s) => {
            const active = statusFilter === s.id;
            return (
              <button key={s.id} role="tab" aria-selected={active} onClick={() => setStatusFilter(s.id)}
                className={`relative h-9 px-3 text-sm font-semibold whitespace-nowrap transition-colors ${active ? 'text-fg' : 'text-fg-3 hover:text-fg-2'}`}>
                {s.label} <span className="tabular-nums text-fg-3 ml-1">{counts[s.id] ?? 0}</span>
                {active && <span className="absolute left-3 right-3 -bottom-px h-[3px] rounded-full bg-energy" />}
              </button>
            );
          })}
          <span className="ml-auto pl-4 text-sm text-fg-3 whitespace-nowrap hidden md:block">
            Receita recorrente dos ativos <b className="text-fg tabular-nums">{brl(mrr)}</b>
          </span>
        </div>
      </div>

      {loadError && (
        <div className="panel p-4 mb-4 border-danger/40 text-sm text-fg">
          Não foi possível carregar os associados: {loadError}. <button className="underline text-primary" onClick={load}>Tentar de novo</button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-[420px]" />)}
        </div>
      ) : view === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 snap-x">
          {STATUS.filter((s) => statusFilter === 'todos' || s.id === statusFilter).map((col) => {
            const items = filtered.filter((r) => r.status_associado === col.id);
            const total = items.reduce((acc, r) => acc + Number(mensalidade(r) || 0), 0);
            return (
              <section key={col.id} aria-label={col.label}
                onDragOver={(e) => { e.preventDefault(); setOverCol(col.id); }}
                onDragLeave={() => setOverCol((c) => (c === col.id ? null : c))}
                onDrop={(e) => { e.preventDefault(); setOverCol(null); if (dragId) moveTo(dragId, col.id); setDragId(null); }}
                className={`snap-start shrink-0 w-[280px] xl:w-auto xl:flex-1 xl:shrink xl:min-w-[196px] flex flex-col rounded-[16px] border transition-colors
                  ${overCol === col.id ? 'border-primary bg-primary/5' : 'border-line bg-panel/60'}`}>
                <header className="px-4 pt-4 pb-3">
                  <div className="flex items-center gap-2">
                    <span className={`size-2 rounded-full ${STATUS_BG[col.id]}`} />
                    <h2 className="text-sm font-bold">{col.label}</h2>
                    <span className="ml-auto text-xs font-semibold tabular-nums text-fg-3 bg-raised rounded-full px-2 py-0.5">{items.length}</span>
                  </div>
                  <p className="text-xs text-fg-3 mt-1">{col.hint}{total > 0 && <> · <span className="tabular-nums">{brl(total)}</span>/mês</>}</p>
                </header>
                <div className="flex-1 px-2.5 pb-2.5 space-y-2 overflow-y-auto max-h-[calc(100vh-330px)] min-h-[160px]">
                  {items.length === 0 && (
                    <p className="text-xs text-fg-3 text-center px-4 py-8 border border-dashed border-line rounded-[10px]">
                      Nenhum associado aqui. Arraste um card para esta coluna.
                    </p>
                  )}
                  {items.map((r) => {
                    const plano = r.plano_id ? planoById[r.plano_id] : null;
                    const ct = contratos[r.id];
                    return (
                      <article key={r.id} draggable
                        onDragStart={(e) => { setDragId(r.id); e.dataTransfer.effectAllowed = 'move'; }}
                        onDragEnd={() => { setDragId(null); setOverCol(null); }}
                        onClick={() => openAssociado(r.id)}
                        onKeyDown={(e) => { if (e.key === 'Enter') openAssociado(r.id); }}
                        tabIndex={0}
                        className={`group rounded-[10px] bg-raised border border-line p-3 cursor-pointer select-none transition-[border-color,transform,opacity] duration-150
                          hover:border-line-strong active:scale-[.98] ${dragId === r.id ? 'opacity-40' : ''}`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold tabular-nums text-fg-3">{matriculaLabel(r.matricula)}</span>
                          {plano && <span className="text-[11px] font-semibold text-fg-2 truncate">{plano.nome}</span>}
                        </div>
                        <h3 className="mt-1 text-sm font-bold leading-snug text-fg group-hover:text-primary-hover transition-colors line-clamp-2">{nomeAssociado(r)}</h3>
                        {r.municipio && (
                          <p className="mt-1 text-xs text-fg-3 flex items-center gap-1"><MapPin size={12} />{r.municipio}{r.uf ? `/${r.uf}` : ''}</p>
                        )}
                        {ct && (
                          <p className={`mt-2 pt-2 border-t border-line text-xs font-semibold flex items-center gap-1.5 ${contratoMeta(ct).cls}`}>
                            <FileSignature size={12} /> {contratoMeta(ct).label}
                          </p>
                        )}
                      </article>
                    );
                  })}
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
                  <th className="font-semibold px-4 py-3 w-[130px]">Status</th>
                  <th className="font-semibold px-4 py-3"><button className="inline-flex items-center gap-1 hover:text-fg" onClick={() => toggleSort('matricula')}>Matrícula <ArrowUpDown size={12} /></button></th>
                  <th className="font-semibold px-4 py-3"><button className="inline-flex items-center gap-1 hover:text-fg" onClick={() => toggleSort('nome')}>Associado <ArrowUpDown size={12} /></button></th>
                  <th className="font-semibold px-4 py-3">CNPJ</th>
                  <th className="font-semibold px-4 py-3">Cidade</th>
                  <th className="font-semibold px-4 py-3">Plano</th>
                  <th className="font-semibold px-4 py-3 text-right">Mensalidade</th>
                  <th className="font-semibold px-4 py-3">Contrato</th>
                  <th className="font-semibold px-4 py-3"><button className="inline-flex items-center gap-1 hover:text-fg" onClick={() => toggleSort('created_at')}>Cadastro <ArrowUpDown size={12} /></button></th>
                </tr>
              </thead>
              <tbody>
                {listRows.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-16 text-center text-fg-3">Nenhum associado encontrado com esses filtros. Limpe a busca ou escolha outro status.</td></tr>
                )}
                {listRows.map((r) => {
                  const plano = r.plano_id ? planoById[r.plano_id] : null;
                  const ct = contratos[r.id];
                  return (
                    <tr key={r.id} className="border-b border-line last:border-0 hover:bg-raised/60 transition-colors">
                      <td className="px-4 py-3.5"><StatusChip status={r.status_associado} /></td>
                      <td className="px-4 py-3.5 tabular-nums text-fg-2 whitespace-nowrap">{matriculaLabel(r.matricula)}</td>
                      <td className="px-4 py-3.5 max-w-[280px]">
                        <button className="text-left font-semibold text-primary hover:text-primary-hover hover:underline truncate max-w-full block" onClick={() => openAssociado(r.id)}>
                          {nomeAssociado(r)}
                        </button>
                        {r.contato_nome && <span className="block text-xs text-fg-3 truncate">{r.contato_nome}</span>}
                      </td>
                      <td className="px-4 py-3.5 tabular-nums text-fg-2 whitespace-nowrap">{formatCnpj(r.cnpj)}</td>
                      <td className="px-4 py-3.5 text-fg-2 whitespace-nowrap">{r.municipio ? `${r.municipio}${r.uf ? `/${r.uf}` : ''}` : '—'}</td>
                      <td className="px-4 py-3.5 text-fg-2 whitespace-nowrap">{plano?.nome || '—'}</td>
                      <td className="px-4 py-3.5 tabular-nums text-right whitespace-nowrap">{brl(mensalidade(r) ?? null)}</td>
                      <td className={`px-4 py-3.5 text-xs font-semibold whitespace-nowrap ${ct ? contratoMeta(ct).cls : 'text-fg-3'}`}>{ct ? contratoMeta(ct).label : 'Sem contrato'}</td>
                      <td className="px-4 py-3.5 tabular-nums text-fg-3 whitespace-nowrap">{dataBR(r.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {openId && (
        <AssociadoModal
          id={openId}
          planos={planos}
          onClose={closeAssociado}
          onChanged={load}
        />
      )}
    </div>
  );
};

export default CrmPage;
