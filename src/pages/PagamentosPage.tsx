import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Plus, Search, ExternalLink, Banknote, Trash2, X, Save } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { brl, callFn, dataBR, nomeAssociado, matriculaLabel } from '../crm/data';
import { Field, PageHeader, useToast } from '../crm/ui';
import { useSession } from '../components/AppLayout';

interface Cobranca {
  id: string;
  asaas_payment_id: string | null;
  company_id: string | null;
  descricao: string | null;
  valor: number;
  valor_liquido: number | null;
  forma: string | null;
  status: string;
  vencimento: string;
  pago_em: string | null;
  invoice_url: string | null;
  origem: 'asaas' | 'manual';
  companies?: { nome_fantasia: string | null; razao_social: string | null; matricula: number | null } | null;
}

type Grupo = 'recebido' | 'aberto' | 'atraso' | 'outro';
const PAGO = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'];
const grupo = (s: string): Grupo => (PAGO.includes(s) ? 'recebido' : s === 'OVERDUE' ? 'atraso' : s === 'PENDING' || s === 'AWAITING_RISK_ANALYSIS' ? 'aberto' : 'outro');
const GRUPO_META: Record<Grupo, { label: string; cls: string }> = {
  recebido: { label: 'Recebido', cls: 'text-st-ativo' },
  aberto: { label: 'A receber', cls: 'text-st-inscrito' },
  atraso: { label: 'Em atraso', cls: 'text-st-inadimplente' },
  outro: { label: 'Estornado/cancelado', cls: 'text-fg-3' },
};
const FORMA: Record<string, string> = {
  PIX: 'Pix', BOLETO: 'Boleto', CREDIT_CARD: 'Cartão', UNDEFINED: 'A escolher', DINHEIRO: 'Dinheiro', TRANSFERENCIA: 'Transferência',
};

const thisMonth = () => new Date().toISOString().slice(0, 7);
const today = () => new Date().toLocaleDateString('en-CA'); // data local, não UTC

