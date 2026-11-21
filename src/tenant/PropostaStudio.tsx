import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Sun, Calculator, LineChart } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { brl } from '../crm/data';
import { useToast } from '../crm/ui';
import { SolarProjectProvider, useSolarProject } from './solar/SolarProjectContext';
import { UF_DATA as UF_RAW } from './solar/solarData';

const UF_DATA = UF_RAW as Record<string, { concessionaria: string; irradiacaoMedia: number; tarifa: number; mensal: number[] }>;
import DimensionamentoSolar from './solar/pages/DimensionamentoSolar';
import CustosPrecificacao from './solar/pages/CustosPrecificacao';
import ViabilidadeFinanceira from './solar/pages/ViabilidadeFinanceira';
import { kwp, type Cliente, type Proposta } from './data';
import { nomeMarca, useTenant, type Tenant } from './useTenant';
import { withT } from './ClienteModal';
import TenantHeader from './TenantHeader';

type Step = 'dimensionamento' | 'custos' | 'viabilidade';
const STEPS: { id: Step; label: string; icon: React.ElementType }[] = [
  { id: 'dimensionamento', label: 'Dimensionamento', icon: Sun },
  { id: 'custos', label: 'Custos e preço', icon: Calculator },
  { id: 'viabilidade', label: 'Viabilidade de usina', icon: LineChart },
];

/** Estúdio de proposta: motor solar do CRM Solar + persistência no CRM do associado. */
const PropostaStudio: React.FC = () => {
  const tenant = useTenant();
  if (!tenant.companyId) return null;
  return (
    <SolarProjectProvider marcaNome={nomeMarca(tenant)}>
      <Studio tenant={tenant} />
    </SolarProjectProvider>
  );
};

