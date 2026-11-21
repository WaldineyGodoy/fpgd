// @ts-nocheck
// Portado do CRM Solar (B2W Energia). Motor de cálculo mantido; estilo mapeado para os tokens da FPGD.
import React, { useState } from 'react'
import {
  Sun,
  Zap,
  TrendingUp,
  MapPin,
  CheckCircle2,
  ChevronRight,
  Scale,
  Sparkles,
  ArrowRight,
  Info,
  Layers,
  FileSpreadsheet
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts'
import {
  UF_DATA,
  MESES_NOMES,
  TIPOS_ESTRUTURA,
  TIPOS_LIGACAO,
  MODULOS_PADRAO,
  REGRAS_TRANSICAO_FIO_B,
  PERFIS_SIMULTANEIDADE,
  formatCurrency,
  formatNumber
} from '../solarData'
import { useSolarProject } from '../SolarProjectContext'

export default function DimensionamentoSolar({ onNavigate }) {
  const {
    cep, setCep,
    cidade, setCidade,
    uf, setUf,
    concessionaria, setConcessionaria,
    hspCustom, setHspCustom,
    tarifaKwh, setTarifaKwh,
    setMensalHsp,
    consumoMensal, setConsumoMensal,
    tipoLigacao, setTipoLigacao,
    descontarDisponibilidade, setDescontarDisponibilidade,
    performanceRatio, setPerformanceRatio,
    tipoEstrutura, setTipoEstrutura,
    moduloSelecionadoId, setModuloSelecionadoId,
    setPotenciaModuloCustom,
    qtdModulosManual, setQtdModulosManual,
    dadosDimensionamento,
    simultaneidade, setSimultaneidade,
    tarifaFioBIntegral, setTarifaFioBIntegral,
    anoTransicaoFioB, setAnoTransicaoFioB,
    calculoFioB,
    sincronizarModulosComDimensionamento
  } = useSolarProject()

  const [loadingCep, setLoadingCep] = useState(false)
  const [cepError, setCepError] = useState('')

  // Busca de CEP
  const handleBuscarCep = async () => {
    const cepLimpo = cep.replace(/\D/g, '')
    if (cepLimpo.length !== 8) {
      setCepError('Digite um CEP válido com 8 dígitos')
      return
    }
    setLoadingCep(true)
    setCepError('')

    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
      const data = await res.json()
      if (data.erro) {
        setCepError('CEP não encontrado na base dos Correios.')
        return
      }

      const ufEncontrada = data.uf.toUpperCase()
      setCidade(data.localidade)
      setUf(ufEncontrada)

      if (UF_DATA[ufEncontrada]) {
        const infoUf = UF_DATA[ufEncontrada]
        setConcessionaria(infoUf.concessionaria)
        setHspCustom(infoUf.irradiacaoMedia)
        setTarifaKwh(infoUf.tarifa)
        setMensalHsp(infoUf.mensal)
        setTarifaFioBIntegral(Number((infoUf.tarifa * 0.28).toFixed(4)))
      }
    } catch {
      setCepError('Erro ao consultar CEP. Tente novamente.')
    } finally {
      setLoadingCep(false)
    }
  }

  return (
    <div className="space-y-8 pb-16 font-body text-fg">
      
      {/* HEADER DA MARCA B2W ENERGIA */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-raised pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-primary/10 border border-primary/30 rounded-xl text-primary">
              <Sun size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary font-display">
                  Engenharia
                </span>
                <span className="bg-ok/15 text-ok border border-ok/30 text-xs px-2 py-0.5 rounded-full font-bold">
                  Lei 14.300
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-fg font-display">
                Dimensionamento de Potência Solar
              </h1>
            </div>
          </div>
          <p className="text-sm text-fg-2 max-w-2xl">
            Calcule a capacidade necessária da usina com base no consumo do cliente e na irradiação solar da região. O Fio B incide somente sobre a energia injetada após a dedução da simultaneidade.
          </p>
        </div>

        {/* NAVEGAÇÃO ENTRE ÁREAS */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate?.('viabilidade')}
            className="px-4 py-2.5 rounded-xl font-semibold text-xs md:text-sm bg-panel hover:bg-raised border border-line-strong text-fg flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <FileSpreadsheet size={16} className="text-ok" />
            <span>Viabilidade Financeira</span>
          </button>

          <button
            onClick={() => {
              sincronizarModulosComDimensionamento()
              onNavigate?.('custos')
            }}
            className="px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm bg-primary hover:bg-primary-hover text-fg flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <span>Ir para Custos & Precificação</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* KPI HIGHLIGHT CARDS (B2W ENERGIA STYLE) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Potência Recomendada */}
        <div className="card-solar p-5 relative">
          <span className="text-xs font-bold text-fg-2 flex items-center gap-1.5 font-display">
            <Sun size={14} className="text-primary" /> Potência Calculada
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-extrabold text-fg font-display">
              {formatNumber(dadosDimensionamento.potenciaRealKwp, 2)}
            </span>
            <span className="text-sm font-bold text-primary">kWp</span>
          </div>
          <span className="text-xs text-fg-2 mt-1 block">
            {dadosDimensionamento.qtdModulosReal}x painéis de {dadosDimensionamento.potenciaWpUnit}W
          </span>
        </div>

        {/* Geração Média */}
        <div className="card-solar p-5 relative">
          <span className="text-xs font-bold text-fg-2 flex items-center gap-1.5 font-display">
            <Zap size={14} className="text-cyan" /> Geração Mensal
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-extrabold text-fg font-display">
              {Math.round(dadosDimensionamento.geracaoMensalMediaKwh)}
            </span>
            <span className="text-sm font-bold text-cyan">kWh/mês</span>
          </div>
          <span className="text-xs text-ok mt-1 block font-semibold">
            Supre {Math.round((dadosDimensionamento.geracaoMensalMediaKwh / (consumoMensal || 1)) * 100)}% da demanda
          </span>
        </div>

        {/* Simultaneidade & Injeção */}
        <div className="card-solar p-5 relative">
          <span className="text-xs font-bold text-fg-2 flex items-center gap-1.5 font-display">
            <Scale size={14} className="text-ok" /> Autoconsumo ({calculoFioB.pctSimult}%)
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-extrabold text-fg font-display">
              {Math.round(calculoFioB.energiaSimultaneaKwh)}
            </span>
            <span className="text-sm font-bold text-ok">kWh livre</span>
          </div>
          <span className="text-xs text-fg-2 mt-1 block">
            {Math.round(calculoFioB.energiaInjetadaKwh)} kWh injetados na rede
          </span>
        </div>

        {/* Economia Líquida Real */}
        <div className="card-savings p-5 relative bg-ok/5 border border-ok/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ok flex items-center gap-1.5 font-display">
              <TrendingUp size={14} /> Economia Líquida Real
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-ok/20 text-ok font-bold">
              Pós-Fio B
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-extrabold text-ok font-display truncate">
              {formatCurrency(calculoFioB.economiaLiquidaMensal)}
            </span>
            <span className="text-xs text-ok/80 font-bold">/mês</span>
          </div>
          <span className="text-xs text-fg-2 mt-1 block">
            ~{formatCurrency(calculoFioB.economiaLiquidaAnual)}/ano acumulado
          </span>
        </div>
      </div>

      {/* ÁREA PRINCIPAL: PARÂMETROS E RESULTADOS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUNA ESQUERDA: PARÂMETROS DE ENTRADA */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Card 1: Demanda do Cliente */}
          <div className="bg-panel border border-raised rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-raised pb-4">
              <h3 className="font-bold text-lg text-fg flex items-center gap-2 font-display">
                <Zap className="text-primary" size={20} />
                Consumo & Demanda de Energia
              </h3>
              <span className="text-xs bg-raised text-fg-2 px-3 py-1 rounded-full font-medium">
                Passo 1
              </span>
            </div>

            {/* Consumo Mensal com Slider e Stepper */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-fg-2">
                  Consumo Médio Mensal (kWh/mês)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="50"
                    max="20000"
                    step="10"
                    value={consumoMensal}
                    onChange={(e) => {
                      setConsumoMensal(Number(e.target.value) || 0)
                      setQtdModulosManual(null)
                    }}
                    className="w-28 text-right bg-bg border border-line-strong focus:border-primary rounded-xl px-3 py-1.5 text-lg font-bold text-primary font-mono focus:outline-none"
                  />
                  <span className="text-xs font-semibold text-fg-2">kWh</span>
                </div>
              </div>

              {/* Slider fluído B2W Energia */}
              <input
                type="range"
                min="100"
                max="3000"
                step="25"
                value={consumoMensal}
                onChange={(e) => {
                  setConsumoMensal(Number(e.target.value))
                  setQtdModulosManual(null)
                }}
                className="w-full accent-primary h-2 bg-raised rounded-lg cursor-pointer"
              />

              {/* Quick Pills de consumo */}
              <div className="flex flex-wrap gap-2 pt-1">
                {[250, 400, 650, 900, 1200, 1800, 2500].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      setConsumoMensal(val)
                      setQtdModulosManual(null)
                    }}
                    className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                      consumoMensal === val
                        ? 'bg-primary text-fg'
                        : 'bg-raised text-fg-2 hover:text-fg hover:bg-line-strong'
                    }`}
                  >
                    {val} kWh
                  </button>
                ))}
              </div>
            </div>

            {/* Tipo de Ligação & Custo de Disponibilidade */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-bold text-fg-2 block mb-2">
                  Tipo de Ligação na Rede
                </label>
                <select
                  value={tipoLigacao}
                  onChange={(e) => setTipoLigacao(e.target.value)}
                  className="w-full bg-bg border border-line-strong rounded-xl px-3.5 py-2.5 text-sm text-fg focus:outline-none focus:border-primary"
                >
                  {TIPOS_LIGACAO.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-fg-2 block mb-2">
                  Custo de Disponibilidade (Lei 14.300)
                </label>
                <div className="flex items-center gap-3 h-11 px-3 bg-bg border border-line-strong rounded-xl">
                  <input
                    type="checkbox"
                    id="chkDisponibilidade"
                    checked={descontarDisponibilidade}
                    onChange={(e) => setDescontarDisponibilidade(e.target.checked)}
                    className="w-4 h-4 accent-primary rounded cursor-pointer"
                  />
                  <label htmlFor="chkDisponibilidade" className="text-xs text-fg cursor-pointer">
                    Descontar {dadosDimensionamento.custoDisponibilidade} kWh (Taxa Mínima)
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Localização & Irradiância Solar */}
          <div className="bg-panel border border-raised rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-raised pb-4">
              <h3 className="font-bold text-lg text-fg flex items-center gap-2 font-display">
                <MapPin className="text-primary" size={20} />
                Localização & Irradiância Solar (HSP)
              </h3>
              <span className="text-xs text-primary font-bold bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                {uf} — {cidade}
              </span>
            </div>

            {/* Busca CEP */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-fg-2">
                CEP da Instalação
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: 01310-100"
                  value={cep}
                  onChange={(e) => setCep(e.target.value)}
                  className="flex-1 bg-bg border border-line-strong rounded-xl px-4 py-2.5 text-sm text-fg placeholder-fg-3 focus:outline-none focus:border-primary font-mono"
                />
                <button
                  type="button"
                  onClick={handleBuscarCep}
                  disabled={loadingCep}
                  className="px-5 py-2.5 bg-primary hover:bg-primary-hover disabled:bg-line-strong text-fg font-bold rounded-xl text-sm transition-all active:scale-95 cursor-pointer"
                >
                  {loadingCep ? 'Buscando...' : 'Buscar CEP'}
                </button>
              </div>
              {cepError && <span className="text-xs text-red-400 block">{cepError}</span>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {/* Concessionária */}
              <div>
                <label className="text-xs font-bold text-fg-2 block mb-1.5">
                  Concessionária
                </label>
                <input
                  type="text"
                  value={concessionaria}
                  onChange={(e) => setConcessionaria(e.target.value)}
                  className="w-full bg-bg border border-line-strong rounded-xl px-3 py-2 text-xs text-fg focus:outline-none focus:border-primary"
                />
              </div>

              {/* Irradiância Solar Média (HSP) */}
              <div>
                <label className="text-xs font-bold text-fg-2 block mb-1.5 flex items-center justify-between">
                  <span>Irradiância (HSP)</span>
                  <span className="text-xs text-primary font-semibold">kWh/m²/dia</span>
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="2.0"
                  max="7.0"
                  value={hspCustom}
                  onChange={(e) => setHspCustom(Number(e.target.value))}
                  className="w-full bg-bg border border-line-strong rounded-xl px-3 py-2 text-sm font-bold text-primary font-mono focus:outline-none focus:border-primary"
                />
              </div>

              {/* Tarifa com Impostos */}
              <div>
                <label className="text-xs font-bold text-fg-2 block mb-1.5 flex items-center justify-between">
                  <span>Tarifa de Energia</span>
                  <span className="text-xs text-fg-2">R$/kWh</span>
                </label>
                <input
                  type="number"
                  step="0.02"
                  min="0.30"
                  max="2.50"
                  value={tarifaKwh}
                  onChange={(e) => setTarifaKwh(Number(e.target.value))}
                  className="w-full bg-bg border border-line-strong rounded-xl px-3 py-2 text-sm font-bold text-ok font-mono focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Estrutura de Fixação & Performance Ratio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-raised">
              <div>
                <label className="text-xs font-bold text-fg-2 block mb-2">
                  Tipo de Fixação / Local
                </label>
                <select
                  value={tipoEstrutura}
                  onChange={(e) => setTipoEstrutura(e.target.value)}
                  className="w-full bg-bg border border-line-strong rounded-xl px-3.5 py-2.5 text-sm text-fg focus:outline-none focus:border-primary"
                >
                  {TIPOS_ESTRUTURA.map((est) => (
                    <option key={est.id} value={est.id}>
                      {est.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-fg-2">
                    Performance Ratio (PR)
                  </label>
                  <span className="text-xs font-bold text-primary font-mono">{performanceRatio}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="65"
                    max="88"
                    step="1"
                    value={performanceRatio}
                    onChange={(e) => setPerformanceRatio(Number(e.target.value))}
                    className="flex-1 accent-primary h-2 bg-raised rounded-lg cursor-pointer"
                  />
                  <span className="text-xs text-fg-2 whitespace-nowrap">
                    {100 - performanceRatio}% perdas globais
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Seleção e Configuração de Módulos */}
          <div className="bg-panel border border-raised rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-raised pb-4">
              <h3 className="font-bold text-lg text-fg flex items-center gap-2 font-display">
                <Sun className="text-primary" size={20} />
                Módulos Fotovoltaicos
              </h3>
              <span className="text-xs text-fg-2">
                Sugestão ideal: <strong className="text-fg font-mono">{dadosDimensionamento.qtdModulosSugerida} painéis</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-fg-2 block mb-2">
                  Tecnologia & Potência do Painel
                </label>
                <select
                  value={moduloSelecionadoId}
                  onChange={(e) => {
                    const mod = MODULOS_PADRAO.find(m => m.id === e.target.value)
                    setModuloSelecionadoId(e.target.value)
                    if (mod) setPotenciaModuloCustom(mod.potenciaW)
                    setQtdModulosManual(null)
                  }}
                  className="w-full bg-bg border border-line-strong rounded-xl px-3.5 py-2.5 text-sm text-fg focus:outline-none focus:border-primary"
                >
                  {MODULOS_PADRAO.map((mod) => (
                    <option key={mod.id} value={mod.id}>
                      {mod.nome} ({mod.marca})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-fg-2 block mb-2">
                  Quantidade Adotada de Módulos
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const novaQtd = Math.max(1, (dadosDimensionamento.qtdModulosReal - 1))
                      setQtdModulosManual(novaQtd)
                    }}
                    className="w-10 h-10 rounded-xl bg-raised hover:bg-line-strong text-fg font-bold flex items-center justify-center text-lg active:scale-90 cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={dadosDimensionamento.qtdModulosReal}
                    onChange={(e) => setQtdModulosManual(Math.max(1, Number(e.target.value) || 1))}
                    className="flex-1 text-center bg-bg border border-line-strong rounded-xl py-2 font-bold text-lg text-primary font-mono focus:outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const novaQtd = dadosDimensionamento.qtdModulosReal + 1
                      setQtdModulosManual(novaQtd)
                    }}
                    className="w-10 h-10 rounded-xl bg-raised hover:bg-line-strong text-fg font-bold flex items-center justify-center text-lg active:scale-90 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Simultaneidade & Custo do Fio B (Lei 14.300) */}
          <div className="bg-panel border border-raised rounded-3xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-raised pb-4">
              <div>
                <h3 className="font-bold text-lg text-fg flex items-center gap-2 font-display">
                  <Scale className="text-primary" size={20} />
                  Simultaneidade & Custo do Fio B (Lei 14.300)
                </h3>
                <p className="text-xs text-fg-2 mt-1">
                  O Fio B incide somente sobre a energia injetada na rede após deduzir o consumo instantâneo.
                </p>
              </div>
              <span className="text-xs bg-primary/10 text-primary border border-primary/30 px-3 py-1 rounded-full font-bold self-start sm:self-auto">
                Prevalência do Maior Valor
              </span>
            </div>

            {/* Slider de Simultaneidade */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <label className="text-xs font-bold text-fg flex items-center gap-1.5">
                    <Zap size={14} className="text-primary" />
                    Simultaneidade (Consumo Instantâneo)
                  </label>
                  <span className="text-xs text-fg-2 block">
                    Energia consumida no momento da geração (isenta de Fio B)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={simultaneidade}
                    onChange={(e) => setSimultaneidade(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                    className="w-20 text-right bg-bg border border-line-strong rounded-xl px-3 py-1.5 text-base font-bold text-primary font-mono focus:outline-none focus:border-primary"
                  />
                  <span className="text-sm font-bold text-fg-2">%</span>
                </div>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={simultaneidade}
                onChange={(e) => setSimultaneidade(Number(e.target.value))}
                className="w-full accent-primary h-2 bg-raised rounded-lg cursor-pointer"
              />

              {/* Perfis rápidos de simultaneidade */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {PERFIS_SIMULTANEIDADE.map((perfil) => (
                  <button
                    key={perfil.id}
                    type="button"
                    onClick={() => setSimultaneidade(perfil.valor)}
                    className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                      simultaneidade === perfil.valor
                        ? 'bg-primary/15 border-primary text-primary-hover'
                        : 'bg-bg border-raised text-fg-2 hover:text-fg'
                    }`}
                  >
                    <span className="text-xs font-bold block">{perfil.nome}</span>
                    <span className="text-xs font-extrabold text-primary font-mono">{perfil.valor}%</span>
                  </button>
                ))}
              </div>

              {/* Caixa didática de fluxo da energia */}
              <div className="bg-bg p-4 rounded-2xl border border-raised space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-fg-2 gap-2">
                  <span>Demanda / geração base:</span>
                  <strong className="text-fg text-sm font-mono">{Math.round(calculoFioB.energiaBase)} kWh/mês</strong>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-raised">
                  <div className="bg-ok/10 border border-ok/30 p-3.5 rounded-xl">
                    <span className="text-xs text-ok font-bold block font-display">
                      Consumo Instantâneo (Simultâneo)
                    </span>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-xl font-black text-fg font-mono">
                        {Math.round(calculoFioB.energiaSimultaneaKwh)}
                      </span>
                      <span className="text-xs text-ok font-semibold">kWh ({calculoFioB.pctSimult}%)</span>
                    </div>
                    <span className="text-xs text-ok/90 mt-1 block font-medium">
                      100% isento de Fio B
                    </span>
                  </div>

                  <div className="bg-cyan/10 border border-cyan/30 p-3.5 rounded-xl">
                    <span className="text-xs text-cyan font-bold block font-display">
                      Energia Injetada na Rede
                    </span>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-xl font-black text-fg font-mono">
                        {Math.round(calculoFioB.energiaInjetadaKwh)}
                      </span>
                      <span className="text-xs text-cyan font-semibold">kWh ({100 - calculoFioB.pctSimult}%)</span>
                    </div>
                    <span className="text-xs text-cyan/90 mt-1 block font-medium">
                      Base de incidência do Fio B
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Parâmetros do Fio B e Ano de Transição */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-raised">
              <div>
                <label className="text-xs font-bold text-fg-2 block mb-1.5">
                  Tarifa TUSD Fio B
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.01"
                    min="0.10"
                    max="0.80"
                    value={tarifaFioBIntegral}
                    onChange={(e) => setTarifaFioBIntegral(Number(e.target.value) || 0)}
                    className="w-full bg-bg border border-line-strong rounded-xl px-3 py-2 text-xs font-bold text-primary font-mono focus:outline-none focus:border-primary"
                  />
                  <span className="text-xs text-fg-2 font-bold">R$/kWh</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-fg-2 block mb-1.5">
                  Ano de Transição (Lei 14.300)
                </label>
                <select
                  value={anoTransicaoFioB}
                  onChange={(e) => setAnoTransicaoFioB(Number(e.target.value))}
                  className="w-full bg-bg border border-line-strong rounded-xl px-3 py-2 text-xs text-fg focus:outline-none focus:border-primary"
                >
                  {REGRAS_TRANSICAO_FIO_B.map((regra) => (
                    <option key={regra.ano} value={regra.ano}>
                      Ano {regra.ano} ({regra.percentual}% do Fio B) {regra.atual ? '· vigente' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-fg-2 block mb-1.5">
                  Alíquota Efetiva do Fio B
                </label>
                <div className="px-3 py-2 bg-bg border border-line-strong rounded-xl text-xs font-bold text-cyan flex items-center justify-between font-mono">
                  <span>{calculoFioB.pctTransicao}% aplicada</span>
                  <span>{formatCurrency(calculoFioB.tarifaFioBEfetiva)}/kWh</span>
                </div>
              </div>
            </div>

            {/* DUELO DE PREVALÊNCIA: FIO B vs TARIFA MÍNIMA */}
            <div className="pt-2 border-t border-raised space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-fg font-display">
                  Comparativo de Cobrança: Fio B vs Custo de Disponibilidade
                </span>
                <span className="text-xs text-fg-2">
                  Prevalece o de maior valor
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Bloco Fio B */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  calculoFioB.prevaleceFioB
                    ? 'bg-primary/10 border-primary/50'
                    : 'bg-bg border-raised opacity-75'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-fg-2 font-display">
                      Custo do Fio B Injetado
                    </span>
                    {calculoFioB.prevaleceFioB && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-fg font-extrabold">
                        Prevalece
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-fg font-mono">
                      {formatCurrency(calculoFioB.valorFioBCobrado)}
                    </span>
                    <span className="text-xs text-fg-2">/mês</span>
                  </div>
                  <span className="text-xs text-fg-2 mt-1 block">
                    {Math.round(calculoFioB.energiaInjetadaKwh)} kWh injetados × {formatCurrency(calculoFioB.tarifaFioBEfetiva)}/kWh
                  </span>
                </div>

                {/* Bloco Custo de Disponibilidade */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  !calculoFioB.prevaleceFioB
                    ? 'bg-cyan/10 border-cyan/50'
                    : 'bg-bg border-raised opacity-75'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-fg-2 font-display">
                      Custo de Disponibilidade (Tarifa Mínima)
                    </span>
                    {!calculoFioB.prevaleceFioB && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-cyan text-fg font-extrabold">
                        Prevalece
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-fg font-mono">
                      {formatCurrency(calculoFioB.valorDisponibilidade)}
                    </span>
                    <span className="text-xs text-fg-2">/mês</span>
                  </div>
                  <span className="text-xs text-fg-2 mt-1 block">
                    {calculoFioB.kwhDisponibilidade} kWh ({tipoLigacao}) × {formatCurrency(tarifaKwh)}/kWh
                  </span>
                </div>
              </div>

              {/* BANNER RESULTADO DA PREVALÊNCIA */}
              <div className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                calculoFioB.prevaleceFioB
                  ? 'bg-primary/10 border-primary/40 text-primary-hover'
                  : 'bg-cyan/10 border-cyan/40 text-cyan'
              }`}>
                <Scale className="shrink-0 mt-0.5 text-primary" size={22} />
                <div className="text-xs space-y-1">
                  <strong className="text-sm font-extrabold text-fg block font-display">
                    {calculoFioB.prevaleceFioB
                      ? `Prevalece a Cobrança do Fio B: ${formatCurrency(calculoFioB.valorFioBCobrado)}/mês`
                      : `Prevalece o Custo de Disponibilidade: ${formatCurrency(calculoFioB.valorDisponibilidade)}/mês`}
                  </strong>
                  <p className="text-fg-2 leading-relaxed">
                    {calculoFioB.prevaleceFioB
                      ? `Como o Fio B calculado (${formatCurrency(calculoFioB.valorFioBCobrado)}) superou a tarifa mínima (${formatCurrency(calculoFioB.valorDisponibilidade)}), o valor cobrado pela distribuidora referente ao uso da rede será de ${formatCurrency(calculoFioB.valorFioBCobrado)}.`
                      : `Como o Fio B calculado (${formatCurrency(calculoFioB.valorFioBCobrado)}) ficou abaixo do custo de disponibilidade (${formatCurrency(calculoFioB.valorDisponibilidade)}), não há dupla cobrança: prevalece a tarifa mínima de ${formatCurrency(calculoFioB.valorDisponibilidade)}.`}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* COLUNA DIREITA: RESULTADOS TÉCNICOS & GRÁFICO */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Card Resumo do Sistema Dimensionado */}
          <div className="card-solar p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-line-strong pb-3">
              <h3 className="font-bold text-lg text-fg flex items-center gap-2 font-display">
                <Sparkles className="text-primary" size={18} />
                Resultado do Dimensionamento
              </h3>
              <span className="text-xs px-2.5 py-1 rounded-full bg-ok/15 text-ok border border-ok/30 font-semibold font-display">
                Otimizado
              </span>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-line-strong/60">
                <span className="text-fg-2">Potência Instalada (kWp):</span>
                <span className="text-base font-extrabold text-fg font-mono">
                  {formatNumber(dadosDimensionamento.potenciaRealKwp, 2)} kWp
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-line-strong/60">
                <span className="text-fg-2">Arranjo de Módulos:</span>
                <span className="font-semibold text-fg">
                  {dadosDimensionamento.qtdModulosReal}x Módulos {dadosDimensionamento.potenciaWpUnit}W
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-line-strong/60">
                <span className="text-fg-2">Inversor Recomendado:</span>
                <span className="font-bold text-primary">
                  {dadosDimensionamento.inversorSugerido.nome}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-line-strong/60">
                <span className="text-fg-2">Autoconsumo Simultâneo:</span>
                <span className="font-semibold text-ok font-mono">
                  ~{Math.round(calculoFioB.energiaSimultaneaKwh)} kWh/mês ({calculoFioB.pctSimult}%)
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-line-strong/60">
                <span className="text-fg-2">Energia Injetada na Rede:</span>
                <span className="font-semibold text-cyan font-mono">
                  ~{Math.round(calculoFioB.energiaInjetadaKwh)} kWh/mês
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-line-strong/60">
                <span className="text-fg-2">Faturamento Distribuidora:</span>
                <div className="text-right">
                  <span className="text-sm font-extrabold text-fg block font-mono">
                    {formatCurrency(calculoFioB.valorFaturadoConcessionaria)}/mês
                  </span>
                  <span className="text-xs text-primary font-semibold">
                    {calculoFioB.prevaleceFioB ? '(Prevalece Fio B)' : '(Prevalece Tarifa Mínima)'}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-line-strong/60">
                <span className="text-fg-2">Área de Telhado Estimada:</span>
                <span className="font-semibold text-fg font-mono">
                  ~{Math.round(dadosDimensionamento.areaEstimadaM2)} m²
                </span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-fg-2">Economia Líquida Real:</span>
                <div className="text-right">
                  <span className="text-base font-black text-ok block font-mono">
                    ~{formatCurrency(calculoFioB.economiaLiquidaMensal)}/mês
                  </span>
                  <span className="text-xs text-ok/90 font-semibold font-mono">
                    ~{formatCurrency(calculoFioB.economiaLiquidaAnual)}/ano
                  </span>
                </div>
              </div>
            </div>

            {/* Ações de Continuidade */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  sincronizarModulosComDimensionamento()
                  onNavigate?.('custos')
                }}
                className="w-full py-3.5 bg-primary hover:bg-primary-hover text-fg font-extrabold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer font-display"
              >
                <span>Avançar para Custos & Precificação</span>
                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                onClick={() => onNavigate?.('viabilidade')}
                className="w-full py-2.5 bg-raised hover:bg-line-strong text-fg font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <FileSpreadsheet size={16} className="text-ok" />
                <span>Simular Payback na Viabilidade Financeira</span>
              </button>
            </div>
          </div>

          {/* Gráfico de Sazonalidade: Consumo vs Geração */}
          <div className="bg-panel border border-raised rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-fg flex items-center gap-2 font-display">
                <TrendingUp size={16} className="text-primary" />
                Balanço Mensal: Consumo vs Geração (kWh)
              </h4>
            </div>

            <div className="h-64 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
                <BarChart data={dadosDimensionamento.dadosGraficoMensal} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="mes" stroke="#7F899C" fontSize={11} tickLine={false} />
                  <YAxis stroke="#7F899C" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#141925', borderColor: '#36405A', borderRadius: '10px', fontSize: '12px', color: '#EEF2F8' }}
                    formatter={(val) => [`${val} kWh`, '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Bar dataKey="Consumo" fill="#47433C" radius={[4, 4, 0, 0]} name="Consumo" />
                  <Bar dataKey="Geracao" fill="#2F8CFF" radius={[4, 4, 0, 0]} name="Geração Estimada" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}