const PagamentosPage: React.FC = () => {
  const toast = useToast();
  const { canManage } = useSession();
  const [rows, setRows] = useState<Cobranca[] | null>(null);
  const [saldo, setSaldo] = useState<{ v: number | null; erro?: string } | null>(null);
  const [mes, setMes] = useState(thisMonth());
  const [aba, setAba] = useState<Grupo | 'todas'>('todas');
  const [forma, setForma] = useState('');
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [novo, setNovo] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('cobrancas')
      .select('*, companies(nome_fantasia, razao_social, matricula)')
      .order('vencimento', { ascending: false }).limit(2000);
    if (error) { toast('error', `Não foi possível carregar os pagamentos: ${error.message}`); setRows([]); return; }
    setRows((data || []) as Cobranca[]);
  }, [toast]);

  const loadSaldo = useCallback(async () => {
    try { const r = await callFn<{ saldo: number }>('crm-asaas', { action: 'saldo' }); setSaldo({ v: r.saldo }); }
    catch (e) { setSaldo({ v: null, erro: (e as Error).message }); }
  }, []);

  useEffect(() => { load(); loadSaldo(); }, [load, loadSaldo]);

  const sync = async () => {
    setBusy('sync');
    try {
      const r = await callFn<{ total: number }>('crm-asaas', { action: 'sync_all' });
      toast('ok', `${r.total} cobrança(s) atualizadas a partir do Asaas.`);
      await Promise.all([load(), loadSaldo()]);
    } catch (e) { toast('error', (e as Error).message); }
    setBusy(null);
  };

  const receberDinheiro = async (c: Cobranca) => {
    if (!confirm(`Confirmar recebimento em dinheiro de ${brl(c.valor)}? A baixa é feita no Asaas.`)) return;
    setBusy(c.id);
    try { await callFn('crm-asaas', { action: 'receber_dinheiro', cobranca_id: c.id }); toast('ok', 'Recebimento confirmado.'); await load(); }
    catch (e) { toast('error', (e as Error).message); }
    setBusy(null);
  };

  const excluirManual = async (c: Cobranca) => {
    if (!confirm('Excluir este lançamento manual?')) return;
    const { error } = await supabase.from('cobrancas').delete().eq('id', c.id);
    if (error) toast('error', error.message); else { toast('ok', 'Lançamento excluído.'); load(); }
  };

  const nome = (c: Cobranca) => (c.companies ? nomeAssociado(c.companies) : 'Sem associado vinculado');

  const resumo = useMemo(() => {
    const r = { recebidoMes: 0, nRecebidoMes: 0, aberto: 0, nAberto: 0, atraso: 0, nAtraso: 0, manual: 0 };
    for (const c of rows || []) {
      const g = grupo(c.status);
      const pago = (c.pago_em || c.vencimento).slice(0, 7);
      if (g === 'recebido' && pago === mes) { r.recebidoMes += Number(c.valor); r.nRecebidoMes++; }
      if (g === 'aberto') { r.aberto += Number(c.valor); r.nAberto++; }
      if (g === 'atraso') { r.atraso += Number(c.valor); r.nAtraso++; }
      if (c.origem === 'manual' && g === 'recebido') r.manual += Number(c.valor);
    }
    return r;
  }, [rows, mes]);

  const lista = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (rows || []).filter((c) => {
      const g = grupo(c.status);
      if (aba !== 'todas' && g !== aba) return false;
      // recebidas filtram pela data do pagamento; o resto, pelo vencimento — atraso e a receber mostram tudo
      if (aba === 'todas' || aba === 'recebido') {
        const ref = (g === 'recebido' ? c.pago_em || c.vencimento : c.vencimento).slice(0, 7);
        if (ref !== mes && !(aba === 'todas' && g === 'atraso')) return false;
      }
      if (forma && c.forma !== forma) return false;
      if (term && !`${nome(c)} ${c.descricao || ''}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [rows, aba, mes, forma, q]); // eslint-disable-line react-hooks/exhaustive-deps

  const mesLabel = new Date(`${mes}-15T12:00:00`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div>
      <PageHeader title="Pagamentos"
        description="Mensalidades por boleto, Pix ou cartão no Asaas, mais os recebimentos lançados à mão. O Asaas atualiza esta lista sozinho pelo webhook."
        actions={<>
          <button className="btn btn-secondary" onClick={sync} disabled={busy === 'sync'}><RefreshCw size={16} className={busy === 'sync' ? 'animate-spin' : ''} /> {busy === 'sync' ? 'Sincronizando…' : 'Sincronizar com Asaas'}</button>
          {canManage && <button className="btn btn-primary" onClick={() => setNovo(true)}><Plus size={16} /> Lançar recebimento</button>}
        </>} />

      {/* Resumo financeiro */}
      <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-px bg-line border border-line rounded-[16px] overflow-hidden mb-5" aria-label="Resumo">
        <div className="p-5 bg-panel glow-corner">
          <p className="text-sm font-semibold text-fg-2">Saldo em caixa</p>
          {saldo === null ? <div className="skeleton h-8 w-36 mt-2" /> : saldo.v === null ? (
            <p className="mt-2 text-sm text-fg-3">{saldo.erro?.includes('configure') ? <>Configure o Asaas em <a className="text-primary hover:underline" href="#/crm/configuracoes">Configurações</a>.</> : saldo.erro}</p>
          ) : (
            <p className="mt-1.5 text-[28px] font-extrabold tabular-nums leading-tight">{brl(saldo.v)}</p>
          )}
          <p className="text-xs text-fg-3 mt-1">Conta Asaas{resumo.manual > 0 && <> · mais {brl(resumo.manual)} recebidos fora do Asaas</>}</p>
        </div>
        <div className="p-5 bg-panel">
          <p className="text-sm font-semibold text-fg-2">Recebido em {mesLabel}</p>
          <p className="mt-1.5 text-[28px] font-extrabold tabular-nums leading-tight text-st-ativo">{rows ? brl(resumo.recebidoMes) : '…'}</p>
          <p className="text-xs text-fg-3 mt-1 tabular-nums">{resumo.nRecebidoMes} pagamento(s)</p>
        </div>
        <div className="p-5 bg-panel">
          <p className="text-sm font-semibold text-fg-2">A receber</p>
          <p className="mt-1.5 text-[28px] font-extrabold tabular-nums leading-tight">{rows ? brl(resumo.aberto) : '…'}</p>
          <p className="text-xs text-fg-3 mt-1 tabular-nums">{resumo.nAberto} cobrança(s) dentro do prazo</p>
        </div>
        <div className="p-5 bg-panel">
          <p className="text-sm font-semibold text-fg-2">Em atraso</p>
          <p className={`mt-1.5 text-[28px] font-extrabold tabular-nums leading-tight ${resumo.atraso > 0 ? 'text-st-inadimplente' : ''}`}>{rows ? brl(resumo.atraso) : '…'}</p>
          <p className="text-xs text-fg-3 mt-1 tabular-nums">{resumo.nAtraso} cobrança(s) vencida(s)</p>
        </div>
      </section>

      {novo && <NovoLancamento onClose={() => setNovo(false)} onSaved={() => { setNovo(false); load(); }} />}

      <div className="panel">
        <div className="p-3 md:p-4 border-b border-line flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="flex items-center gap-1 overflow-x-auto overflow-y-hidden pb-px" role="tablist" aria-label="Situação">
            {([['todas', 'Todas'], ['recebido', 'Recebidas'], ['aberto', 'A receber'], ['atraso', 'Em atraso']] as const).map(([id, label]) => (
              <button key={id} role="tab" aria-selected={aba === id} onClick={() => setAba(id)}
                className={`relative h-9 px-3 text-sm font-semibold whitespace-nowrap ${aba === id ? 'text-fg' : 'text-fg-3 hover:text-fg-2'}`}>
                {label}
                {aba === id && <span className="absolute left-3 right-3 -bottom-px h-[3px] rounded-full bg-energy" />}
              </button>
            ))}
          </div>
          <div className="lg:ml-auto flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-3" />
              <input className="field !pl-9 sm:!w-56" placeholder="Buscar associado" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <select className="field sm:!w-40" value={forma} onChange={(e) => setForma(e.target.value)} aria-label="Forma de pagamento">
              <option value="">Todas as formas</option>
              {Object.entries(FORMA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            {(aba === 'todas' || aba === 'recebido') && (
              <input type="month" className="field sm:!w-44 tabular-nums" value={mes} onChange={(e) => setMes(e.target.value || thisMonth())} aria-label="Mês" />
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-fg-3 border-b border-line">
                <th className="font-semibold px-4 py-3">Vencimento</th>
                <th className="font-semibold px-4 py-3">Associado</th>
                <th className="font-semibold px-4 py-3">Forma</th>
                <th className="font-semibold px-4 py-3 text-right">Valor</th>
                <th className="font-semibold px-4 py-3">Situação</th>
                <th className="font-semibold px-4 py-3">Pago em</th>
                <th className="px-4 py-3"><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {rows === null && Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-line"><td colSpan={7} className="px-4 py-3"><div className="skeleton h-6" /></td></tr>
              ))}
              {rows && lista.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-14 text-center text-fg-3">
                  {rows.length === 0
                    ? <>Nenhuma cobrança ainda. Crie assinaturas na aba Cobrança de cada associado e clique em <b className="text-fg-2">Sincronizar com Asaas</b>.</>
                    : 'Nenhuma cobrança com esses filtros.'}
                </td></tr>
              )}
              {lista.map((c) => {
                const g = grupo(c.status);
                return (
                  <tr key={c.id} className="border-b border-line last:border-0 hover:bg-raised/60 transition-colors">
                    <td className="px-4 py-3.5 tabular-nums whitespace-nowrap text-fg-2">{dataBR(c.vencimento)}</td>
                    <td className="px-4 py-3.5 max-w-[300px]">
                      {c.company_id
                        ? <a href={`#/crm?a=${c.company_id}`} className="font-semibold text-primary hover:text-primary-hover hover:underline truncate block">{nome(c)}</a>
                        : <span className="text-fg-3">{nome(c)}</span>}
                      <span className="block text-xs text-fg-3 truncate">
                        {c.companies?.matricula ? `${matriculaLabel(c.companies.matricula)} · ` : ''}{c.descricao || (c.origem === 'manual' ? 'Lançamento manual' : 'Cobrança Asaas')}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-fg-2">{FORMA[c.forma || ''] || c.forma || '—'}</td>
                    <td className="px-4 py-3.5 tabular-nums text-right whitespace-nowrap font-semibold">{brl(Number(c.valor))}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap"><span className={`chip ${GRUPO_META[g].cls}`}>{GRUPO_META[g].label}</span></td>
                    <td className="px-4 py-3.5 tabular-nums whitespace-nowrap text-fg-3">{dataBR(c.pago_em)}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-right">
                      <div className="inline-flex gap-1">
                        {c.invoice_url && <a className="btn btn-ghost btn-sm" href={c.invoice_url} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Fatura</a>}
                        {canManage && c.origem === 'asaas' && (g === 'aberto' || g === 'atraso') && (
                          <button className="btn btn-ghost btn-sm" onClick={() => receberDinheiro(c)} disabled={busy === c.id}><Banknote size={14} /> Recebi em dinheiro</button>
                        )}
                        {canManage && c.origem === 'manual' && (
                          <button className="btn btn-ghost btn-sm" onClick={() => excluirManual(c)} aria-label="Excluir lançamento"><Trash2 size={14} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ---------- Lançamento manual ----------
const NovoLancamento: React.FC<{ onClose: () => void; onSaved: () => void }> = ({ onClose, onSaved }) => {
  const toast = useToast();
  const [assoc, setAssoc] = useState<{ id: string; nome_fantasia: string | null; razao_social: string | null; matricula: number | null }[]>([]);
  const [f, setF] = useState({ company_id: '', valor: '', pago_em: today(), forma: 'DINHEIRO', descricao: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('companies').select('id, nome_fantasia, razao_social, matricula').eq('user_type', 'integrador').order('nome_fantasia')
      .then(({ data }) => setAssoc(data || []));
  }, []);

  const save = async () => {
    const valor = Number(f.valor.replace(',', '.'));
    if (!f.company_id || !(valor > 0)) { toast('error', 'Escolha o associado e informe um valor maior que zero.'); return; }
    setSaving(true);
    const { error } = await supabase.from('cobrancas').insert({
      company_id: f.company_id, valor, forma: f.forma, status: 'RECEIVED', vencimento: f.pago_em, pago_em: f.pago_em,
      descricao: f.descricao || 'Recebimento lançado manualmente', origem: 'manual',
    });
    if (!error) await supabase.from('crm_eventos').insert({ company_id: f.company_id, tipo: 'pagamento', descricao: `Recebimento manual de ${brl(valor)} (${FORMA[f.forma]}).` });
    setSaving(false);
    if (error) { toast('error', error.message); return; }
    toast('ok', 'Recebimento lançado.');
    onSaved();
  };

  return (
    <section className="panel mb-5" aria-label="Lançar recebimento">
      <header className="flex items-center justify-between px-5 pt-4">
        <div>
          <h2 className="font-bold">Lançar recebimento fora do Asaas</h2>
          <p className="text-sm text-fg-2 mt-0.5">Para pagamentos em dinheiro ou transferência direta que não passaram pelo Asaas.</p>
        </div>
        <button className="btn btn-ghost !px-2" onClick={onClose} aria-label="Fechar"><X size={18} /></button>
      </header>
      <div className="p-5 grid sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        <Field label="Associado" className="lg:col-span-2">
          <select className="field" value={f.company_id} onChange={(e) => setF({ ...f, company_id: e.target.value })}>
            <option value="">Escolha</option>
            {assoc.map((a) => <option key={a.id} value={a.id}>{nomeAssociado(a)} · {matriculaLabel(a.matricula)}</option>)}
          </select>
        </Field>
        <Field label="Valor (R$)"><input className="field tabular-nums" inputMode="decimal" value={f.valor} onChange={(e) => setF({ ...f, valor: e.target.value })} placeholder="0,00" /></Field>
        <Field label="Recebido em"><input type="date" className="field" value={f.pago_em} onChange={(e) => setF({ ...f, pago_em: e.target.value })} /></Field>
        <Field label="Forma">
          <select className="field" value={f.forma} onChange={(e) => setF({ ...f, forma: e.target.value })}>
            <option value="DINHEIRO">Dinheiro</option><option value="PIX">Pix</option><option value="TRANSFERENCIA">Transferência</option><option value="BOLETO">Boleto</option>
          </select>
        </Field>
        <Field label="Descrição" className="sm:col-span-2 lg:col-span-4"><input className="field" value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} placeholder="Ex.: mensalidade de novembro" /></Field>
        <button className="btn btn-primary" onClick={save} disabled={saving}><Save size={16} /> {saving ? 'Salvando…' : 'Lançar'}</button>
      </div>
    </section>
  );
};

export default PagamentosPage;