const Studio: React.FC<{ tenant: Tenant }> = ({ tenant }) => {
  const toast = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const [params] = useSearchParams();
  const solar = useSolarProject() as any;
  const nova = !id || id === 'nova';
  const companyId = tenant.companyId!;

  const [step, setStep] = useState<Step>('dimensionamento');
  const [titulo, setTitulo] = useState('');
  const [clienteId, setClienteId] = useState<string>(params.get('cliente') || '');
  const [clientes, setClientes] = useState<Pick<Cliente, 'id' | 'nome' | 'etapa'>[]>([]);
  const [proposta, setProposta] = useState<Proposta | null>(null);
  const [ready, setReady] = useState(nova && !params.get('cliente'));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('tenant_clientes').select('id, nome, etapa').eq('company_id', companyId).order('nome').then(({ data }) => setClientes((data || []) as any));
  }, [companyId]);

  // Carrega a proposta salva, ou pré-preenche com os dados do cliente.
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!nova) {
        const { data } = await supabase.from('tenant_propostas').select('*').eq('id', id).maybeSingle();
        if (!alive) return;
        if (!data) { toast('error', 'Proposta não encontrada.'); navigate(withT('/meu-crm/propostas', tenant), { replace: true }); return; }
        setProposta(data as Proposta);
        setTitulo(data.titulo);
        setClienteId(data.cliente_id || '');
        solar.hydrate(data.dados || {});
        setReady(true);
        return;
      }
      const cid = params.get('cliente');
      if (cid) {
        const { data: c } = await supabase.from('tenant_clientes').select('*').eq('id', cid).maybeSingle();
        if (!alive) return;
        if (c) {
          const uf = c.uf && UF_DATA[c.uf] ? c.uf : undefined;
          solar.hydrate({
            ...(c.consumo_kwh ? { consumoMensal: Number(c.consumo_kwh) } : {}),
            ...(c.tipo_ligacao ? { tipoLigacao: c.tipo_ligacao } : {}),
            ...(c.cep ? { cep: c.cep.replace(/(\d{5})(\d{3})/, '$1-$2') } : {}),
            ...(c.cidade ? { cidade: c.cidade } : {}),
            ...(uf ? { uf, concessionaria: c.concessionaria || UF_DATA[uf].concessionaria, hspCustom: UF_DATA[uf].irradiacaoMedia, tarifaKwh: UF_DATA[uf].tarifa, mensalHsp: UF_DATA[uf].mensal } : {}),
          });
          setTitulo(`Proposta ${c.nome}`);
        }
        setReady(true);
      }
    })();
    return () => { alive = false; };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const resumo = useMemo(() => ({
    potencia_kwp: Number(solar.dadosDimensionamento?.potenciaRealKwp || 0),
    qtd_modulos: Number(solar.dadosDimensionamento?.qtdModulosReal || 0),
    geracao_mensal_kwh: Number(solar.dadosDimensionamento?.geracaoMensalMediaKwh || 0),
    custo_total: Number(solar.custosTotais?.custoDiretoTotal || 0),
    preco_venda: Number(solar.formacaoPreco?.precoVenda || 0),
    economia_mensal: Number(solar.calculoFioB?.economiaLiquidaMensal || 0),
    payback_anos: Number(solar.formacaoPreco?.paybackAnos || 0),
  }), [solar.dadosDimensionamento, solar.custosTotais, solar.formacaoPreco, solar.calculoFioB]);

  const salvar = async () => {
    const t = titulo.trim() || `Proposta ${kwp(resumo.potencia_kwp)}`;
    setSaving(true);
    const r2 = (v: number) => (Number.isFinite(v) ? Math.round(v * 100) / 100 : null);
    const row = {
      company_id: companyId, cliente_id: clienteId || null, titulo: t, dados: solar.snapshot(),
      potencia_kwp: r2(resumo.potencia_kwp), qtd_modulos: resumo.qtd_modulos || null, geracao_mensal_kwh: r2(resumo.geracao_mensal_kwh),
      custo_total: r2(resumo.custo_total), preco_venda: r2(resumo.preco_venda), economia_mensal: r2(resumo.economia_mensal),
      payback_anos: r2(resumo.payback_anos), updated_at: new Date().toISOString(),
    };
    const res = nova
      ? await supabase.from('tenant_propostas').insert(row).select('*').single()
      : await supabase.from('tenant_propostas').update(row).eq('id', id).select('*').single();
    if (res.error) { setSaving(false); toast('error', `Não foi possível salvar: ${res.error.message}`); return; }

    if (clienteId) {
      const c = clientes.find((x) => x.id === clienteId);
      const avancar = c && ['novo', 'contato', 'visita'].includes(c.etapa);
      await supabase.from('tenant_clientes').update({
        potencia_kwp: row.potencia_kwp, valor_estimado: row.preco_venda, updated_at: new Date().toISOString(),
        ...(avancar ? { etapa: 'proposta' } : {}),
      }).eq('id', clienteId);
      await supabase.from('tenant_eventos').insert({
        company_id: companyId, cliente_id: clienteId, tipo: 'proposta',
        descricao: `${nova ? 'Proposta criada' : 'Proposta atualizada'}: ${t} · ${kwp(resumo.potencia_kwp)} · ${brl(resumo.preco_venda)}.${avancar ? ' Cliente movido para Proposta.' : ''}`,
      });
    }
    setSaving(false);
    setProposta(res.data as Proposta);
    toast('ok', 'Proposta salva.');
    if (nova) navigate(withT(`/meu-crm/proposta/${res.data.id}`, tenant), { replace: true });
  };

  // Ao sair do dimensionamento para os custos, leva módulos e estrutura dimensionados para a lista de equipamentos.
  const irPara = (s: Step) => {
    if (step === 'dimensionamento' && s === 'custos') solar.sincronizarModulosComDimensionamento?.();
    setStep(s);
  };

  const voltar = clienteId ? withT(`/meu-crm?c=${clienteId}`, tenant) : withT('/meu-crm/propostas', tenant);

  return (
    <div className="solar">
      <TenantHeader compact tenant={tenant} title={nova ? 'Nova proposta' : proposta?.titulo || 'Proposta'} />

      {/* Barra do estúdio: fica presa no topo enquanto o usuário rola as etapas */}
      <div className="sticky top-0 z-30 -mx-4 md:-mx-8 px-4 md:px-8 pt-3 mb-6 bg-bg border-b border-line">
        <div className="flex flex-col xl:flex-row xl:items-center gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Link to={voltar} className="btn btn-ghost !px-2 shrink-0" aria-label="Voltar"><ArrowLeft size={18} /></Link>
            <input className="field !h-10 min-w-0 flex-1 font-semibold" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título da proposta" aria-label="Título da proposta" />
            <select className="field !h-10 !w-auto max-w-[220px]" value={clienteId} onChange={(e) => setClienteId(e.target.value)} aria-label="Cliente">
              <option value="">Sem cliente</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-4">
            <dl className="flex items-center gap-4 text-sm tabular-nums">
              <div><dt className="text-xs text-fg-3">Potência</dt><dd className="font-bold">{kwp(resumo.potencia_kwp)}</dd></div>
              <div><dt className="text-xs text-fg-3">Preço</dt><dd className="font-bold">{brl(resumo.preco_venda)}</dd></div>
              <div className="hidden sm:block"><dt className="text-xs text-fg-3">Retorno</dt><dd className="font-bold">{resumo.payback_anos ? `${resumo.payback_anos.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} anos` : '—'}</dd></div>
            </dl>
            <button className="btn btn-primary ml-auto" onClick={salvar} disabled={saving || !ready}><Save size={16} /> {saving ? 'Salvando…' : 'Salvar proposta'}</button>
          </div>
        </div>
        <div className="mt-2 flex gap-1 overflow-x-auto overflow-y-hidden" role="tablist" aria-label="Etapas da proposta">
          {STEPS.map((s) => (
            <button key={s.id} role="tab" aria-selected={step === s.id} onClick={() => irPara(s.id)}
              className={`relative h-9 px-3 inline-flex items-center gap-2 text-sm font-semibold whitespace-nowrap transition-colors ${step === s.id ? 'text-fg' : 'text-fg-3 hover:text-fg-2'}`}>
              <s.icon size={15} /> {s.label}
              {step === s.id && <span className="absolute left-2 right-2 -bottom-px h-[3px] rounded-full bg-energy" />}
            </button>
          ))}
        </div>
      </div>

      {!ready ? (
        <div className="space-y-4"><div className="skeleton h-28" /><div className="skeleton h-96" /></div>
      ) : (
        <>
          {/* As três etapas ficam montadas para não perder o que foi digitado ao trocar de aba. */}
          <div hidden={step !== 'dimensionamento'}><DimensionamentoSolar onNavigate={(p: Step) => { setStep(p); window.scrollTo({ top: 0 }); }} /></div>
          <div hidden={step !== 'custos'}><CustosPrecificacao onNavigate={(p: Step) => setStep(p)} /></div>
          <div hidden={step !== 'viabilidade'}><ViabilidadeFinanceira onNavigate={(p: Step) => setStep(p)} /></div>
        </>
      )}
    </div>
  );
};

export default PropostaStudio;
