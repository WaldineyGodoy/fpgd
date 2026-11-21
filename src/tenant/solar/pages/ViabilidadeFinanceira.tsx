// @ts-nocheck
// Portado do CRM Solar (B2W Energia). Motor de cálculo mantido; estilo mapeado para os tokens da FPGD.
import React, { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import {
  Calculator,
  Zap,
  TrendingUp,
  Landmark,
  ShieldCheck,
  Search,
  MapPin,
  LayoutDashboard,
  FileSpreadsheet,
  Sun,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle2
} from 'lucide-react'
import { useSolarProject } from '../SolarProjectContext'
import { formatCurrency, formatNumber } from '../solarData'

// Dados típicos de irradiação solar, tarifa média real de BT (com impostos ICMS, PIS, COFINS) e concessionárias por UF
const UF_DATA = {
  AC: { nome: 'Acre', concessionaria: 'Energisa Acre', irradiacaoMedia: 4.30, tarifa: 1.05, mensal: [4.5, 4.4, 4.3, 4.2, 4.0, 3.8, 4.1, 4.5, 4.6, 4.5, 4.4, 4.3] },
  AL: { nome: 'Alagoas', concessionaria: 'Equatorial Alagoas', irradiacaoMedia: 5.40, tarifa: 0.96, mensal: [5.8, 5.7, 5.5, 5.1, 4.7, 4.4, 4.6, 5.1, 5.5, 5.8, 5.9, 5.9] },
  AM: { nome: 'Amazonas', concessionaria: 'Amazonas Energia', irradiacaoMedia: 4.10, tarifa: 1.02, mensal: [4.0, 3.9, 4.0, 4.1, 4.1, 4.2, 4.4, 4.5, 4.5, 4.3, 4.1, 4.0] },
  AP: { nome: 'Amapá', concessionaria: 'CEA (Equatorial)', irradiacaoMedia: 5.00, tarifa: 1.04, mensal: [4.2, 4.0, 4.1, 4.3, 4.5, 4.8, 5.2, 5.7, 6.0, 6.1, 5.8, 4.9] },
  BA: { nome: 'Bahia', concessionaria: 'Neoenergia Coelba', irradiacaoMedia: 5.30, tarifa: 0.94, mensal: [5.6, 5.5, 5.3, 4.9, 4.6, 4.3, 4.5, 4.9, 5.4, 5.7, 5.5, 5.5] },
  CE: { nome: 'Ceará', concessionaria: 'Enel Ceará', irradiacaoMedia: 5.60, tarifa: 0.98, mensal: [5.2, 4.9, 4.7, 4.7, 5.0, 5.3, 5.7, 6.1, 6.4, 6.4, 6.2, 5.7] },
  DF: { nome: 'Distrito Federal', concessionaria: 'Neoenergia Brasília', irradiacaoMedia: 5.20, tarifa: 0.92, mensal: [4.9, 5.0, 4.8, 5.1, 5.2, 5.2, 5.4, 5.7, 5.6, 5.0, 4.6, 4.5] },
  ES: { nome: 'Espírito Santo', concessionaria: 'EDP Espírito Santo', irradiacaoMedia: 4.70, tarifa: 0.89, mensal: [5.4, 5.3, 4.8, 4.4, 4.0, 3.7, 3.9, 4.3, 4.4, 4.7, 4.7, 5.0] },
  GO: { nome: 'Goiás', concessionaria: 'Equatorial Goiás', irradiacaoMedia: 5.30, tarifa: 0.95, mensal: [4.9, 5.0, 4.9, 5.2, 5.3, 5.3, 5.5, 5.9, 5.8, 5.2, 4.7, 4.6] },
  MA: { nome: 'Maranhão', concessionaria: 'Equatorial Maranhão', irradiacaoMedia: 5.10, tarifa: 0.96, mensal: [4.5, 4.2, 4.3, 4.5, 4.8, 5.2, 5.6, 5.9, 6.1, 6.0, 5.6, 5.0] },
  MG: { nome: 'Minas Gerais', concessionaria: 'Cemig', irradiacaoMedia: 5.20, tarifa: 1.02, mensal: [5.2, 5.3, 5.0, 4.9, 4.7, 4.5, 4.7, 5.2, 5.4, 5.2, 4.8, 4.8] },
  MS: { nome: 'Mato Grosso do Sul', concessionaria: 'Energisa MS', irradiacaoMedia: 5.10, tarifa: 1.03, mensal: [5.4, 5.3, 5.1, 4.9, 4.4, 4.1, 4.4, 5.0, 5.1, 5.2, 5.4, 5.5] },
  MT: { nome: 'Mato Grosso', concessionaria: 'Energisa MT', irradiacaoMedia: 5.20, tarifa: 1.04, mensal: [4.7, 4.8, 4.8, 5.1, 5.2, 5.2, 5.5, 5.8, 5.6, 5.2, 4.9, 4.6] },
  PA: { nome: 'Pará', concessionaria: 'Equatorial Pará', irradiacaoMedia: 4.80, tarifa: 1.08, mensal: [4.2, 4.0, 4.0, 4.2, 4.6, 5.0, 5.4, 5.7, 5.7, 5.4, 5.0, 4.4] },
  PB: { nome: 'Paraíba', concessionaria: 'Energisa Paraíba', irradiacaoMedia: 5.50, tarifa: 0.93, mensal: [5.8, 5.7, 5.6, 5.2, 4.9, 4.7, 4.9, 5.5, 5.9, 6.1, 6.1, 6.0] },
  PE: { nome: 'Pernambuco', concessionaria: 'Neoenergia Pernambuco', irradiacaoMedia: 5.40, tarifa: 0.95, mensal: [5.7, 5.6, 5.4, 4.9, 4.6, 4.4, 4.7, 5.3, 5.8, 6.0, 6.0, 5.9] },
  PI: { nome: 'Piauí', concessionaria: 'Equatorial Piauí', irradiacaoMedia: 5.50, tarifa: 0.98, mensal: [5.1, 4.8, 4.9, 5.1, 5.4, 5.7, 6.1, 6.4, 6.5, 6.3, 5.8, 5.2] },
  PR: { nome: 'Paraná', concessionaria: 'Copel', irradiacaoMedia: 4.60, tarifa: 0.88, mensal: [5.4, 5.1, 4.7, 4.2, 3.6, 3.2, 3.4, 4.1, 4.2, 4.7, 5.2, 5.5] },
  RJ: { nome: 'Rio de Janeiro', concessionaria: 'Light / Enel RJ', irradiacaoMedia: 4.60, tarifa: 1.06, mensal: [5.2, 5.2, 4.7, 4.3, 3.9, 3.7, 3.8, 4.2, 4.3, 4.6, 4.9, 5.0] },
  RN: { nome: 'Rio Grande do Norte', concessionaria: 'Neoenergia Cosern', irradiacaoMedia: 5.70, tarifa: 0.92, mensal: [5.9, 5.7, 5.5, 5.1, 4.9, 4.8, 5.1, 5.7, 6.3, 6.5, 6.5, 6.3] },
  RO: { nome: 'Rondônia', concessionaria: 'Energisa Rondônia', irradiacaoMedia: 4.50, tarifa: 0.99, mensal: [4.2, 4.2, 4.3, 4.4, 4.3, 4.3, 4.6, 4.9, 4.8, 4.6, 4.4, 4.2] },
  RR: { nome: 'Roraima', concessionaria: 'Roraima Energia', irradiacaoMedia: 4.60, tarifa: 0.94, mensal: [4.8, 4.9, 4.8, 4.4, 4.1, 4.0, 4.1, 4.4, 4.8, 4.9, 4.9, 4.8] },
  RS: { nome: 'Rio Grande do Sul', concessionaria: 'CEEE / RGE', irradiacaoMedia: 4.20, tarifa: 0.92, mensal: [5.3, 4.9, 4.2, 3.5, 2.8, 2.4, 2.6, 3.3, 3.7, 4.5, 5.1, 5.5] },
  SC: { nome: 'Santa Catarina', concessionaria: 'Celesc', irradiacaoMedia: 4.10, tarifa: 0.85, mensal: [4.9, 4.7, 4.2, 3.6, 3.1, 2.7, 2.9, 3.6, 3.7, 4.2, 4.7, 5.0] },
  SE: { nome: 'Sergipe', concessionaria: 'Energisa Sergipe', irradiacaoMedia: 5.20, tarifa: 0.94, mensal: [5.6, 5.5, 5.3, 4.5, 4.5, 4.2, 4.3, 4.8, 5.3, 5.6, 5.7, 5.7] },
  SP: { nome: 'São Paulo', concessionaria: 'Enel SP / CPFL', irradiacaoMedia: 4.70, tarifa: 0.94, mensal: [5.2, 5.1, 4.7, 4.4, 3.9, 3.6, 3.8, 4.4, 4.5, 4.7, 5.0, 5.1] },
  TO: { nome: 'Tocantins', concessionaria: 'Energisa Tocantins', irradiacaoMedia: 5.00, tarifa: 1.01, mensal: [4.4, 4.4, 4.5, 4.8, 5.1, 5.3, 5.5, 5.7, 5.5, 5.0, 4.6, 4.3] }
}

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const INITIAL_USINA_ITEMS = [
  { id: 1, descritivo: 'Assinatura do Contrato - Medição de Obras', etapas: 'Etapa 1', etapa: 'Contrato', diaAporte: 'DIA 1', qtd: 0, valorUnitario: 0, incluso: 'Não' },
  { id: 2, descritivo: 'Padrão de entrada Provisório Monofásico', etapas: 'Etapa 1', etapa: 'Obra Civil', diaAporte: 'DIA 5', qtd: 1, valorUnitario: 1500, incluso: 'Opcional' },
  { id: 3, descritivo: 'Consulta de Acesso', etapas: 'Etapa 1', etapa: 'Pré-contrato', diaAporte: 'DIA 1', qtd: 1, valorUnitario: 0, incluso: 'Não' },
  { id: 4, descritivo: 'Terreno', etapas: 'Etapa 1', etapa: 'Obra Civil', diaAporte: 'DIA 1', qtd: 1, valorUnitario: 0, incluso: 'Não' },
  { id: 5, descritivo: 'Terraplanagem', etapas: 'Etapa 1', etapa: 'Obra Civil', diaAporte: 'DIA 1', qtd: 1, valorUnitario: 8000, incluso: 'Sim' },
  { id: 6, descritivo: 'Camera de Segurança Wi-Fi Solar - 2 Lentes zoom 10x', etapas: 'Etapa 2', etapa: 'Equipamentos', diaAporte: 'DIA 5', qtd: 1, valorUnitario: 1200, incluso: 'Sim' },
  { id: 7, descritivo: 'Padrão de entrada e Mureta Trifásico 200A', etapas: 'Etapa 2', etapa: 'Obra Civil', diaAporte: 'DIA 5', qtd: 1, valorUnitario: 4500, incluso: 'Sim' },
  { id: 8, descritivo: 'Analise Performance - Pv System', etapas: 'Etapa 2', etapa: 'Projeto', diaAporte: 'DIA 1', qtd: 1, valorUnitario: 2500, incluso: 'Sim' },
  { id: 9, descritivo: 'Cerca - Tela Soldada - (m) Linear', etapas: 'Etapa 3', etapa: 'Obra Civil', diaAporte: 'DIA 30', qtd: 140, valorUnitario: 120, incluso: 'Sim' },
  { id: 10, descritivo: 'Caixa de Britas (Area em m2)', etapas: 'Etapa 3', etapa: 'Obra Civil', diaAporte: 'DIA 30', qtd: 50, valorUnitario: 60, incluso: 'Não' },
  { id: 11, descritivo: 'Abrigo Inversor', etapas: 'Etapa 3', etapa: 'Obra Civil', diaAporte: 'DIA 30', qtd: 1, valorUnitario: 3500, incluso: 'Sim' },
  { id: 12, descritivo: 'Sub-Estação + Poste + Projeto + Instalação', etapas: 'Etapa 3', etapa: 'Equipamentos', diaAporte: 'AG. CONSULTA', qtd: 1, valorUnitario: 45000, incluso: 'Opcional' },
  { id: 13, descritivo: 'Estrutura de Solo em aço - Linha Industrial', etapas: 'Etapa 3', etapa: 'Obra Civil', diaAporte: 'DIA 45', qtd: 144, valorUnitario: 180, incluso: 'Sim' },
  { id: 14, descritivo: 'Material Eletrico', etapas: 'Etapa 4', etapa: 'Material Eletrico - Insumos', diaAporte: 'DIA 30', qtd: 1, valorUnitario: 15000, incluso: 'Sim' },
  { id: 15, descritivo: 'Cabo Flex - Aluminio - Multiplexado 50mm', etapas: 'Etapa 4', etapa: 'Material Eletrico - Insumos', diaAporte: 'DIA 30', qtd: 25, valorUnitario: 85, incluso: 'Sim' },
  { id: 16, descritivo: 'Modulos Bifacial HJT 700w', etapas: 'Etapa 4', etapa: 'Equipamentos', diaAporte: 'DIA 60', qtd: 144, valorUnitario: 550, incluso: 'Sim' },
  { id: 17, descritivo: 'Cabos Solar', etapas: 'Etapa 4', etapa: 'Equipamentos', diaAporte: 'DIA 60', qtd: 720, valorUnitario: 8, incluso: 'Sim' },
  { id: 18, descritivo: 'Inversor 75 kw', etapas: 'Etapa 4', etapa: 'Equipamentos', diaAporte: 'DIA 60', qtd: 1, valorUnitario: 28000, incluso: 'Sim' },
  { id: 19, descritivo: 'StringBox Clamper 2E/2S - 1000V', etapas: 'Etapa 4', etapa: 'Equipamentos', diaAporte: 'DIA 60', qtd: 4, valorUnitario: 2200, incluso: 'Sim' },
  { id: 20, descritivo: 'Frete', etapas: 'Etapa 4', etapa: 'Transportes', diaAporte: 'DIA 30', qtd: 144, valorUnitario: 45, incluso: 'Sim' },
  { id: 21, descritivo: 'Instalação do Módulos', etapas: 'Etapa 5', etapa: 'Mão de obra', diaAporte: 'DIA 60', qtd: 144, valorUnitario: 150, incluso: 'Sim' },
  { id: 22, descritivo: 'Diarias', etapas: 'Etapa 5', etapa: 'Mão de obra', diaAporte: 'DIA 30', qtd: 14, valorUnitario: 250, incluso: 'Sim' },
  { id: 23, descritivo: 'Contrato Comercializadora', etapas: 'Etapa 5', etapa: 'Contrato', diaAporte: 'DIA 30', qtd: 1, valorUnitario: 5000, incluso: 'Sim' },
  { id: 24, descritivo: 'Constituição da SPE', etapas: 'Etapa 5', etapa: 'Contrato', diaAporte: 'DIA 15', qtd: 1, valorUnitario: 3000, incluso: 'Sim' },
  { id: 25, descritivo: 'Seguro Roubo - Incêndio - Danos (1 ano)', etapas: 'Etapa 5', etapa: 'Contrato', diaAporte: 'DIA 30', qtd: 1, valorUnitario: 4000, incluso: 'Sim' },
  { id: 26, descritivo: 'Monitoramento 24h - Segurança - (1 ano)', etapas: 'Etapa 5', etapa: 'O & M', diaAporte: 'DIA 30', qtd: 12, valorUnitario: 150, incluso: 'Sim' },
  { id: 27, descritivo: 'Monitoramento e 3 revisões - (1 ano)', etapas: 'Etapa 5', etapa: 'O & M', diaAporte: 'DIA 30', qtd: 12, valorUnitario: 300, incluso: 'Sim' },
  { id: 28, descritivo: 'Entrega do Obra - Medição de Obras', etapas: 'Etapa 5', etapa: 'Contrato', diaAporte: 'DIA 90', qtd: 1, valorUnitario: 0, incluso: 'Opcional' }
]

export default function ViabilidadeFinanceira({ onNavigate }) {
  const solarProject = useSolarProject()
  const [activeTab, setActiveTab] = useState('dashboard') // 'dashboard' | 'itens'
  const [usinaItems, setUsinaItems] = useState(INITIAL_USINA_ITEMS)

  // Localização
  const [cep, setCep] = useState(solarProject?.cep || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [localInfo, setLocalInfo] = useState({
    cidade: solarProject?.cidade || 'São Paulo',
    uf: solarProject?.uf || 'SP',
    concessionaria: solarProject?.concessionaria || 'Enel SP / CPFL'
  })

  const [irradiacao, setIrradiacao] = useState(solarProject?.hspCustom || UF_DATA.SP.irradiacaoMedia)
  const [tarifa, setTarifa] = useState(solarProject?.tarifaKwh || UF_DATA.SP.tarifa)
  const [mensalIrradValues, setMensalIrradValues] = useState(solarProject?.mensalHsp || UF_DATA.SP.mensal)

  // Potência calculada
  const moduloItem = usinaItems.find(item => item.id === 16)
  const quantidadeModulos = moduloItem ? moduloItem.qtd : 144
  const potenciaCalculada = (quantidadeModulos * 700) / 1000 // kWp

  // Sincronizar com o contexto global do Dimensionamento
  const handleSincronizarDimensionamento = () => {
    if (solarProject?.dadosDimensionamento) {
      const dim = solarProject.dadosDimensionamento
      // Atualiza quantidade de módulos no item 16
      setUsinaItems(prev =>
        prev.map(item => {
          if (item.id === 16) {
            return {
              ...item,
              qtd: dim.qtdModulosReal,
              valorUnitario: dim.moduloObj?.precoUnitario || 550,
              descritivo: `Módulos ${dim.moduloObj?.nome || 'TOPCon'}`
            }
          }
          if (item.id === 18 && dim.inversorSugerido) {
            return {
              ...item,
              descritivo: `Inversor ${dim.inversorSugerido.nome}`,
              valorUnitario: dim.inversorSugerido.precoEstimado
            }
          }
          return item
        })
      )
      setLocalInfo({
        cidade: solarProject.cidade,
        uf: solarProject.uf,
        concessionaria: solarProject.concessionaria
      })
      setIrradiacao(solarProject.hspCustom)
      setTarifa(solarProject.tarifaKwh)
      setMensalIrradValues(solarProject.mensalHsp)
      setCep(solarProject.cep)
    }
  }

  // Busca CEP
  const handleBuscaCEP = async () => {
    if (!cep || cep.replace(/\D/g, '').length !== 8) {
      setError('Insira um CEP válido com 8 dígitos.')
      return
    }
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()

      if (data.erro) {
        setError('CEP não encontrado.')
        setLoading(false)
        return
      }

      const uf = data.uf.toUpperCase()
      const cidade = data.localidade
      
      if (UF_DATA[uf]) {
        const info = UF_DATA[uf]
        setLocalInfo({
          cidade,
          uf,
          concessionaria: info.concessionaria
        })
        setIrradiacao(info.irradiacaoMedia)
        setTarifa(info.tarifa)
        setMensalIrradValues(info.mensal)
      } else {
        setLocalInfo({
          cidade,
          uf,
          concessionaria: 'Concessionária Local'
        })
      }
    } catch {
      setError('Erro ao consultar CEP.')
    } finally {
      setLoading(false)
    }
  }

  // Cálculos de Investimento e Payback
  const investimentoTotal = usinaItems.reduce((acc, item) => {
    if (item.incluso === 'Sim') {
      return acc + (item.qtd * item.valorUnitario)
    }
    return acc
  }, 0)

  const geracaoMensalEst = potenciaCalculada * irradiacao * 30 * 0.80
  const economiaMensalEst = geracaoMensalEst * tarifa
  const economiaAnualEst = economiaMensalEst * 12
  const paybackAnos = investimentoTotal > 0 && economiaAnualEst > 0 ? investimentoTotal / economiaAnualEst : 0

  // 25 Anos de Projeção
  const projectionsData = Array.from({ length: 25 }, (_, i) => {
    const ano = i + 1
    const idx = i
    const fatorGeracao = 1 - (idx * 0.005)
    const tarifaProjetada = tarifa * Math.pow(1.06, idx)
    const economiaAno = geracaoMensalEst * 12 * fatorGeracao * tarifaProjetada
    
    const custoManutencaoAcum = investimentoTotal * 0.01 * idx
    const retornoAcumulado = (economiaMensalEst * 12 * idx) - custoManutencaoAcum
    const roiAcumulado = ((retornoAcumulado - investimentoTotal) / (investimentoTotal || 1)) * 100

    return {
      ano: `Ano ${ano}`,
      'Economia Anual (R$)': Math.round(economiaAno),
      'Retorno Acumulado (R$)': Math.round(retornoAcumulado - investimentoTotal),
      'ROI Acumulado (%)': Math.round(roiAcumulado)
    }
  })

  const dadosGeracaoMensal = mensalIrradValues.map((irradMes, index) => {
    const geracaoMes = potenciaCalculada * irradMes * 30 * 0.80
    return {
      mes: MESES[index],
      'Geração Estimada (kWh)': Math.round(geracaoMes),
      'Irradiação (kWh/m²/dia)': irradMes
    }
  })

  return (
    <div className="space-y-8 animate-fadeIn pb-16 font-body">
      
      {/* ------------------------------------------------------------------ */}
      {/* HEADER DA PÁGINA COM DESIGN B2W ENERGIA */}
      {/* ------------------------------------------------------------------ */}
      <div className="card-solar p-6 md:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="space-y-2 z-10">
          <div className="flex items-center gap-3">
            <span className="badge-flame">
              <TrendingUp size={13} />
              Módulo de Viabilidade Financeira
            </span>
            <span className="text-xs font-mono text-ink-300">
              Payback • TIR • Projeção de 25 Anos
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-display font-black text-ink-50 tracking-tight flex items-center gap-3">
            Viabilidade Financeira & Payback
          </h1>

          <p className="text-sm text-ink-300 max-w-2xl">
            Simulador analítico para usinas e projetos fotovoltaicos. Calcule o fluxo de caixa acumulado, economia anual e tempo de retorno do capital investido.
          </p>
        </div>

        {/* Botões de Navegação Conectados ao Fluxo */}
        <div className="flex flex-wrap items-center gap-2.5 z-10 w-full lg:w-auto">
          {onNavigate && (
            <>
              <button
                type="button"
                onClick={() => onNavigate('dimensionamento')}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-ink-200 bg-ink-800 hover:bg-ink-700 hover:text-fg border border-ink-700/80 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                title="Voltar ao Dimensionamento Técnico"
              >
                <ArrowLeft size={14} className="text-primary" />
                <span>Dimensionamento</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('custos')}
                className="btn-brand-primary px-3.5 py-2 text-xs flex items-center gap-1.5"
                title="Avançar para Custos & Precificação"
              >
                <span>Custos & Precificação</span>
                <ArrowRight size={14} />
              </button>
            </>
          )}

          {solarProject?.dadosDimensionamento && (
            <button
              type="button"
              onClick={handleSincronizarDimensionamento}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Puxar dados do Dimensionamento Solar"
            >
              <RefreshCw size={13} />
              <span>Sincronizar Projeto</span>
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* LOCALIZAÇÃO ATUAL & ABAS */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        {/* Abas */}
        <div className="flex items-center gap-1.5 p-1.5 bg-ink-900 border border-ink-800 rounded-2xl">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-primary text-fg'
                : 'text-ink-300 hover:text-fg'
            }`}
          >
            <LayoutDashboard size={16} />
            <span>Dashboard & Indicadores</span>
          </button>

          <button
            onClick={() => setActiveTab('itens')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'itens'
                ? 'bg-primary text-fg'
                : 'text-ink-300 hover:text-fg'
            }`}
          >
            <FileSpreadsheet size={16} />
            <span>Itens da Usina ({usinaItems.length})</span>
          </button>
        </div>

        {/* Badge Localização */}
        <div className="card-solar px-4 py-2 flex items-center gap-2.5">
          <MapPin className="text-primary shrink-0" size={16} />
          <span className="text-xs text-ink-300 font-mono">
            {localInfo.cidade} - {localInfo.uf} • <strong className="text-ink-50">{localInfo.concessionaria}</strong>
          </span>
        </div>

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* CONTEÚDO DA ABA DASHBOARD */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8 animate-fadeIn">
          
          {/* Busca de CEP */}
          <div className="card-solar p-6">
            <h3 className="font-display font-bold text-base text-ink-50 mb-2 flex items-center gap-2">
              <Search className="text-primary" size={18} />
              Definir Localização pelo CEP
            </h3>
            <p className="text-xs text-ink-300 mb-4">
              Consulte o CEP do local de instalação para carregar a irradiação solar média diária (HSP) e tarifa da concessionária.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md">
              <input
                type="text"
                placeholder="Ex: 01310-100"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                className="flex-1 bg-ink-950 border border-ink-800 focus:border-primary rounded-xl px-4 py-2.5 text-sm text-fg placeholder-ink-500 focus:outline-none"
              />
              <button
                onClick={handleBuscaCEP}
                disabled={loading}
                className="btn-brand-primary px-6 py-2.5 text-xs font-bold"
              >
                {loading ? 'Buscando...' : 'Buscar CEP'}
              </button>
            </div>
            {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
          </div>

          {/* Grid de Inputs e Indicadores */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Parâmetros Técnicos da Usina */}
            <div className="card-solar p-6 space-y-4">
              <h3 className="font-display font-bold text-base text-ink-50 flex items-center gap-2">
                <Calculator className="text-primary" size={18} />
                Parâmetros da Usina
              </h3>

              <div className="space-y-3">
                <div className="bg-ink-950 p-3.5 rounded-xl border border-ink-800">
                  <div className="flex justify-between text-xs text-ink-300 mb-1">
                    <span>Potência Instalada (Calculada)</span>
                    <span className="font-mono font-bold text-primary">{potenciaCalculada.toFixed(1)} kWp</span>
                  </div>
                  <p className="text-xs text-ink-400 font-mono">
                    Vinculada: {quantidadeModulos} Módulos × 700W
                  </p>
                </div>

                <div className="bg-ink-950 p-3.5 rounded-xl border border-ink-800">
                  <div className="flex justify-between text-xs text-ink-300 mb-1">
                    <span>Irradiação Média Local (HSP)</span>
                    <span className="font-mono font-bold text-primary">{irradiacao.toFixed(2)} kWh/m²/dia</span>
                  </div>
                  <p className="text-xs text-ink-400 font-mono">
                    Concessionária: {localInfo.concessionaria}
                  </p>
                </div>

                <div className="bg-ink-950 p-3.5 rounded-xl border border-ink-800">
                  <div className="flex justify-between text-xs text-ink-300 mb-1">
                    <span>Tarifa Média de Energia</span>
                    <span className="font-mono font-bold text-emerald-400">R$ {tarifa.toFixed(3)} / kWh</span>
                  </div>
                  <p className="text-xs text-ink-400 font-mono">
                    Tarifa com tributos integrados
                  </p>
                </div>
              </div>
            </div>

            {/* 4 Cards de Indicadores de Retorno */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="card-solar p-5 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-ink-300">Investimento Total</span>
                  <Landmark className="text-primary" size={20} />
                </div>
                <div>
                  <span className="block text-2xl font-display font-black text-ink-50 mt-3">
                    {formatCurrency(investimentoTotal)}
                  </span>
                  <span className="text-xs text-ink-400 font-mono mt-1 block">
                    Total dos itens inclusos no projeto
                  </span>
                </div>
              </div>

              <div className="card-solar p-5 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-ink-300">Economia Anual Estimada</span>
                  <Zap className="text-emerald-400" size={20} />
                </div>
                <div>
                  <span className="block text-2xl font-display font-black text-emerald-400 mt-3">
                    {formatCurrency(Math.round(economiaAnualEst))}
                  </span>
                  <span className="text-xs text-ink-400 font-mono mt-1 block">
                    Geração média de {Math.round(geracaoMensalEst)} kWh/mês
                  </span>
                </div>
              </div>

              <div className="card-savings p-5 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-emerald-400">Tempo de Retorno (Payback)</span>
                  <TrendingUp className="text-emerald-400" size={20} />
                </div>
                <div>
                  <span className="block text-2xl font-display font-black text-emerald-400 mt-3">
                    {paybackAnos.toFixed(1)} Anos
                  </span>
                  <span className="text-xs text-emerald-300 font-mono mt-1 block">
                    Fluxo de caixa simples amortizado
                  </span>
                </div>
              </div>

              <div className="card-solar p-5 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-ink-300">Garantia de Performance</span>
                  <ShieldCheck className="text-primary" size={20} />
                </div>
                <div>
                  <span className="block text-2xl font-display font-black text-ink-50 mt-3">
                    25 Anos
                  </span>
                  <span className="text-xs text-ink-400 font-mono mt-1 block">
                    Mínimo 80% da geração inicial
                  </span>
                </div>
              </div>

            </div>

          </div>

          {/* Gráficos de Projeções */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Curva de Retorno Financeiro */}
            <div className="card-solar p-6 space-y-4">
              <h3 className="font-display font-bold text-base text-ink-50">
                Retorno Acumulado do Investimento (25 Anos)
              </h3>
              <div className="h-72 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
                  <LineChart data={projectionsData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#283044" />
                    <XAxis dataKey="ano" stroke="#AFB8C8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#AFB8C8" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#141925', borderColor: '#36405A', borderRadius: '10px', fontSize: '12px' }} />
                    <Line type="monotone" dataKey="Retorno Acumulado (R$)" stroke="#2F8CFF" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Geração Estimada Mensal */}
            <div className="card-solar p-6 space-y-4">
              <h3 className="font-display font-bold text-base text-ink-50">
                Geração Mensal Estimada (kWh)
              </h3>
              <div className="h-72 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
                  <BarChart data={dadosGeracaoMensal} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#283044" />
                    <XAxis dataKey="mes" stroke="#AFB8C8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#AFB8C8" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#141925', borderColor: '#36405A', borderRadius: '10px', fontSize: '12px' }} />
                    <Bar dataKey="Geração Estimada (kWh)" fill="#2BD99F" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* CONTEÚDO DA ABA ITENS DA USINA */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'itens' && (
        <div className="card-solar p-6 md:p-8 space-y-6 animate-fadeIn overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink-800 pb-4">
            <div>
              <h3 className="font-display font-bold text-base text-ink-50 flex items-center gap-2">
                <FileSpreadsheet className="text-primary" size={18} />
                Quantitativo e Valores dos Itens da Usina
              </h3>
              <p className="text-xs text-ink-300 mt-1">
                Estrutura de custos analítica por etapa de aporte financeiro e fornecimento.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const novoItem = {
                  id: Date.now(),
                  descritivo: 'Novo Item Personalizado',
                  etapas: 'Etapa Custom',
                  etapa: 'Diversos',
                  diaAporte: 'DIA 30',
                  qtd: 1,
                  valorUnitario: 1000,
                  incluso: 'Sim'
                }
                setUsinaItems([...usinaItems, novoItem])
              }}
              className="btn-brand-primary px-3.5 py-2 text-xs"
            >
              <Plus size={14} />
              <span>Adicionar Linha</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-ink-800 text-xs font-bold text-ink-300">
                  <th className="py-2.5 px-3">Descritivo</th>
                  <th className="py-2.5 px-3">Etapa</th>
                  <th className="py-2.5 px-2 text-center">Aporte</th>
                  <th className="py-2.5 px-2 text-center">Qtd</th>
                  <th className="py-2.5 px-3 text-right">Unitário (R$)</th>
                  <th className="py-2.5 px-3 text-right">Subtotal</th>
                  <th className="py-2.5 px-2 text-center">Incluso?</th>
                  <th className="py-2.5 px-2 text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800/60 font-body">
                {usinaItems.map((item) => {
                  const subtotal = item.qtd * item.valorUnitario
                  return (
                    <tr key={item.id} className="hover:bg-ink-800/30 transition-colors">
                      <td className="py-2 px-3 font-semibold text-ink-100">
                        <input
                          type="text"
                          value={item.descritivo}
                          onChange={(e) => {
                            const val = e.target.value
                            setUsinaItems(prev => prev.map(i => i.id === item.id ? { ...i, descritivo: val } : i))
                          }}
                          className="bg-transparent border-b border-transparent focus:border-primary text-ink-100 text-xs w-full focus:outline-none"
                        />
                      </td>
                      <td className="py-2 px-3 text-ink-300">{item.etapa}</td>
                      <td className="py-2 px-2 text-center text-ink-400 font-mono text-xs">{item.diaAporte}</td>
                      <td className="py-2 px-2 text-center">
                        <input
                          type="number"
                          min="0"
                          value={item.qtd}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0
                            setUsinaItems(prev => prev.map(i => i.id === item.id ? { ...i, qtd: val } : i))
                          }}
                          className="w-14 text-center bg-ink-950 border border-ink-800 rounded px-1 py-0.5 text-xs font-mono font-bold text-fg focus:outline-none focus:border-primary"
                        />
                      </td>
                      <td className="py-2 px-3 text-right">
                        <input
                          type="number"
                          min="0"
                          value={item.valorUnitario}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0
                            setUsinaItems(prev => prev.map(i => i.id === item.id ? { ...i, valorUnitario: val } : i))
                          }}
                          className="w-20 text-right bg-ink-950 border border-ink-800 rounded px-1.5 py-0.5 text-xs font-mono font-bold text-primary focus:outline-none focus:border-primary"
                        />
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-fg">
                        {formatCurrency(subtotal)}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <select
                          value={item.incluso}
                          onChange={(e) => {
                            const val = e.target.value
                            setUsinaItems(prev => prev.map(i => i.id === item.id ? { ...i, incluso: val } : i))
                          }}
                          className={`text-xs font-bold px-2 py-0.5 rounded-md border cursor-pointer ${
                            item.incluso === 'Sim'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : item.incluso === 'Opcional'
                              ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                              : 'bg-ink-800 text-ink-400 border-ink-700'
                          }`}
                        >
                          <option value="Sim">Sim</option>
                          <option value="Não">Não</option>
                          <option value="Opcional">Opcional</option>
                        </select>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => setUsinaItems(prev => prev.filter(i => i.id !== item.id))}
                          className="p-1 text-ink-400 hover:text-red-400 rounded transition-colors cursor-pointer"
                          title="Remover Linha"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-ink-700 bg-ink-950 font-display">
                  <td colSpan={5} className="py-3 px-3 font-bold text-ink-200 text-xs">
                    INVESTIMENTO TOTAL CONSIDERADO (ITENS COM "SIM"):
                  </td>
                  <td className="py-3 px-3 text-right font-black text-emerald-400 text-sm font-mono">
                    {formatCurrency(investimentoTotal)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

    </div>
  )
}
