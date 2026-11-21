import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { brl, dataBR } from '../crm/data';
import { PROPOSTA_STATUS, kwp, type Proposta, type PropostaStatus } from './data';
import { useTenant } from './useTenant';
import { withT } from './ClienteModal';
import TenantHeader from './TenantHeader';

const PropostasPage: React.FC = () => {
  const tenant = useTenant();
  const { companyId } = tenant;
  const [rows, setRows] = useState<(Proposta & { cliente: { nome: string } | null })[] | null>(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<PropostaStatus | ''>('');

  useEffect(() => {
    if (!companyId) return;
    supabase.from('tenant_propostas').select('*, cliente:tenant_clientes(nome)').eq('company_id', companyId).order('updated_at', { ascending: false })
      .then(({ data }) => setRows((data || []) as any));
  }, [companyId]);

  const list = useMemo(() => (rows || []).filter((r) => (!status || r.status === status)
    && (!q.trim() || [r.titulo, r.cliente?.nome].some((v) => v?.toLowerCase().includes(q.trim().toLowerCase())))), [rows, q, status]);

  const totais = useMemo(() => {
    const aceitas = (rows || []).filter((r) => r.status === 'aceita');
    return { aceitas: aceitas.length, valor: aceitas.reduce((s, r) => s + Number(r.preco_venda || 0), 0), kwp: aceitas.reduce((s, r) => s + Number(r.potencia_kwp || 0), 0) };
  }, [rows]);

  if (!companyId) return null;
  return (
    <div>
      <TenantHeader tenant={tenant} title="Propostas" description="Todas as propostas salvas no estúdio, com potência, preço e retorno."
        actions={<Link className="btn btn-primary" to={withT('/meu-crm/proposta/nova', tenant)}><Plus size={16} /> Nova proposta</Link>} />

      <div className="panel overflow-hidden mb-5">
        <dl className="grid grid-cols-3 gap-px bg-line">
          {[['Propostas aceitas', String(totais.aceitas)], ['Valor aceito', brl(totais.valor)], ['Potência aceita', kwp(totais.kwp)]].map(([k, v]) => (
            <div key={k} className="bg-panel px-4 md:px-5 py-4"><dt className="text-xs text-fg-3">{k}</dt><dd className="mt-1 text-xl font-bold tabular-nums">{rows ? v : <span className="skeleton inline-block h-6 w-20" />}</dd></div>
          ))}
        </dl>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-3" />
          <input className="field !pl-9" placeholder="Buscar proposta ou cliente…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="field sm:!w-48" value={status} onChange={(e) => setStatus(e.target.value as PropostaStatus | '')} aria-label="Filtrar por status">
          <option value="">Todos os status</option>
          {Object.entries(PROPOSTA_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-fg-3 border-b border-line">
                <th className="font-semibold px-4 py-3">Proposta</th>
                <th className="font-semibold px-4 py-3">Cliente</th>
                <th className="font-semibold px-4 py-3">Status</th>
                <th className="font-semibold px-4 py-3 text-right">Potência</th>
                <th className="font-semibold px-4 py-3 text-right">Preço</th>
                <th className="font-semibold px-4 py-3 text-right">Economia/mês</th>
                <th className="font-semibold px-4 py-3 text-right">Retorno</th>
                <th className="font-semibold px-4 py-3">Atualizada</th>
              </tr>
            </thead>
            <tbody>
              {!rows && Array.from({ length: 4 }).map((_, i) => <tr key={i}><td colSpan={8} className="px-4 py-3"><div className="skeleton h-6" /></td></tr>)}
              {rows && list.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-16 text-center text-fg-3">{rows.length ? 'Nenhuma proposta com esses filtros.' : 'Nenhuma proposta ainda. Abra o estúdio para dimensionar a primeira.'}</td></tr>
              )}
              {list.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0 hover:bg-raised/60 transition-colors">
                  <td className="px-4 py-3.5 max-w-[280px]"><Link className="font-semibold text-primary hover:text-primary-hover hover:underline truncate block" to={withT(`/meu-crm/proposta/${r.id}`, tenant)}>{r.titulo}</Link></td>
                  <td className="px-4 py-3.5 text-fg-2 whitespace-nowrap">{r.cliente?.nome || '—'}</td>
                  <td className={`px-4 py-3.5 text-xs font-semibold whitespace-nowrap ${PROPOSTA_STATUS[r.status].cls}`}>{PROPOSTA_STATUS[r.status].label}</td>
                  <td className="px-4 py-3.5 text-right tabular-nums whitespace-nowrap">{kwp(r.potencia_kwp)}</td>
                  <td className="px-4 py-3.5 text-right tabular-nums whitespace-nowrap font-semibold">{brl(r.preco_venda == null ? null : Number(r.preco_venda))}</td>
                  <td className="px-4 py-3.5 text-right tabular-nums whitespace-nowrap text-fg-2">{brl(r.economia_mensal == null ? null : Number(r.economia_mensal))}</td>
                  <td className="px-4 py-3.5 text-right tabular-nums whitespace-nowrap text-fg-2">{r.payback_anos ? `${Number(r.payback_anos).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} anos` : '—'}</td>
                  <td className="px-4 py-3.5 tabular-nums whitespace-nowrap text-fg-3">{dataBR(r.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PropostasPage;
