import React, { useEffect, useState } from 'react';
import { ArrowUpRight, LayoutPanelLeft, Lock } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { brl, nomeAssociado, type Associado } from '../crm/data';
import { useToast } from '../crm/ui';
import { useSession } from '../components/AppLayout';
import TenantConfigPanel from './TenantConfigPanel';

/**
 * Aba "CRM do associado" no modal do associado (equipe FPGD).
 * Gestão (superadmin/admin) liga e desliga o CRM; só o superadmin vê a carteira e as credenciais.
 */
const TenantCrmTab: React.FC<{ a: Associado; reload: () => Promise<void> }> = ({ a, reload }) => {
  const toast = useToast();
  const { role, canManage } = useSession();
  const root = role === 'superadmin';
  const [busy, setBusy] = useState(false);
  const [stats, setStats] = useState<{ clientes: number; propostas: number; funil: number; fechados: number } | null>(null);

  useEffect(() => {
    if (!root || !a.crm_habilitado) return;
    (async () => {
      const [c, p] = await Promise.all([
        supabase.from('tenant_clientes').select('etapa, valor_estimado').eq('company_id', a.id),
        supabase.from('tenant_propostas').select('id', { count: 'exact', head: true }).eq('company_id', a.id),
      ]);
      const rows = (c.data || []) as { etapa: string; valor_estimado: number | null }[];
      setStats({
        clientes: rows.length,
        propostas: p.count || 0,
        funil: rows.filter((r) => !['ganho', 'perdido'].includes(r.etapa)).reduce((s, r) => s + Number(r.valor_estimado || 0), 0),
        fechados: rows.filter((r) => r.etapa === 'ganho').length,
      });
    })();
  }, [root, a.id, a.crm_habilitado]);

  const toggle = async (v: boolean) => {
    setBusy(true);
    const { error } = await supabase.from('companies').update({ crm_habilitado: v }).eq('id', a.id);
    if (!error) await supabase.from('crm_eventos').insert({ company_id: a.id, tipo: 'acesso', descricao: v ? 'CRM próprio habilitado.' : 'CRM próprio desabilitado.' });
    setBusy(false);
    if (error) { toast('error', error.message); return; }
    toast('ok', v ? `CRM liberado para ${nomeAssociado(a)}.` : `CRM de ${nomeAssociado(a)} desligado. Os dados ficam guardados.`);
    await reload();
  };

  return (
    <div className="p-6 space-y-6">
      <label className={`flex items-center justify-between gap-4 rounded-[10px] bg-field border border-line px-4 py-3 ${canManage ? 'cursor-pointer' : ''}`}>
        <span>
          <span className="flex items-center gap-2 text-sm font-semibold"><LayoutPanelLeft size={16} className="text-energy" /> CRM próprio liberado</span>
          <span className="block text-xs text-fg-3 mt-0.5 max-w-[52ch]">
            Clientes em Kanban, dimensionamento, propostas, contrato e cobrança com as credenciais da própria empresa.
            {!a.email && ' O associado precisa de login cadastrado para entrar.'}
          </span>
        </span>
        <input type="checkbox" role="switch" className="accent-[#2F8CFF] size-5 shrink-0" checked={a.crm_habilitado} disabled={!canManage || busy}
          onChange={(e) => toggle(e.target.checked)} aria-label="CRM próprio liberado" />
      </label>

      {!a.crm_habilitado ? (
        <div className="rounded-[16px] border border-dashed border-line px-6 py-8 text-center">
          <p className="text-sm font-semibold">CRM desligado para este associado</p>
          <p className="mt-1 text-sm text-fg-3 max-w-[46ch] mx-auto">
            Ao liberar, {nomeAssociado(a)} ganha a seção Meu CRM no menu.{root ? ' Dá para deixar o white label pronto antes.' : ''}
          </p>
        </div>
      ) : !root ? (
        <div className="rounded-[10px] border border-line bg-panel px-4 py-4 flex items-start gap-3">
          <Lock size={16} className="text-fg-3 mt-0.5 shrink-0" />
          <p className="text-sm text-fg-2">A carteira de clientes e as credenciais do associado ficam visíveis só para o superadmin e para o próprio associado.</p>
        </div>
      ) : (
        <div className="rounded-[16px] border border-line overflow-hidden">
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-line">
            {[
              ['Clientes', stats ? String(stats.clientes) : null],
              ['Propostas', stats ? String(stats.propostas) : null],
              ['Fechados', stats ? String(stats.fechados) : null],
              ['Em negociação', stats ? brl(stats.funil) : null],
            ].map(([k, v]) => (
              <div key={k} className="bg-panel px-4 py-3">
                <dt className="text-xs text-fg-3">{k}</dt>
                <dd className="mt-0.5 text-lg font-bold tabular-nums">{v ?? <span className="skeleton inline-block h-5 w-12 align-middle" />}</dd>
              </div>
            ))}
          </dl>
          <div className="bg-panel border-t border-line px-4 py-3 flex items-center justify-between gap-3">
            <p className="text-xs text-fg-3">Entrar no CRM como suporte, sem trocar de conta.</p>
            <a className="btn btn-secondary btn-sm" href={`#/meu-crm?t=${a.id}`}><ArrowUpRight size={14} /> Abrir CRM</a>
          </div>
        </div>
      )}

      {root && (
        <div>
          <h3 className="text-sm font-bold">White label</h3>
          <p className="text-xs text-fg-3 mt-0.5 mb-3">Credenciais próprias do associado. A FPGD não usa estas chaves para as cobranças da associação.</p>
          <TenantConfigPanel companyId={a.id} />
        </div>
      )}
    </div>
  );
};

export default TenantCrmTab;
