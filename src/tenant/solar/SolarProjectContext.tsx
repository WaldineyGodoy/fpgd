// @ts-nocheck
// Portado do CRM Solar (B2W Energia). Motor de cálculo mantido; estilo mapeado para os tokens da FPGD.
import React, { createContext, useContext, useState, useMemo } from 'react'
import {
  UF_DATA,
  MESES_NOMES,
  TIPOS_ESTRUTURA,
  TIPOS_LIGACAO,
  MODULOS_PADRAO,
  INVERSORES_PADRAO,
  MATERIAIS_CA_DEFAULT,
  REGRAS_TRANSICAO_FIO_B,
  formatCurrency,
  formatNumber
} from './solarData'

const SolarProjectContext = createContext({})

export function SolarProjectProvider({ children, marcaNome = '' }) {
  // -------------------------------------------------------------
  // 1. LOCALIZAÇÃO & CONCESSIONÁRIA
  // -------------------------------------------------------------
  // Padrão: Natal/RN (base da FPGD)
  const [cep, setCep] = useState('59000-000')
  const [cidade, setCidade] = useState('Natal')
  const [uf, setUf] = useState('RN')
  const [concessionaria, setConcessionaria] = useState(UF_DATA.RN.concessionaria)
  const [hspCustom, setHspCustom] = useState(UF_DATA.RN.irradiacaoMedia)
  const [tarifaKwh, setTarifaKwh] = useState(UF_DATA.RN.tarifa)
  const [mensalHsp, setMensalHsp] = useState(UF_DATA.RN.mensal)

  // -------------------------------------------------------------
  // 2. DEMANDA ENERGÉTICA E PARÂMETROS TÉCNICOS
  // -------------------------------------------------------------
  const [consumoMensal, setConsumoMensal] = useState(650) // kWh/mês
  const [tipoLigacao, setTipoLigacao] = useState('bifasico') // 50 kWh
  const [descontarDisponibilidade, setDescontarDisponibilidade] = useState(true)
  const [performanceRatio, setPerformanceRatio] = useState(80) // 80% (PR)
  const [tipoEstrutura, setTipoEstrutura] = useState('telhado_ceramico')
  const [moduloSelecionadoId, setModuloSelecionadoId] = useState('mod_580')
  const [potenciaModuloCustom, setPotenciaModuloCustom] = useState(580) // Wp
  const [qtdModulosManual, setQtdModulosManual] = useState(null)

  // -------------------------------------------------------------
  // 3. SIMULTANEIDADE & FIO B (LEI 14.300)
  // -------------------------------------------------------------
  const [simultaneidade, setSimultaneidade] = useState(40) // 40%
  const [tarifaFioBIntegral, setTarifaFioBIntegral] = useState(0.28) // R$ 0,28 / kWh
  const [anoTransicaoFioB, setAnoTransicaoFioB] = useState(2026) // 2026 = 60%
  const [taxaIluminacaoPublica, setTaxaIluminacaoPublica] = useState(35.0) // CIP

  // -------------------------------------------------------------
  // 4. EQUIPAMENTOS (LADO CC / GERAÇÃO)
  // -------------------------------------------------------------
  const [modoEquipamento, setModoEquipamento] = useState('kit') // 'kit' | 'avulso'
  const [kitFechado, setKitFechado] = useState({
    distribuidor: 'Aldo Solar / Solen',
    descricao: 'Kit Completo N-Type TOPCon c/ Inversor Deye + Estrutura + Cabos CC',
    valor: 14800,
    frete: 450
  })

  const [equipamentosAvulsos, setEquipamentosAvulsos] = useState([
    { id: 'eq_modulos', nome: 'Módulos Fotovoltaicos 580W TOPCon', categoria: 'Módulos', qtd: 10, valorUnit: 375, custom: false },
    { id: 'eq_inversor', nome: 'Inversor String 5.0 kW Monofásico/Bifásico', categoria: 'Inversor', qtd: 1, valorUnit: 3800, custom: false },
    { id: 'eq_estrutura', nome: 'Estrutura Fixação Telhado Cerâmico', categoria: 'Estrutura', qtd: 10, valorUnit: 65, custom: false },
    { id: 'eq_cabos_cc', nome: 'Cabos Solares CC 4mm² (Preto/Vermelho 1.8kV)', categoria: 'Cabos CC', qtd: 80, valorUnit: 6.5, custom: false },
    { id: 'eq_mc4_string', nome: 'Conectores MC4 (Pares) + Stringbox CC', categoria: 'Proteção CC', qtd: 4, valorUnit: 120, custom: false }
  ])

  // -------------------------------------------------------------
  // 5. MATERIAL ELÉTRICO CA (CORRENTE ALTERNADA)
  // -------------------------------------------------------------
  const [modoMaterialCA, setModoMaterialCA] = useState('kit') // 'kit' | 'avulso'
  const [kitMaterialCA, setKitMaterialCA] = useState({
    nomePacote: 'Kit Material Elétrico Padrão CA (até 8 kW)',
    descricao: 'Cabos flex 10mm² (25m), Disjuntor Bi/Tri, DPS Classe II Clamper, QGBT Sobrepor, Eletrodutos e conexões, buchas/terminais',
    valor: 1250
  })

  const [materiaisCAAvulsos, setMateriaisCAAvulsos] = useState(MATERIAIS_CA_DEFAULT)

  // -------------------------------------------------------------
  // 6. MÃO DE OBRA E ENGENHARIA
  // -------------------------------------------------------------
  const [tipoCalculoInstalacao, setTipoCalculoInstalacao] = useState('por_wp')
  const [valorUnitInstalacao, setValorUnitInstalacao] = useState(0.55)
  const [adicionaisInstalacao, setAdicionaisInstalacao] = useState(300)

  const [custosEngenharia, setCustosEngenharia] = useState({
    projetoEletrico: 800,
    artTrt: 250,
    homologacao: 600
  })

  const [outrosCustos, setOutrosCustos] = useState({
    freteGeral: 250,
    seguroObra: 150
  })

  // -------------------------------------------------------------
  // 7. POLÍTICA COMERCIAL, MARKUP E MARGEM
  // -------------------------------------------------------------
  const [tipoPrecificacao, setTipoPrecificacao] = useState('por_dentro') // 'por_dentro' | 'multiplicador'
  const [margemLucroDesejada, setMargemLucroDesejada] = useState(22) // 22%
  const [aliquotaImposto, setAliquotaImposto] = useState(6.5) // 6.5%
  const [comissaoVendas, setComissaoVendas] = useState(4.0) // 4%
  const [reservaTecnica, setReservaTecnica] = useState(1.5) // 1.5%

  // =============================================================
  // MOTOR DE CÁLCULO DE ENGENHARIA SOLAR (DIMENSIONAMENTO)
  // =============================================================
  const dadosDimensionamento = useMemo(() => {
    const ligacaoObj = TIPOS_LIGACAO.find(l => l.id === tipoLigacao) || TIPOS_LIGACAO[1]
    const custoDisponibilidade = descontarDisponibilidade ? ligacaoObj.custoKwh : 0
    const consumoLiquidoCompensavel = Math.max(0, consumoMensal - custoDisponibilidade)
    const demandaDiariaKwh = consumoLiquidoCompensavel / 30

    const prDecimal = performanceRatio / 100
    const hspEfetivo = Math.max(1, Number(hspCustom) || 4.5)
    const potenciaCalculadaKwp = demandaDiariaKwh / (hspEfetivo * prDecimal)

    const moduloObj = MODULOS_PADRAO.find(m => m.id === moduloSelecionadoId) || MODULOS_PADRAO[1]
    const potenciaWpUnit = potenciaModuloCustom || moduloObj.potenciaW
    const qtdModulosSugerida = Math.ceil((potenciaCalculadaKwp * 1000) / potenciaWpUnit)
    
    const qtdModulosReal = qtdModulosManual !== null ? qtdModulosManual : qtdModulosSugerida
    const potenciaRealKwp = (qtdModulosReal * potenciaWpUnit) / 1000

    const potenciaInversorSugeridaKw = potenciaRealKwp / 1.25
    let inversorSugerido = INVERSORES_PADRAO[0]
    for (const inv of INVERSORES_PADRAO) {
      if (inv.potenciaKw >= potenciaInversorSugeridaKw) {
        inversorSugerido = inv
        break
      }
      inversorSugerido = inv
    }

    const areaEstimadaM2 = qtdModulosReal * moduloObj.areaM2
    const pesoEstimadoKg = qtdModulosReal * 28

    const geracaoMensalMediaKwh = potenciaRealKwp * hspEfetivo * 30 * prDecimal
    const geracaoAnualEstimadaKwh = geracaoMensalMediaKwh * 12
    const economiaMensalEstimada = geracaoMensalMediaKwh * tarifaKwh

    const dadosGraficoMensal = MESES_NOMES.map((mes, idx) => {
      const hspMes = mensalHsp[idx] || hspEfetivo
      const diasMes = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][idx]
      const geracaoMes = Math.round(potenciaRealKwp * hspMes * diasMes * prDecimal)
      return {
        mes,
        Consumo: consumoMensal,
        Geracao: geracaoMes,
        hsp: hspMes
      }
    })

    return {
      custoDisponibilidade,
      consumoLiquidoCompensavel,
      demandaDiariaKwh,
      potenciaCalculadaKwp,
      potenciaWpUnit,
      qtdModulosSugerida,
      qtdModulosReal,
      potenciaRealKwp,
      inversorSugerido,
      areaEstimadaM2,
      pesoEstimadoKg,
      geracaoMensalMediaKwh,
      geracaoAnualEstimadaKwh,
      economiaMensalEstimada,
      dadosGraficoMensal,
      moduloObj
    }
  }, [
    consumoMensal,
    tipoLigacao,
    descontarDisponibilidade,
    performanceRatio,
    hspCustom,
    moduloSelecionadoId,
    potenciaModuloCustom,
    qtdModulosManual,
    tarifaKwh,
    mensalHsp
  ])

  // =============================================================
  // MOTOR DE CÁLCULO DE SIMULTANEIDADE & FIO B (LEI 14.300)
  // =============================================================
  const calculoFioB = useMemo(() => {
    const energiaBase = dadosDimensionamento.geracaoMensalMediaKwh || consumoMensal || 500
    const pctSimult = Math.min(100, Math.max(0, Number(simultaneidade) || 0))
    const energiaSimultaneaKwh = energiaBase * (pctSimult / 100)
    const energiaInjetadaKwh = Math.max(0, energiaBase - energiaSimultaneaKwh)

    const regraTransicao = REGRAS_TRANSICAO_FIO_B.find(r => r.ano === Number(anoTransicaoFioB)) || { percentual: 60 }
    const pctTransicao = regraTransicao.percentual
    const tarifaFioBEfetiva = Number(tarifaFioBIntegral || 0.28) * (pctTransicao / 100)
    const valorFioBCobrado = energiaInjetadaKwh * tarifaFioBEfetiva

    const ligacaoObj = TIPOS_LIGACAO.find(l => l.id === tipoLigacao) || TIPOS_LIGACAO[1]
    const kwhDisponibilidade = ligacaoObj.custoKwh
    const valorDisponibilidade = kwhDisponibilidade * tarifaKwh

    const prevaleceFioB = valorFioBCobrado >= valorDisponibilidade
    const valorFaturadoConcessionaria = Math.max(valorDisponibilidade, valorFioBCobrado)
    const diferencaPrevalencia = Math.abs(valorFioBCobrado - valorDisponibilidade)

    const faturaPosSolar = valorFaturadoConcessionaria + Number(taxaIluminacaoPublica || 0)
    const faturaSemSolar = (consumoMensal * tarifaKwh) + Number(taxaIluminacaoPublica || 0)

    const economiaLiquidaMensal = Math.max(0, faturaSemSolar - faturaPosSolar)
    const economiaLiquidaAnual = economiaLiquidaMensal * 12

    return {
      energiaBase,
      pctSimult,
      energiaSimultaneaKwh,
      energiaInjetadaKwh,
      pctTransicao,
      tarifaFioBEfetiva,
      valorFioBCobrado,
      kwhDisponibilidade,
      valorDisponibilidade,
      prevaleceFioB,
      valorFaturadoConcessionaria,
      diferencaPrevalencia,
      faturaPosSolar,
      faturaSemSolar,
      economiaLiquidaMensal,
      economiaLiquidaAnual
    }
  }, [
    dadosDimensionamento.geracaoMensalMediaKwh,
    consumoMensal,
    simultaneidade,
    anoTransicaoFioB,
    tarifaFioBIntegral,
    tipoLigacao,
    tarifaKwh,
    taxaIluminacaoPublica
  ])

  // =============================================================
  // MOTOR DE CUSTOS DIRETOS (CPV - CUSTO DO PROJETO)
  // =============================================================
  const custosTotais = useMemo(() => {
    let totalEquipamentos = 0
    if (modoEquipamento === 'kit') {
      totalEquipamentos = Number(kitFechado.valor) + Number(kitFechado.frete || 0)
    } else {
      totalEquipamentos = equipamentosAvulsos.reduce((acc, item) => acc + (item.qtd * item.valorUnit), 0)
    }

    let totalMaterialCA = 0
    if (modoMaterialCA === 'kit') {
      totalMaterialCA = Number(kitMaterialCA.valor)
    } else {
      totalMaterialCA = materiaisCAAvulsos.reduce((acc, item) => acc + (item.qtd * item.valorUnit), 0)
    }

    let totalInstalacao = 0
    if (tipoCalculoInstalacao === 'por_wp') {
      totalInstalacao = (dadosDimensionamento.potenciaRealKwp * 1000) * Number(valorUnitInstalacao)
    } else if (tipoCalculoInstalacao === 'por_modulo') {
      totalInstalacao = dadosDimensionamento.qtdModulosReal * Number(valorUnitInstalacao)
    } else {
      totalInstalacao = Number(valorUnitInstalacao)
    }
    totalInstalacao += Number(adicionaisInstalacao || 0)

    const totalEngenharia =
      Number(custosEngenharia.projetoEletrico || 0) +
      Number(custosEngenharia.artTrt || 0) +
      Number(custosEngenharia.homologacao || 0)

    const totalOutros =
      Number(outrosCustos.freteGeral || 0) +
      Number(outrosCustos.seguroObra || 0)

    const custoDiretoTotal = totalEquipamentos + totalMaterialCA + totalInstalacao + totalEngenharia + totalOutros

    return {
      totalEquipamentos,
      totalMaterialCA,
      totalInstalacao,
      totalEngenharia,
      totalOutros,
      custoDiretoTotal
    }
  }, [
    modoEquipamento,
    kitFechado,
    equipamentosAvulsos,
    modoMaterialCA,
    kitMaterialCA,
    materiaisCAAvulsos,
    tipoCalculoInstalacao,
    valorUnitInstalacao,
    adicionaisInstalacao,
    dadosDimensionamento.potenciaRealKwp,
    dadosDimensionamento.qtdModulosReal,
    custosEngenharia,
    outrosCustos
  ])

  // =============================================================
  // MOTOR DE FORMAÇÃO DO PREÇO DE VENDA (MARKUP & MARGEM)
  // =============================================================
  const formacaoPreco = useMemo(() => {
    const custo = custosTotais.custoDiretoTotal
    const margem = Number(margemLucroDesejada) || 0
    const imposto = Number(aliquotaImposto) || 0
    const comissao = Number(comissaoVendas) || 0
    const contingencia = Number(reservaTecnica) || 0

    const somaPercentuais = (margem + imposto + comissao + contingencia) / 100

    let precoVenda = 0
    let markupMultiplicadorEfetivo = 0

    if (tipoPrecificacao === 'por_dentro') {
      if (somaPercentuais >= 1) {
        precoVenda = custo * 2
      } else {
        precoVenda = custo / (1 - somaPercentuais)
      }
      markupMultiplicadorEfetivo = custo > 0 ? (precoVenda / custo) : 1
    } else {
      precoVenda = custo * (1 + somaPercentuais)
      markupMultiplicadorEfetivo = 1 + somaPercentuais
    }

    const valorImposto = precoVenda * (imposto / 100)
    const valorComissao = precoVenda * (comissao / 100)
    const valorContingencia = precoVenda * (contingencia / 100)
    const receitaLiquida = precoVenda - valorImposto
    const lucroBruto = receitaLiquida - custo
    const lucroLiquido = lucroBruto - valorComissao - valorContingencia
    const margemLiquidaReal = precoVenda > 0 ? (lucroLiquido / precoVenda) * 100 : 0

    const wattsPicoTotais = dadosDimensionamento.potenciaRealKwp * 1000
    const precoPorWp = wattsPicoTotais > 0 ? precoVenda / wattsPicoTotais : 0
    const custoPorWp = wattsPicoTotais > 0 ? custo / wattsPicoTotais : 0

    const economiaAnualLiquida = calculoFioB.economiaLiquidaAnual
    const paybackAnos = economiaAnualLiquida > 0 ? precoVenda / economiaAnualLiquida : 0

    const dadosDonut = [
      { name: 'Equipamentos CC', value: Math.round(custosTotais.totalEquipamentos), color: '#2F8CFF' },
      { name: 'Material CA', value: Math.round(custosTotais.totalMaterialCA), color: '#4C9DFF' },
      { name: 'Instalação', value: Math.round(custosTotais.totalInstalacao), color: '#12D4E6' },
      { name: 'Engenharia/Projetos', value: Math.round(custosTotais.totalEngenharia), color: '#2F8CFF' },
      { name: 'Impostos & Comissões', value: Math.round(valorImposto + valorComissao + valorContingencia), color: '#7F899C' },
      { name: 'Margem Líquida', value: Math.max(0, Math.round(lucroLiquido)), color: '#2BD99F' }
    ]

    return {
      custo,
      precoVenda,
      markupMultiplicadorEfetivo,
      valorImposto,
      valorComissao,
      valorContingencia,
      receitaLiquida,
      lucroBruto,
      lucroLiquido,
      margemLiquidaReal,
      precoPorWp,
      custoPorWp,
      paybackAnos,
      economiaAnualEst: economiaAnualLiquida,
      dadosDonut
    }
  }, [
    custosTotais,
    margemLucroDesejada,
    aliquotaImposto,
    comissaoVendas,
    reservaTecnica,
    tipoPrecificacao,
    dadosDimensionamento.potenciaRealKwp,
    calculoFioB,
    tarifaKwh
  ])

  // Sincronizar módulos avulsos
  const sincronizarModulosComDimensionamento = () => {
    setEquipamentosAvulsos(prev =>
      prev.map(item => {
        if (item.categoria === 'Módulos') {
          return {
            ...item,
            qtd: dadosDimensionamento.qtdModulosReal,
            valorUnit: dadosDimensionamento.moduloObj.precoUnitario,
            nome: `${dadosDimensionamento.moduloObj.nome}`
          }
        }
        if (item.categoria === 'Estrutura') {
          const estObj = TIPOS_ESTRUTURA.find(e => e.id === tipoEstrutura) || TIPOS_ESTRUTURA[0]
          return {
            ...item,
            qtd: dadosDimensionamento.qtdModulosReal,
            valorUnit: estObj.custoBasePorModulo,
            nome: `Estrutura ${estObj.label}`
          }
        }
        return item
      })
    )
  }


  // -------------------------------------------------------------
  // PERSISTÊNCIA (proposta salva no CRM do associado)
  // -------------------------------------------------------------
  const snapshot = () => ({ cep, cidade, uf, concessionaria, hspCustom, tarifaKwh, mensalHsp, consumoMensal, tipoLigacao, descontarDisponibilidade, performanceRatio, tipoEstrutura, moduloSelecionadoId, potenciaModuloCustom, qtdModulosManual, simultaneidade, tarifaFioBIntegral, anoTransicaoFioB, taxaIluminacaoPublica, modoEquipamento, kitFechado, equipamentosAvulsos, modoMaterialCA, kitMaterialCA, materiaisCAAvulsos, tipoCalculoInstalacao, valorUnitInstalacao, adicionaisInstalacao, custosEngenharia, outrosCustos, tipoPrecificacao, margemLucroDesejada, aliquotaImposto, comissaoVendas, reservaTecnica })
  const hydrate = (d = {}) => {
    if (d.cep !== undefined) setCep(d.cep)
    if (d.cidade !== undefined) setCidade(d.cidade)
    if (d.uf !== undefined) setUf(d.uf)
    if (d.concessionaria !== undefined) setConcessionaria(d.concessionaria)
    if (d.hspCustom !== undefined) setHspCustom(d.hspCustom)
    if (d.tarifaKwh !== undefined) setTarifaKwh(d.tarifaKwh)
    if (d.mensalHsp !== undefined) setMensalHsp(d.mensalHsp)
    if (d.consumoMensal !== undefined) setConsumoMensal(d.consumoMensal)
    if (d.tipoLigacao !== undefined) setTipoLigacao(d.tipoLigacao)
    if (d.descontarDisponibilidade !== undefined) setDescontarDisponibilidade(d.descontarDisponibilidade)
    if (d.performanceRatio !== undefined) setPerformanceRatio(d.performanceRatio)
    if (d.tipoEstrutura !== undefined) setTipoEstrutura(d.tipoEstrutura)
    if (d.moduloSelecionadoId !== undefined) setModuloSelecionadoId(d.moduloSelecionadoId)
    if (d.potenciaModuloCustom !== undefined) setPotenciaModuloCustom(d.potenciaModuloCustom)
    if (d.qtdModulosManual !== undefined) setQtdModulosManual(d.qtdModulosManual)
    if (d.simultaneidade !== undefined) setSimultaneidade(d.simultaneidade)
    if (d.tarifaFioBIntegral !== undefined) setTarifaFioBIntegral(d.tarifaFioBIntegral)
    if (d.anoTransicaoFioB !== undefined) setAnoTransicaoFioB(d.anoTransicaoFioB)
    if (d.taxaIluminacaoPublica !== undefined) setTaxaIluminacaoPublica(d.taxaIluminacaoPublica)
    if (d.modoEquipamento !== undefined) setModoEquipamento(d.modoEquipamento)
    if (d.kitFechado !== undefined) setKitFechado(d.kitFechado)
    if (d.equipamentosAvulsos !== undefined) setEquipamentosAvulsos(d.equipamentosAvulsos)
    if (d.modoMaterialCA !== undefined) setModoMaterialCA(d.modoMaterialCA)
    if (d.kitMaterialCA !== undefined) setKitMaterialCA(d.kitMaterialCA)
    if (d.materiaisCAAvulsos !== undefined) setMateriaisCAAvulsos(d.materiaisCAAvulsos)
    if (d.tipoCalculoInstalacao !== undefined) setTipoCalculoInstalacao(d.tipoCalculoInstalacao)
    if (d.valorUnitInstalacao !== undefined) setValorUnitInstalacao(d.valorUnitInstalacao)
    if (d.adicionaisInstalacao !== undefined) setAdicionaisInstalacao(d.adicionaisInstalacao)
    if (d.custosEngenharia !== undefined) setCustosEngenharia(d.custosEngenharia)
    if (d.outrosCustos !== undefined) setOutrosCustos(d.outrosCustos)
    if (d.tipoPrecificacao !== undefined) setTipoPrecificacao(d.tipoPrecificacao)
    if (d.margemLucroDesejada !== undefined) setMargemLucroDesejada(d.margemLucroDesejada)
    if (d.aliquotaImposto !== undefined) setAliquotaImposto(d.aliquotaImposto)
    if (d.comissaoVendas !== undefined) setComissaoVendas(d.comissaoVendas)
    if (d.reservaTecnica !== undefined) setReservaTecnica(d.reservaTecnica)
  }

  const value = {
    marcaNome, snapshot, hydrate,
    // Local
    cep, setCep,
    cidade, setCidade,
    uf, setUf,
    concessionaria, setConcessionaria,
    hspCustom, setHspCustom,
    tarifaKwh, setTarifaKwh,
    mensalHsp, setMensalHsp,

    // Dimensionamento
    consumoMensal, setConsumoMensal,
    tipoLigacao, setTipoLigacao,
    descontarDisponibilidade, setDescontarDisponibilidade,
    performanceRatio, setPerformanceRatio,
    tipoEstrutura, setTipoEstrutura,
    moduloSelecionadoId, setModuloSelecionadoId,
    potenciaModuloCustom, setPotenciaModuloCustom,
    qtdModulosManual, setQtdModulosManual,
    dadosDimensionamento,

    // Fio B & Simultaneidade
    simultaneidade, setSimultaneidade,
    tarifaFioBIntegral, setTarifaFioBIntegral,
    anoTransicaoFioB, setAnoTransicaoFioB,
    taxaIluminacaoPublica, setTaxaIluminacaoPublica,
    calculoFioB,

    // Custos
    modoEquipamento, setModoEquipamento,
    kitFechado, setKitFechado,
    equipamentosAvulsos, setEquipamentosAvulsos,
    modoMaterialCA, setModoMaterialCA,
    kitMaterialCA, setKitMaterialCA,
    materiaisCAAvulsos, setMateriaisCAAvulsos,
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
  }

  return (
    <SolarProjectContext.Provider value={value}>
      {children}
    </SolarProjectContext.Provider>
  )
}

export const useSolarProject = () => useContext(SolarProjectContext)
