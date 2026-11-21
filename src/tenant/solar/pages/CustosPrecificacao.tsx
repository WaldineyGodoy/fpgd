// @ts-nocheck
// Portado do CRM Solar (B2W Energia). Motor de cálculo mantido; estilo mapeado para os tokens da FPGD.
import React, { useState } from 'react'
import {
  Calculator,
  Layers,
  Zap,
  Wrench,
  ShieldCheck,
  Sliders,
  FileText,
  PieChart as PieIcon,
  TrendingUp,
  Plus,
  Trash2,
  RefreshCw,
  Copy,
  Printer,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  DollarSign,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  Sun,
  Scale
} from 'lucide-react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts'
import {
  formatCurrency,
  formatNumber
} from '../solarData'
import { useSolarProject } from '../SolarProjectContext'

export default function CustosPrecificacao({ onNavigate }) {
  const {
    marcaNome,
    cidade,
    uf,
    concessionaria,
    tarifaKwh,
    consumoMensal,
    dadosDimensionamento,
    calculoFioB,
    // Custos CC
    modoEquipamento, setModoEquipamento,
    kitFechado, setKitFechado,
    equipamentosAvulsos, setEquipamentosAvulsos,
    // Custos CA
    modoMaterialCA, setModoMaterialCA,
    kitMaterialCA, setKitMaterialCA,
    materiaisCAAvulsos, setMateriaisCAAvulsos,
    // Instalação & Engenharia
    tipoCalculoInstalacao, setTipoCalculoInstalacao,
    valorUnitInstalacao, setValorUnitInstalacao,
    adicionaisInstalacao, setAdicionaisInstalacao,
    custosEngenharia, setCustosEngenharia,
    outrosCustos, setOutrosCustos,
    custosTotais,
    sincronizarModulosComDimensionamento,
    // Precificação
    tipoPrecificacao, setTipoPrecificacao,
    margemLucroDesejada, setMargemLucroDesejada,
    aliquotaImposto, setAliquotaImposto,
    comissaoVendas, setComissaoVendas,
    reservaTecnica, setReservaTecnica,
    formacaoPreco
  } = useSolarProject()

  // Aba interna ativa
  const [abaAtiva, setAbaAtiva] = useState('equipamentos') // 'equipamentos' | 'material_ca' | 'instalacao_eng' | 'precificacao' | 'dre'
  const [copiadoWhatsapp, setCopiadoWhatsapp] = useState(false)

  // Cores da B2W Energia para o Donut Chart
  const DONUT_COLORS = [
    '#2F8CFF', // Equipamentos CC (Flame)
    '#12D4E6', // Material CA (Azul Energia)
    '#F59E0B', // Mão de Obra (Âmbar)
    '#8B5CF6', // Engenharia (Violeta)
    '#64748B', // Outros/Frete
    '#EF4444', // Impostos
    '#06B6D4', // Comissões
    '#2BD99F'  // Lucro Líquido (Verde Sustentabilidade)
  ]

  // Gerador de Proposta para WhatsApp
  const handleCopiarPropostaWhatsapp = () => {
    const texto = `*${(marcaNome || 'Proposta').toUpperCase()} — PROPOSTA COMERCIAL SOLAR* ☀️⚡
Olá! Segue o resumo do dimensionamento e custos do seu projeto fotovoltaico:

📍 *Localização:* ${cidade}/${uf} (${concessionaria})
⚡ *Potência do Sistema:* ${formatNumber(dadosDimensionamento.potenciaRealKwp, 2)} kWp
🔌 *Geração Mensal Estimada:* ~${Math.round(dadosDimensionamento.geracaoMensalMediaKwh)} kWh/mês
📦 *Módulos:* ${dadosDimensionamento.qtdModulosReal}x painéis de ${dadosDimensionamento.potenciaWpUnit}W
🔄 *Inversor:* ${dadosDimensionamento.inversorSugerido.nome}

💰 *INVESTIMENTO TOTAL:* ${formatCurrency(formacaoPreco.precoVenda)}
💵 *Economia Estimada:* ~${formatCurrency(calculoFioB.economiaLiquidaMensal)}/mês (~${formatCurrency(calculoFioB.economiaLiquidaAnual)}/ano)
🛡️ *Regulamentação:* Conforme Lei 14.300/2022 (Fio B e Tarifa Mínima calculados)

${marcaNome ? `_${marcaNome}_` : ''}`

    navigator.clipboard.writeText(texto)
    setCopiadoWhatsapp(true)
    setTimeout(() => setCopiadoWhatsapp(false), 3000)
  }

  return (
    <div className="space-y-8 animate-fadeIn pb-16 font-body">
      
      {/* ------------------------------------------------------------------ */}
      {/* CABEÇALHO DO MÓDULO */}
      {/* ------------------------------------------------------------------ */}
      <div className="card-solar p-6 md:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative overflow-hidden">
        {/* Glow de fundo */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="space-y-2 z-10">
          <div className="flex items-center gap-3">
            <span className="badge-flame">
              <Calculator size={13} />
              Módulo de Custos & Precificação
            </span>
            <span className="text-xs font-mono text-ink-300">
              CPV • Markup • DRE Executiva
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-display font-black text-ink-50 tracking-tight flex items-center gap-3">
            Custos & Formação de Preço
          </h1>

          <p className="text-sm text-ink-300 max-w-2xl">
            Composição completa do projeto: Equipamentos (Kit CC vs Avulso), Material Elétrico CA, Mão de Obra de Instalação, Engenharia/ART, Margens de Contribuição, Impostos e DRE Sintética.
          </p>
        </div>

        {/* Atalhos Rápidos de Navegação & Exportação */}
        <div className="flex flex-wrap items-center gap-2.5 z-10 w-full lg:w-auto">
          {onNavigate && (
            <>
              <button
                type="button"
                onClick={() => onNavigate('dimensionamento')}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-ink-200 bg-ink-800 hover:bg-ink-700 hover:text-fg border border-ink-700/80 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                title="Voltar ao Dimensionamento Técnico"
              >
                <Sun size={14} className="text-primary" />
                <span>Dimensionamento</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('viabilidade')}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-ink-200 bg-ink-800 hover:bg-ink-700 hover:text-fg border border-ink-700/80 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                title="Acessar Viabilidade Financeira e Payback"
              >
                <TrendingUp size={14} className="text-emerald-400" />
                <span>Viabilidade</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleCopiarPropostaWhatsapp}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 active:scale-95 cursor-pointer ${
              copiadoWhatsapp
                ? 'bg-emerald-500 text-black'
                : 'btn-brand-primary'
            }`}
          >
            {copiadoWhatsapp ? (
              <>
                <CheckCircle2 size={15} />
                <span>Proposta Copiada!</span>
              </>
            ) : (
              <>
                <Copy size={15} />
                <span>Copiar p/ WhatsApp</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="p-2 rounded-xl text-ink-300 hover:text-fg bg-ink-800 hover:bg-ink-700 border border-ink-700/80 transition-all active:scale-95 cursor-pointer"
            title="Imprimir relatório de custos"
          >
            <Printer size={16} />
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* KPI BAR / STATUS ATUAL DO PROJETO */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Potência e Módulos */}
        <div className="card-solar p-4">
          <span className="text-xs font-bold text-ink-300 block mb-1">
            Potência do Projeto
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl md:text-2xl font-display font-black text-ink-50">
              {formatNumber(dadosDimensionamento.potenciaRealKwp, 2)}
            </span>
            <span className="text-xs font-mono font-bold text-primary">kWp</span>
          </div>
          <span className="text-xs text-ink-400 mt-1 block truncate">
            {dadosDimensionamento.qtdModulosReal}x {dadosDimensionamento.potenciaWpUnit}Wp ({dadosDimensionamento.moduloObj.marca})
          </span>
        </div>

        {/* Custo Direto Total (CPV) */}
        <div className="card-solar p-4">
          <span className="text-xs font-bold text-ink-300 block mb-1">
            Custo Direto (CPV)
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl md:text-2xl font-display font-black text-ink-50">
              {formatCurrency(custosTotais.custoDiretoTotal)}
            </span>
          </div>
          <span className="text-xs text-ink-400 mt-1 block">
            ~{formatCurrency(custosTotais.custoDiretoTotal / (dadosDimensionamento.potenciaRealKwp * 1000 || 1))}/Wp
          </span>
        </div>

        {/* Preço de Venda Final */}
        <div className="card-solar p-4 border-primary/40 bg-primary/5">
          <span className="text-xs font-bold text-primary block mb-1">
            Preço de Venda
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl md:text-2xl font-display font-black text-ink-50">
              {formatCurrency(formacaoPreco.precoVenda)}
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-primary mt-1 block">
            {formatCurrency(formacaoPreco.precoPorWp)}/Wp • {formatNumber(formacaoPreco.markupMultiplicadorEfetivo, 2)}x
          </span>
        </div>

        {/* Lucro Líquido Estimado */}
        <div className="card-savings p-4">
          <span className="text-xs font-bold text-emerald-400 block mb-1">
            Lucro Líquido Previsto
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl md:text-2xl font-display font-black text-emerald-400">
              {formatCurrency(formacaoPreco.lucroLiquido)}
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-300 mt-1 block">
            {formatNumber(formacaoPreco.margemLiquidaReal, 1)}% Margem Líquida
          </span>
        </div>

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* ABAS DO MÓDULO DE CUSTOS */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center gap-1.5 p-1.5 bg-ink-900 border border-ink-800 rounded-2xl overflow-x-auto">
        {[
          { id: 'equipamentos', label: '1. Equipamentos CC (Geração)', icon: Layers, badge: formatCurrency(custosTotais.totalEquipamentos) },
          { id: 'material_ca', label: '2. Material Elétrico CA', icon: Zap, badge: formatCurrency(custosTotais.totalMaterialCA) },
          { id: 'instalacao_eng', label: '3. Instalação & Engenharia', icon: Wrench, badge: formatCurrency(custosTotais.totalInstalacao + custosTotais.totalEngenharia) },
          { id: 'precificacao', label: '4. Formação de Preço & Markup', icon: Sliders, badge: `${formatNumber(formacaoPreco.markupMultiplicadorEfetivo, 2)}x` },
          { id: 'dre', label: '5. DRE & Proposta Final', icon: FileText, badge: formatCurrency(formacaoPreco.precoVenda) }
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = abaAtiva === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setAbaAtiva(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-primary text-fg shadow-primary/20'
                  : 'text-ink-300 hover:text-ink-100 hover:bg-ink-800/60'
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
              <span className={`text-xs font-mono px-2 py-0.5 rounded-md ${
                isActive
                  ? 'bg-black/25 text-fg'
                  : 'bg-ink-800 text-ink-300'
              }`}>
                {tab.badge}
              </span>
            </button>
          )
        })}
      </div>

      {/* ================================================================== */}
      {/* ABA 1: EQUIPAMENTOS CC (KIT VS AVULSO) */}
      {/* ================================================================== */}
      {abaAtiva === 'equipamentos' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Seletor do Modo de Entrada */}
          <div className="card-solar p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="font-display font-bold text-lg text-ink-50 flex items-center gap-2">
                <Layers className="text-primary" size={20} />
                Como você deseja informar os Equipamentos Fotovoltaicos?
              </h3>
              <p className="text-xs text-ink-300 mt-1">
                Escolha se comprou um Kit Fotovoltaico Fechado de distribuidor ou se deseja precificar item por item (Módulos, Inversores, Estrutura, Cabos CC).
              </p>
            </div>

            <div className="flex bg-ink-950 p-1.5 rounded-2xl border border-ink-800 shrink-0">
              <button
                type="button"
                onClick={() => setModoEquipamento('kit')}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  modoEquipamento === 'kit'
                    ? 'bg-primary text-fg'
                    : 'text-ink-300 hover:text-ink-100'
                }`}
              >
                Kit Fotovoltaico Fechado
              </button>
              <button
                type="button"
                onClick={() => {
                  setModoEquipamento('avulso')
                  sincronizarModulosComDimensionamento()
                }}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  modoEquipamento === 'avulso'
                    ? 'bg-primary text-fg'
                    : 'text-ink-300 hover:text-ink-100'
                }`}
              >
                Cotação Item a Item (Avulso)
              </button>
            </div>
          </div>

          {/* MODO 1: KIT FECHADO */}
          {modoEquipamento === 'kit' ? (
            <div className="card-solar p-6 md:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ink-800 pb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
                  <h4 className="font-display font-bold text-ink-50 text-base">
                    Dados do Kit Fechado do Distribuidor
                  </h4>
                </div>
                <span className="badge-flame self-start sm:self-auto">
                  Potência Alvo: {formatNumber(dadosDimensionamento.potenciaRealKwp, 2)} kWp
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-bold text-ink-300 block mb-2">
                    Distribuidor / Fornecedor
                  </label>
                  <input
                    type="text"
                    value={kitFechado.distribuidor}
                    onChange={(e) => setKitFechado({ ...kitFechado, distribuidor: e.target.value })}
                    className="w-full bg-ink-950 border border-ink-800 rounded-xl px-4 py-2.5 text-sm text-ink-50 focus:outline-none focus:border-primary transition-colors"
                    placeholder="Ex: Aldo Solar, Solen, WEG..."
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className="text-xs font-bold text-ink-300 block mb-2">
                    Descrição do Kit Fotovoltaico
                  </label>
                  <input
                    type="text"
                    value={kitFechado.descricao}
                    onChange={(e) => setKitFechado({ ...kitFechado, descricao: e.target.value })}
                    className="w-full bg-ink-950 border border-ink-800 rounded-xl px-4 py-2.5 text-sm text-ink-50 focus:outline-none focus:border-primary transition-colors"
                    placeholder="Módulos N-Type TOPCon + Inversor Deye + Estrutura + Cabos CC..."
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-ink-300 block mb-2">
                    Valor de Compra do Kit (R$)
                  </label>
                  <input
                    type="number"
                    step="100"
                    value={kitFechado.valor}
                    onChange={(e) => setKitFechado({ ...kitFechado, valor: Number(e.target.value) || 0 })}
                    className="w-full bg-ink-950 border border-ink-800 rounded-xl px-4 py-2.5 text-base font-display font-black text-primary focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-ink-800">
                <div>
                  <label className="text-xs font-bold text-ink-300 block mb-2">
                    Frete dos Equipamentos (R$)
                  </label>
                  <input
                    type="number"
                    step="50"
                    value={kitFechado.frete}
                    onChange={(e) => setKitFechado({ ...kitFechado, frete: Number(e.target.value) || 0 })}
                    className="w-full bg-ink-950 border border-ink-800 rounded-xl px-4 py-2 text-sm font-semibold text-ink-100 focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div className="md:col-span-2 bg-ink-950 p-4 rounded-2xl border border-ink-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-ink-300 block">Subtotal dos Equipamentos (Kit + Frete):</span>
                    <span className="text-2xl font-display font-black text-ink-50">
                      {formatCurrency(Number(kitFechado.valor) + Number(kitFechado.frete))}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-ink-400">
                    Equivalente a {formatCurrency((Number(kitFechado.valor) + Number(kitFechado.frete)) / (dadosDimensionamento.potenciaRealKwp * 1000 || 1))}/Wp
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* MODO 2: ITENS AVULSOS CC */
            <div className="card-solar p-6 md:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ink-800 pb-4">
                <div>
                  <h4 className="font-display font-bold text-ink-50 text-base">
                    Tabela de Equipamentos Avulsos (Módulos, Inversor, Estrutura, Cabos CC)
                  </h4>
                  <p className="text-xs text-ink-300">
                    Edite preços unitários, quantidades ou adicione novos itens de corrente contínua.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={sincronizarModulosComDimensionamento}
                    className="px-3.5 py-2 bg-ink-800 hover:bg-ink-700 text-primary rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <RefreshCw size={14} />
                    <span>Sincronizar Dimensionamento</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const novoItem = {
                        id: `eq_custom_${Date.now()}`,
                        nome: 'Novo Equipamento Fotovoltaico',
                        categoria: 'Personalizado',
                        qtd: 1,
                        valorUnit: 100,
                        custom: true
                      }
                      setEquipamentosAvulsos([...equipamentosAvulsos, novoItem])
                    }}
                    className="btn-brand-primary px-3.5 py-2 text-xs"
                  >
                    <Plus size={14} />
                    <span>Adicionar Item</span>
                  </button>
                </div>
              </div>

              {/* Tabela Interativa de Equipamentos Avulsos */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-ink-800 text-xs font-bold text-ink-300">
                      <th className="py-3 px-4">Item / Equipamento</th>
                      <th className="py-3 px-3">Categoria</th>
                      <th className="py-3 px-3 text-center">Quantidade</th>
                      <th className="py-3 px-4 text-right">Valor Unitário (R$)</th>
                      <th className="py-3 px-4 text-right">Subtotal (R$)</th>
                      <th className="py-3 px-3 text-center">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-800/60 font-body">
                    {equipamentosAvulsos.map((item) => {
                      const subtotal = item.qtd * item.valorUnit
                      return (
                        <tr key={item.id} className="hover:bg-ink-800/30 transition-colors">
                          <td className="py-3 px-4 font-semibold text-ink-100">
                            <input
                              type="text"
                              value={item.nome}
                              onChange={(e) => {
                                const novoNome = e.target.value
                                setEquipamentosAvulsos(prev =>
                                  prev.map(i => i.id === item.id ? { ...i, nome: novoNome } : i)
                                )
                              }}
                              className="bg-transparent border-b border-transparent focus:border-primary text-ink-50 text-sm w-full focus:outline-none"
                            />
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-xs px-2.5 py-0.5 rounded-md bg-ink-800 text-ink-200 font-medium border border-ink-700/60">
                              {item.categoria}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <input
                              type="number"
                              min="0"
                              value={item.qtd}
                              onChange={(e) => {
                                const novaQtd = Number(e.target.value) || 0
                                setEquipamentosAvulsos(prev =>
                                  prev.map(i => i.id === item.id ? { ...i, qtd: novaQtd } : i)
                                )
                              }}
                              className="w-16 text-center bg-ink-950 border border-ink-800 rounded-lg py-1 text-sm font-bold text-ink-100 focus:outline-none focus:border-primary"
                            />
                          </td>
                          <td className="py-3 px-4 text-right">
                            <input
                              type="number"
                              min="0"
                              step="5"
                              value={item.valorUnit}
                              onChange={(e) => {
                                const novoValor = Number(e.target.value) || 0
                                setEquipamentosAvulsos(prev =>
                                  prev.map(i => i.id === item.id ? { ...i, valorUnit: novoValor } : i)
                                )
                              }}
                              className="w-24 text-right bg-ink-950 border border-ink-800 rounded-lg px-2 py-1 text-sm font-mono font-bold text-primary focus:outline-none focus:border-primary"
                            />
                          </td>
                          <td className="py-3 px-4 text-right font-display font-black text-ink-50">
                            {formatCurrency(subtotal)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setEquipamentosAvulsos(prev => prev.filter(i => i.id !== item.id))
                              }}
                              className="p-1.5 text-ink-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                              title="Remover Item"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-ink-700 bg-ink-950/70">
                      <td colSpan={4} className="py-3 px-4 font-bold text-ink-200 text-sm">
                        TOTAL DOS EQUIPAMENTOS AVULSOS (LADO CC):
                      </td>
                      <td className="py-3 px-4 text-right font-display font-black text-primary text-base">
                        {formatCurrency(custosTotais.totalEquipamentos)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Botão de Avançar */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setAbaAtiva('material_ca')}
              className="btn-brand-primary px-6 py-3 text-sm font-extrabold flex items-center gap-2"
            >
              <span>Avançar para Material Elétrico CA</span>
              <ChevronRight size={18} />
            </button>
          </div>

        </div>
      )}

      {/* ================================================================== */}
      {/* ABA 2: MATERIAL ELÉTRICO CA */}
      {/* ================================================================== */}
      {abaAtiva === 'material_ca' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Seletor Kit CA vs Avulso */}
          <div className="card-solar p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="font-display font-bold text-lg text-ink-50 flex items-center gap-2">
                <Zap className="text-primary" size={20} />
                Material Elétrico CA (Corrente Alternada - QGBT / Proteção)
              </h3>
              <p className="text-xs text-ink-300 mt-1">
                Cabos de alimentação CA, Disjuntores termomagnéticos, DPS CA, Quadros de sobrepor, Eletrodutos, abraçadeiras e fixadores.
              </p>
            </div>

            <div className="flex bg-ink-950 p-1.5 rounded-2xl border border-ink-800 shrink-0">
              <button
                type="button"
                onClick={() => setModoMaterialCA('kit')}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  modoMaterialCA === 'kit'
                    ? 'bg-primary text-fg'
                    : 'text-ink-300 hover:text-ink-100'
                }`}
              >
                Kit Padrão CA Fechado
              </button>
              <button
                type="button"
                onClick={() => setModoMaterialCA('avulso')}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  modoMaterialCA === 'avulso'
                    ? 'bg-primary text-fg'
                    : 'text-ink-300 hover:text-ink-100'
                }`}
              >
                Itens CA Avulsos
              </button>
            </div>
          </div>

          {/* MODO 1: KIT CA FECHADO */}
          {modoMaterialCA === 'kit' ? (
            <div className="card-solar p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-ink-800 pb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse"></span>
                  <h4 className="font-display font-bold text-ink-50 text-base">
                    Pacote Fechado de Material CA para o Sistema
                  </h4>
                </div>
                <span className="text-xs text-blue-400 font-semibold bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                  Prático & Rápido
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-xs font-bold text-ink-300 block mb-2">
                    Título do Pacote CA
                  </label>
                  <input
                    type="text"
                    value={kitMaterialCA.nomePacote}
                    onChange={(e) => setKitMaterialCA({ ...kitMaterialCA, nomePacote: e.target.value })}
                    className="w-full bg-ink-950 border border-ink-800 rounded-xl px-4 py-2.5 text-sm text-ink-50 focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-ink-300 block mb-2">
                    Valor Estimado do Kit CA (R$)
                  </label>
                  <input
                    type="number"
                    step="50"
                    value={kitMaterialCA.valor}
                    onChange={(e) => setKitMaterialCA({ ...kitMaterialCA, valor: Number(e.target.value) || 0 })}
                    className="w-full bg-ink-950 border border-ink-800 rounded-xl px-4 py-2.5 text-lg font-display font-black text-primary focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="bg-ink-950 p-4 rounded-2xl border border-ink-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-ink-300 block">Subtotal Material CA:</span>
                    <span className="text-2xl font-display font-black text-ink-50">
                      {formatCurrency(kitMaterialCA.valor)}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-ink-400">
                    ~{formatCurrency(kitMaterialCA.valor / (dadosDimensionamento.potenciaRealKwp * 1000 || 1))}/Wp
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-ink-300 block mb-2">
                  Itens Inclusos no Pacote CA
                </label>
                <textarea
                  rows={3}
                  value={kitMaterialCA.descricao}
                  onChange={(e) => setKitMaterialCA({ ...kitMaterialCA, descricao: e.target.value })}
                  className="w-full bg-ink-950 border border-ink-800 rounded-xl p-3 text-xs text-ink-200 focus:outline-none focus:border-primary font-mono"
                />
              </div>
            </div>
          ) : (
            /* MODO 2: ITENS CA AVULSOS */
            <div className="card-solar p-6 md:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ink-800 pb-4">
                <div>
                  <h4 className="font-display font-bold text-ink-50 text-base">
                    Lista Detalhada de Materiais Elétricos CA
                  </h4>
                  <p className="text-xs text-ink-300">
                    Ajuste bitola dos cabos, disjuntores, DPS, quadros e conexões item por item.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const novoItem = {
                      id: `ca_custom_${Date.now()}`,
                      nome: 'Novo Material Elétrico CA',
                      unidade: 'unidade',
                      qtd: 1,
                      valorUnit: 50,
                      detalhe: 'Especificação técnica'
                    }
                    setMateriaisCAAvulsos([...materiaisCAAvulsos, novoItem])
                  }}
                  className="btn-brand-primary px-3.5 py-2 text-xs"
                >
                  <Plus size={14} />
                  <span>Adicionar Item CA</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-ink-800 text-xs font-bold text-ink-300">
                      <th className="py-3 px-4">Item Elétrico CA</th>
                      <th className="py-3 px-3">Detalhe / Bitola</th>
                      <th className="py-3 px-3 text-center">Qtd / Unidade</th>
                      <th className="py-3 px-4 text-right">Valor Unitário (R$)</th>
                      <th className="py-3 px-4 text-right">Subtotal (R$)</th>
                      <th className="py-3 px-3 text-center">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-800/60 font-body">
                    {materiaisCAAvulsos.map((item) => {
                      const subtotal = item.qtd * item.valorUnit
                      return (
                        <tr key={item.id} className="hover:bg-ink-800/30 transition-colors">
                          <td className="py-3 px-4 font-semibold text-ink-100">
                            <input
                              type="text"
                              value={item.nome}
                              onChange={(e) => {
                                const novoNome = e.target.value
                                setMateriaisCAAvulsos(prev =>
                                  prev.map(i => i.id === item.id ? { ...i, nome: novoNome } : i)
                                )
                              }}
                              className="bg-transparent border-b border-transparent focus:border-primary text-ink-50 text-sm w-full focus:outline-none"
                            />
                          </td>
                          <td className="py-3 px-3 text-xs text-ink-300">
                            <input
                              type="text"
                              value={item.detalhe}
                              onChange={(e) => {
                                const novoDetalhe = e.target.value
                                setMateriaisCAAvulsos(prev =>
                                  prev.map(i => i.id === item.id ? { ...i, detalhe: novoDetalhe } : i)
                                )
                              }}
                              className="bg-transparent border-b border-transparent focus:border-primary text-ink-300 text-xs w-full focus:outline-none"
                            />
                          </td>
                          <td className="py-3 px-3 text-center">
                            <input
                              type="number"
                              min="0"
                              value={item.qtd}
                              onChange={(e) => {
                                const novaQtd = Number(e.target.value) || 0
                                setMateriaisCAAvulsos(prev =>
                                  prev.map(i => i.id === item.id ? { ...i, qtd: novaQtd } : i)
                                )
                              }}
                              className="w-16 text-center bg-ink-950 border border-ink-800 rounded-lg py-1 text-sm font-bold text-ink-100 focus:outline-none focus:border-primary"
                            />
                          </td>
                          <td className="py-3 px-4 text-right">
                            <input
                              type="number"
                              min="0"
                              step="5"
                              value={item.valorUnit}
                              onChange={(e) => {
                                const novoValor = Number(e.target.value) || 0
                                setMateriaisCAAvulsos(prev =>
                                  prev.map(i => i.id === item.id ? { ...i, valorUnit: novoValor } : i)
                                )
                              }}
                              className="w-24 text-right bg-ink-950 border border-ink-800 rounded-lg px-2 py-1 text-sm font-mono font-bold text-primary focus:outline-none focus:border-primary"
                            />
                          </td>
                          <td className="py-3 px-4 text-right font-display font-black text-ink-50">
                            {formatCurrency(subtotal)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setMateriaisCAAvulsos(prev => prev.filter(i => i.id !== item.id))
                              }}
                              className="p-1.5 text-ink-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                              title="Remover Item"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-ink-700 bg-ink-950/70">
                      <td colSpan={4} className="py-3 px-4 font-bold text-ink-200 text-sm">
                        TOTAL DO MATERIAL ELÉTRICO CA:
                      </td>
                      <td className="py-3 px-4 text-right font-display font-black text-primary text-base">
                        {formatCurrency(custosTotais.totalMaterialCA)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Botão de Avançar */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setAbaAtiva('instalacao_eng')}
              className="btn-brand-primary px-6 py-3 text-sm font-extrabold flex items-center gap-2"
            >
              <span>Avançar para Instalação & Engenharia</span>
              <ChevronRight size={18} />
            </button>
          </div>

        </div>
      )}

      {/* ================================================================== */}
      {/* ABA 3: INSTALAÇÃO & ENGENHARIA */}
      {/* ================================================================== */}
      {abaAtiva === 'instalacao_eng' && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Card Mão de Obra de Instalação */}
            <div className="card-solar p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-ink-800 pb-4">
                <h3 className="font-display font-bold text-lg text-ink-50 flex items-center gap-2">
                  <Wrench className="text-primary" size={20} />
                  Mão de Obra de Instalação
                </h3>
                <span className="text-xs bg-ink-800 text-ink-300 px-3 py-1 rounded-full font-medium border border-ink-700/60">
                  Equipe Técnica
                </span>
              </div>

              {/* Modo de Precificação da Instalação */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-ink-300">
                  Modelo de Cálculo da Instalação
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'por_wp', label: 'Por Wp (R$/Wp)' },
                    { id: 'por_modulo', label: 'Por Painel (R$/mód)' },
                    { id: 'fixo', label: 'Valor Fixo (R$)' }
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setTipoCalculoInstalacao(m.id)
                        if (m.id === 'por_wp') setValorUnitInstalacao(0.55)
                        else if (m.id === 'por_modulo') setValorUnitInstalacao(140)
                        else setValorUnitInstalacao(3500)
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        tipoCalculoInstalacao === m.id
                          ? 'bg-primary text-fg'
                          : 'bg-ink-950 text-ink-300 hover:text-ink-100 border border-ink-800'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-ink-300 block mb-2">
                    {tipoCalculoInstalacao === 'por_wp'
                      ? 'Valor por Watt-pico (R$/Wp)'
                      : tipoCalculoInstalacao === 'por_modulo'
                      ? 'Valor por Módulo (R$)'
                      : 'Valor Fixo da Equipe (R$)'}
                  </label>
                  <input
                    type="number"
                    step={tipoCalculoInstalacao === 'por_wp' ? '0.05' : '10'}
                    value={valorUnitInstalacao}
                    onChange={(e) => setValorUnitInstalacao(Number(e.target.value) || 0)}
                    className="w-full bg-ink-950 border border-ink-800 rounded-xl px-4 py-2.5 text-base font-display font-bold text-primary focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-ink-300 block mb-2">
                    Adicionais (Diárias/Altura)
                  </label>
                  <input
                    type="number"
                    step="50"
                    value={adicionaisInstalacao}
                    onChange={(e) => setAdicionaisInstalacao(Number(e.target.value) || 0)}
                    className="w-full bg-ink-950 border border-ink-800 rounded-xl px-4 py-2.5 text-sm font-semibold text-ink-100 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="bg-ink-950 p-4 rounded-2xl border border-ink-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-ink-300 block">Subtotal da Instalação:</span>
                  <span className="text-2xl font-display font-black text-ink-50">
                    {formatCurrency(custosTotais.totalInstalacao)}
                  </span>
                </div>
                <span className="text-xs font-mono text-ink-400">
                  ~{formatCurrency(custosTotais.totalInstalacao / (dadosDimensionamento.potenciaRealKwp * 1000 || 1))}/Wp
                </span>
              </div>
            </div>

            {/* Card Engenharia & Homologação */}
            <div className="card-solar p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-ink-800 pb-4">
                <h3 className="font-display font-bold text-lg text-ink-50 flex items-center gap-2">
                  <ShieldCheck className="text-primary" size={20} />
                  Engenharia & Homologação
                </h3>
                <span className="text-xs bg-ink-800 text-ink-300 px-3 py-1 rounded-full font-medium border border-ink-700/60">
                  CREA / CFT / Concessionária
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <span className="text-sm font-semibold text-ink-100 block">Projeto Elétrico & Diagrama Unifilar</span>
                    <span className="text-xs text-ink-400">Memorial descritivo e dimensionamento técnico</span>
                  </div>
                  <div className="w-32">
                    <input
                      type="number"
                      step="50"
                      value={custosEngenharia.projetoEletrico}
                      onChange={(e) => setCustosEngenharia({ ...custosEngenharia, projetoEletrico: Number(e.target.value) || 0 })}
                      className="w-full text-right bg-ink-950 border border-ink-800 rounded-xl px-3 py-1.5 text-sm font-mono font-bold text-primary focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <span className="text-sm font-semibold text-ink-100 block">Emissão de ART (CREA) / TRT (CFT)</span>
                    <span className="text-xs text-ink-400">Responsabilidade Técnica do Engenheiro</span>
                  </div>
                  <div className="w-32">
                    <input
                      type="number"
                      step="20"
                      value={custosEngenharia.artTrt}
                      onChange={(e) => setCustosEngenharia({ ...custosEngenharia, artTrt: Number(e.target.value) || 0 })}
                      className="w-full text-right bg-ink-950 border border-ink-800 rounded-xl px-3 py-1.5 text-sm font-mono font-bold text-primary focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <span className="text-sm font-semibold text-ink-100 block">Homologação na Concessionária</span>
                    <span className="text-xs text-ink-400">Protocolo, parecer de acesso e vistoria</span>
                  </div>
                  <div className="w-32">
                    <input
                      type="number"
                      step="50"
                      value={custosEngenharia.homologacao}
                      onChange={(e) => setCustosEngenharia({ ...custosEngenharia, homologacao: Number(e.target.value) || 0 })}
                      className="w-full text-right bg-ink-950 border border-ink-800 rounded-xl px-3 py-1.5 text-sm font-mono font-bold text-primary focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-ink-950 p-4 rounded-2xl border border-ink-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-ink-300 block">Subtotal Engenharia:</span>
                  <span className="text-2xl font-display font-black text-ink-50">
                    {formatCurrency(custosTotais.totalEngenharia)}
                  </span>
                </div>
                <span className="text-xs font-mono text-emerald-400">
                  Documentação 100% regularizada
                </span>
              </div>
            </div>

          </div>

          {/* Botão de Avançar */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setAbaAtiva('precificacao')}
              className="btn-brand-primary px-6 py-3 text-sm font-extrabold flex items-center gap-2"
            >
              <span>Avançar para Formação do Preço & Markup</span>
              <ChevronRight size={18} />
            </button>
          </div>

        </div>
      )}

      {/* ================================================================== */}
      {/* ABA 4: MARGEM, MARKUP & PRECIFICAÇÃO */}
      {/* ================================================================== */}
      {abaAtiva === 'precificacao' && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Coluna Esquerda: Parâmetros Comerciais */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="card-solar p-6 md:p-8 space-y-6">
                <div className="flex items-center justify-between border-b border-ink-800 pb-4">
                  <h3 className="font-display font-bold text-lg text-ink-50 flex items-center gap-2">
                    <Sliders className="text-primary" size={20} />
                    Configuração Comercial & Margens
                  </h3>
                  <span className="badge-flame">
                    Custo Base (CPV): {formatCurrency(custosTotais.custoDiretoTotal)}
                  </span>
                </div>

                {/* Seletor do Método de Precificação */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-ink-300">
                    Método de Precificação
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setTipoPrecificacao('por_dentro')}
                      className={`p-4 rounded-2xl text-left border transition-all cursor-pointer ${
                        tipoPrecificacao === 'por_dentro'
                          ? 'bg-primary/10 border-primary text-fg'
                          : 'bg-ink-950 border-ink-800 text-ink-300 hover:text-fg'
                      }`}
                    >
                      <span className="font-display font-bold text-sm block flex items-center gap-2">
                        <CheckCircle2 size={16} className={tipoPrecificacao === 'por_dentro' ? 'text-primary' : 'text-ink-500'} />
                        Margem por Dentro (Markup Divisor)
                      </span>
                      <span className="text-xs text-ink-400 mt-1.5 block">
                        Recomendado contabilmente. O preço cobre impostos e comissões sobre a receita bruta total.
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTipoPrecificacao('multiplicador')}
                      className={`p-4 rounded-2xl text-left border transition-all cursor-pointer ${
                        tipoPrecificacao === 'multiplicador'
                          ? 'bg-primary/10 border-primary text-fg'
                          : 'bg-ink-950 border-ink-800 text-ink-300 hover:text-fg'
                      }`}
                    >
                      <span className="font-display font-bold text-sm block flex items-center gap-2">
                        <CheckCircle2 size={16} className={tipoPrecificacao === 'multiplicador' ? 'text-primary' : 'text-ink-500'} />
                        Markup Multiplicador (Por Fora)
                      </span>
                      <span className="text-xs text-ink-400 mt-1.5 block">
                        Aplica a soma percentual diretamente sobre o custo direto dos equipamentos e obras.
                      </span>
                    </button>
                  </div>
                </div>

                {/* Sliders e Inputs de Percentuais */}
                <div className="space-y-6 pt-2">
                  
                  {/* Margem de Lucro Desejada */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-ink-200 flex items-center gap-1.5">
                        <TrendingUp size={14} className="text-emerald-400" />
                        Margem de Contribuição / Lucro Desejado
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.5"
                          min="5"
                          max="50"
                          value={margemLucroDesejada}
                          onChange={(e) => setMargemLucroDesejada(Number(e.target.value) || 0)}
                          className="w-16 text-right bg-ink-950 border border-ink-800 rounded-lg px-2 py-1 text-sm font-mono font-bold text-emerald-400 focus:outline-none focus:border-primary"
                        />
                        <span className="text-xs text-ink-400 font-bold">%</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="40"
                      step="0.5"
                      value={margemLucroDesejada}
                      onChange={(e) => setMargemLucroDesejada(Number(e.target.value))}
                      className="w-full accent-emerald-400 h-2 bg-ink-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Impostos sobre a Venda */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-ink-200">
                        Alíquota de Impostos (Simples Nacional / NF)
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="25"
                          value={aliquotaImposto}
                          onChange={(e) => setAliquotaImposto(Number(e.target.value) || 0)}
                          className="w-16 text-right bg-ink-950 border border-ink-800 rounded-lg px-2 py-1 text-sm font-mono font-bold text-orange-400 focus:outline-none focus:border-primary"
                        />
                        <span className="text-xs text-ink-400 font-bold">%</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="18"
                      step="0.5"
                      value={aliquotaImposto}
                      onChange={(e) => setAliquotaImposto(Number(e.target.value))}
                      className="w-full accent-orange-400 h-2 bg-ink-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Comissão de Vendas */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-ink-200">
                        Comissão do Consultor Comercial
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="15"
                          value={comissaoVendas}
                          onChange={(e) => setComissaoVendas(Number(e.target.value) || 0)}
                          className="w-16 text-right bg-ink-950 border border-ink-800 rounded-lg px-2 py-1 text-sm font-mono font-bold text-blue-400 focus:outline-none focus:border-primary"
                        />
                        <span className="text-xs text-ink-400 font-bold">%</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={comissaoVendas}
                      onChange={(e) => setComissaoVendas(Number(e.target.value))}
                      className="w-full accent-blue-400 h-2 bg-ink-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Reserva Técnica */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-ink-200">
                        Reserva Técnica / Contingência de Obra
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="10"
                          value={reservaTecnica}
                          onChange={(e) => setReservaTecnica(Number(e.target.value) || 0)}
                          className="w-16 text-right bg-ink-950 border border-ink-800 rounded-lg px-2 py-1 text-sm font-mono font-bold text-ink-300 focus:outline-none focus:border-primary"
                        />
                        <span className="text-xs text-ink-400 font-bold">%</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="0.5"
                      value={reservaTecnica}
                      onChange={(e) => setReservaTecnica(Number(e.target.value))}
                      className="w-full accent-ink-400 h-2 bg-ink-800 rounded-lg cursor-pointer"
                    />
                  </div>

                </div>
              </div>

            </div>

            {/* Coluna Direita: Breakdown e Preço de Venda */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="card-solar p-6 md:p-8 space-y-6 border-primary/40 bg-primary/5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold text-primary">
                    Preço Final ao Cliente
                  </span>
                  <span className="badge-flame font-mono">
                    Markup {formatNumber(formacaoPreco.markupMultiplicadorEfetivo, 2)}x
                  </span>
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="text-3xl sm:text-4xl font-display font-black text-ink-50">
                    {formatCurrency(formacaoPreco.precoVenda)}
                  </span>
                </div>

                {/* Badge R$/Wp com benchmark de mercado */}
                <div className="p-4 bg-ink-950 rounded-2xl border border-ink-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-ink-400 block">Indicador de Mercado:</span>
                    <span className="text-lg font-mono font-black text-primary">
                      {formatCurrency(formacaoPreco.precoPorWp)} / Wp
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                      formacaoPreco.precoPorWp < 3.20
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : formacaoPreco.precoPorWp <= 3.90
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    }`}>
                      {formacaoPreco.precoPorWp < 3.20 ? 'Altamente Competitivo' : formacaoPreco.precoPorWp <= 3.90 ? 'Padrão de Mercado' : 'Margem Premium'}
                    </span>
                  </div>
                </div>

                {/* Linhas da Formação de Preço */}
                <div className="space-y-3 pt-2 text-sm border-t border-ink-800 font-mono">
                  <div className="flex justify-between text-ink-200">
                    <span className="font-body">Custo Direto Total (CPV):</span>
                    <span className="font-semibold text-fg">{formatCurrency(custosTotais.custoDiretoTotal)}</span>
                  </div>
                  <div className="flex justify-between text-ink-400 text-xs">
                    <span className="font-body">Impostos ({aliquotaImposto}%):</span>
                    <span className="font-medium text-orange-400">{formatCurrency(formacaoPreco.valorImposto)}</span>
                  </div>
                  <div className="flex justify-between text-ink-400 text-xs">
                    <span className="font-body">Comissão de Vendas ({comissaoVendas}%):</span>
                    <span className="font-medium text-blue-400">{formatCurrency(formacaoPreco.valorComissao)}</span>
                  </div>
                  <div className="flex justify-between text-ink-400 text-xs">
                    <span className="font-body">Contingência ({reservaTecnica}%):</span>
                    <span className="font-medium text-ink-300">{formatCurrency(formacaoPreco.valorContingencia)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-bold pt-2 border-t border-ink-800">
                    <span className="font-body">Lucro Líquido Previsto:</span>
                    <span>{formatCurrency(formacaoPreco.lucroLiquido)} ({formatNumber(formacaoPreco.margemLiquidaReal, 1)}%)</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAbaAtiva('dre')}
                  className="btn-brand-primary w-full py-3.5 text-sm font-extrabold flex items-center justify-center gap-2 mt-4"
                >
                  <span>Ver DRE Sintética & Proposta Final</span>
                  <ChevronRight size={18} />
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* ABA 5: DRE SINTÉTICA & PROPOSTA FINAL */}
      {/* ================================================================== */}
      {abaAtiva === 'dre' && (
        <div className="space-y-8 animate-fadeIn">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* DRE SINTÉTICA */}
            <div className="lg:col-span-7 card-solar p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-ink-800 pb-4">
                <h3 className="font-display font-bold text-lg text-ink-50 flex items-center gap-2">
                  <FileText className="text-primary" size={20} />
                  DRE Sintética do Projeto Solar
                </h3>
                <span className="text-xs bg-ink-800 text-ink-300 px-3 py-1 rounded-full font-medium border border-ink-700/60 font-mono">
                  Demonstrativo Contábil
                </span>
              </div>

              <div className="space-y-3 font-mono text-sm">
                
                {/* 1. Receita Bruta */}
                <div className="p-3.5 bg-ink-950 rounded-xl flex justify-between items-center border border-primary/40">
                  <span className="font-bold text-ink-50 font-body">(+) RECEITA BRUTA (PREÇO DE VENDA)</span>
                  <span className="font-black text-primary text-base">{formatCurrency(formacaoPreco.precoVenda)}</span>
                </div>

                {/* 2. Deduções de Impostos */}
                <div className="px-3.5 py-2 flex justify-between items-center text-ink-300">
                  <span className="font-body">(-) Impostos sobre a Venda ({aliquotaImposto}%)</span>
                  <span className="text-red-400">-{formatCurrency(formacaoPreco.valorImposto)}</span>
                </div>

                {/* 3. Receita Líquida */}
                <div className="p-3 bg-ink-800/60 rounded-xl flex justify-between items-center text-ink-200 font-semibold">
                  <span className="font-body">(=) RECEITA OPERACIONAL LÍQUIDA</span>
                  <span className="text-ink-50 font-bold">{formatCurrency(formacaoPreco.receitaLiquida)}</span>
                </div>

                {/* 4. Custos dos Equipamentos CC */}
                <div className="px-3.5 py-1.5 flex justify-between items-center text-ink-400 text-xs">
                  <span className="font-body">(-) Equipamentos CC (Módulos, Inversor, Estrutura, Cabos)</span>
                  <span className="text-red-400">-{formatCurrency(custosTotais.totalEquipamentos)}</span>
                </div>

                {/* 5. Custo Material CA */}
                <div className="px-3.5 py-1.5 flex justify-between items-center text-ink-400 text-xs">
                  <span className="font-body">(-) Material Elétrico CA (Cabos, Disjuntores, DPS, Quadro)</span>
                  <span className="text-red-400">-{formatCurrency(custosTotais.totalMaterialCA)}</span>
                </div>

                {/* 6. Mão de Obra */}
                <div className="px-3.5 py-1.5 flex justify-between items-center text-ink-400 text-xs">
                  <span className="font-body">(-) Instalação Mecânica & Elétrica</span>
                  <span className="text-red-400">-{formatCurrency(custosTotais.totalInstalacao)}</span>
                </div>

                {/* 7. Engenharia */}
                <div className="px-3.5 py-1.5 flex justify-between items-center text-ink-400 text-xs">
                  <span className="font-body">(-) Engenharia, ART/TRT & Homologação</span>
                  <span className="text-red-400">-{formatCurrency(custosTotais.totalEngenharia)}</span>
                </div>

                {/* 8. Lucro Bruto */}
                <div className="p-3 bg-ink-800/60 rounded-xl flex justify-between items-center text-ink-200 font-semibold">
                  <span className="font-body">(=) LUCRO OPERACIONAL BRUTO</span>
                  <span className="text-ink-50 font-bold">{formatCurrency(formacaoPreco.lucroBruto)}</span>
                </div>

                {/* 9. Despesas Comerciais e Reserva */}
                <div className="px-3.5 py-1.5 flex justify-between items-center text-ink-400 text-xs">
                  <span className="font-body">(-) Comissões Comerciais ({comissaoVendas}%)</span>
                  <span className="text-red-400">-{formatCurrency(formacaoPreco.valorComissao)}</span>
                </div>
                <div className="px-3.5 py-1.5 flex justify-between items-center text-ink-400 text-xs">
                  <span className="font-body">(-) Reserva Técnica de Obra ({reservaTecnica}%)</span>
                  <span className="text-red-400">-{formatCurrency(formacaoPreco.valorContingencia)}</span>
                </div>

                {/* 10. Lucro Líquido Final */}
                <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="font-display font-extrabold text-emerald-400 block text-base">
                      (=) MARGEM DE CONTRIBUIÇÃO LÍQUIDA
                    </span>
                    <span className="text-xs text-emerald-300/80 font-body">
                      Retorno líquido da empresa após todos os custos
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-display font-black text-emerald-400 block">
                      {formatCurrency(formacaoPreco.lucroLiquido)}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-300">
                      {formatNumber(formacaoPreco.margemLiquidaReal, 1)}% do preço final
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* GRÁFICO DONUT DE COMPOSIÇÃO DOS CUSTOS */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="card-solar p-6 md:p-8 space-y-4">
                <h4 className="font-display font-bold text-ink-50 text-base flex items-center gap-2">
                  <PieIcon className="text-primary" size={18} />
                  Onde vai cada centavo do Preço de Venda
                </h4>

                <div className="h-64 w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
                    <PieChart>
                      <Pie
                        data={formacaoPreco.dadosDonut}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {formacaoPreco.dadosDonut.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={DONUT_COLORS[index % DONUT_COLORS.length]}
                            stroke="#0B0E17"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#141925',
                          borderColor: '#36405A',
                          borderRadius: '10px',
                          fontSize: '12px',
                          color: '#EEF2F8'
                        }}
                        formatter={(val) => [formatCurrency(val), 'Valor']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legenda Customizada */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-ink-800 text-xs">
                  {formacaoPreco.dadosDonut.map((item, idx) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length] }}
                      ></span>
                      <span className="truncate text-ink-300">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card CTA: Ir para Viabilidade Financeira */}
              {onNavigate && (
                <div className="card-savings p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="text-emerald-400" size={24} />
                    <div>
                      <h4 className="font-display font-bold text-ink-50 text-base">
                        Simular Retorno do Investimento (Payback)
                      </h4>
                      <p className="text-xs text-ink-300">
                        Com o preço fixado em {formatCurrency(formacaoPreco.precoVenda)}, analise o fluxo de caixa de 25 anos, TIR e VPL.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigate('viabilidade')}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer text-sm"
                  >
                    <span>Abrir Viabilidade Financeira</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  )
}
