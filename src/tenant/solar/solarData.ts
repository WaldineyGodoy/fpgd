// @ts-nocheck
// Portado do CRM Solar (B2W Energia). Motor de cálculo mantido; estilo mapeado para os tokens da FPGD.
// Base de dados e constantes técnicas do setor solar fotovoltaico brasileiro

export const UF_DATA = {
  AC: {
    nome: 'Acre',
    concessionaria: 'Energisa Acre',
    irradiacaoMedia: 4.30,
    tarifa: 1.05,
    mensal: [4.5, 4.4, 4.3, 4.2, 4.0, 3.8, 4.1, 4.5, 4.6, 4.5, 4.4, 4.3]
  },
  AL: {
    nome: 'Alagoas',
    concessionaria: 'Equatorial Alagoas',
    irradiacaoMedia: 5.40,
    tarifa: 0.96,
    mensal: [5.8, 5.7, 5.5, 5.1, 4.7, 4.4, 4.6, 5.1, 5.5, 5.8, 5.9, 5.9]
  },
  AM: {
    nome: 'Amazonas',
    concessionaria: 'Amazonas Energia',
    irradiacaoMedia: 4.10,
    tarifa: 1.02,
    mensal: [4.0, 3.9, 4.0, 4.1, 4.1, 4.2, 4.4, 4.5, 4.5, 4.3, 4.1, 4.0]
  },
  AP: {
    nome: 'Amapá',
    concessionaria: 'CEA (Equatorial)',
    irradiacaoMedia: 5.00,
    tarifa: 1.04,
    mensal: [4.2, 4.0, 4.1, 4.3, 4.5, 4.8, 5.2, 5.7, 6.0, 6.1, 5.8, 4.9]
  },
  BA: {
    nome: 'Bahia',
    concessionaria: 'Neoenergia Coelba',
    irradiacaoMedia: 5.30,
    tarifa: 0.94,
    mensal: [5.6, 5.5, 5.3, 4.9, 4.6, 4.3, 4.5, 4.9, 5.4, 5.7, 5.5, 5.5]
  },
  CE: {
    nome: 'Ceará',
    concessionaria: 'Enel Ceará',
    irradiacaoMedia: 5.60,
    tarifa: 0.98,
    mensal: [5.2, 4.9, 4.7, 4.7, 5.0, 5.3, 5.7, 6.1, 6.4, 6.4, 6.2, 5.7]
  },
  DF: {
    nome: 'Distrito Federal',
    concessionaria: 'Neoenergia Brasília',
    irradiacaoMedia: 5.20,
    tarifa: 0.92,
    mensal: [4.9, 5.0, 4.8, 5.1, 5.2, 5.2, 5.4, 5.7, 5.6, 5.0, 4.6, 4.5]
  },
  ES: {
    nome: 'Espírito Santo',
    concessionaria: 'EDP Espírito Santo',
    irradiacaoMedia: 4.70,
    tarifa: 0.89,
    mensal: [5.4, 5.3, 4.8, 4.4, 4.0, 3.7, 3.9, 4.3, 4.4, 4.7, 4.7, 5.0]
  },
  GO: {
    nome: 'Goiás',
    concessionaria: 'Equatorial Goiás',
    irradiacaoMedia: 5.30,
    tarifa: 0.95,
    mensal: [4.9, 5.0, 4.9, 5.2, 5.3, 5.3, 5.5, 5.9, 5.8, 5.2, 4.7, 4.6]
  },
  MA: {
    nome: 'Maranhão',
    concessionaria: 'Equatorial Maranhão',
    irradiacaoMedia: 5.10,
    tarifa: 0.96,
    mensal: [4.5, 4.2, 4.3, 4.5, 4.8, 5.2, 5.6, 5.9, 6.1, 6.0, 5.6, 5.0]
  },
  MG: {
    nome: 'Minas Gerais',
    concessionaria: 'Cemig',
    irradiacaoMedia: 5.20,
    tarifa: 1.02,
    mensal: [5.2, 5.3, 5.0, 4.9, 4.7, 4.5, 4.7, 5.2, 5.4, 5.2, 4.8, 4.8]
  },
  MS: {
    nome: 'Mato Grosso do Sul',
    concessionaria: 'Energisa MS',
    irradiacaoMedia: 5.10,
    tarifa: 1.03,
    mensal: [5.4, 5.3, 5.1, 4.9, 4.4, 4.1, 4.4, 5.0, 5.1, 5.2, 5.4, 5.5]
  },
  MT: {
    nome: 'Mato Grosso',
    concessionaria: 'Energisa MT',
    irradiacaoMedia: 5.20,
    tarifa: 1.04,
    mensal: [4.7, 4.8, 4.8, 5.1, 5.2, 5.2, 5.5, 5.8, 5.6, 5.2, 4.9, 4.6]
  },
  PA: {
    nome: 'Pará',
    concessionaria: 'Equatorial Pará',
    irradiacaoMedia: 4.80,
    tarifa: 1.09,
    mensal: [4.1, 3.9, 4.0, 4.2, 4.4, 4.8, 5.1, 5.5, 5.7, 5.7, 5.3, 4.6]
  },
  PB: {
    nome: 'Paraíba',
    concessionaria: 'Energisa Paraíba',
    irradiacaoMedia: 5.50,
    tarifa: 0.96,
    mensal: [5.8, 5.7, 5.4, 5.0, 4.6, 4.3, 4.5, 5.1, 5.7, 6.0, 6.1, 6.0]
  },
  PE: {
    nome: 'Pernambuco',
    concessionaria: 'Neoenergia Pernambuco',
    irradiacaoMedia: 5.40,
    tarifa: 0.94,
    mensal: [5.7, 5.6, 5.3, 4.9, 4.5, 4.1, 4.3, 4.9, 5.5, 5.9, 6.0, 5.9]
  },
  PI: {
    nome: 'Piauí',
    concessionaria: 'Equatorial Piauí',
    irradiacaoMedia: 5.60,
    tarifa: 0.97,
    mensal: [5.0, 4.8, 4.8, 5.0, 5.3, 5.6, 6.0, 6.3, 6.6, 6.5, 6.0, 5.3]
  },
  PR: {
    nome: 'Paraná',
    concessionaria: 'Copel',
    irradiacaoMedia: 4.50,
    tarifa: 0.88,
    mensal: [5.3, 5.1, 4.6, 4.1, 3.5, 3.1, 3.4, 4.1, 4.2, 4.7, 5.2, 5.4]
  },
  RJ: {
    nome: 'Rio de Janeiro',
    concessionaria: 'Light / Enel RJ',
    irradiacaoMedia: 4.60,
    tarifa: 1.02,
    mensal: [5.4, 5.3, 4.7, 4.2, 3.8, 3.5, 3.7, 4.1, 4.1, 4.5, 4.7, 5.0]
  },
  RN: {
    nome: 'Rio Grande do Norte',
    concessionaria: 'Neoenergia Cosern',
    irradiacaoMedia: 5.70,
    tarifa: 0.989,
    mensal: [5.9, 5.7, 5.4, 5.0, 4.8, 4.7, 5.0, 5.7, 6.2, 6.4, 6.4, 6.2]
  },
  RO: {
    nome: 'Rondônia',
    concessionaria: 'Energisa Rondônia',
    irradiacaoMedia: 4.50,
    tarifa: 0.99,
    mensal: [4.2, 4.2, 4.3, 4.4, 4.3, 4.3, 4.6, 4.9, 4.8, 4.6, 4.4, 4.2]
  },
  RR: {
    nome: 'Roraima',
    concessionaria: 'Roraima Energia',
    irradiacaoMedia: 4.60,
    tarifa: 0.94,
    mensal: [4.8, 4.9, 4.8, 4.4, 4.1, 4.0, 4.1, 4.4, 4.8, 4.9, 4.9, 4.8]
  },
  RS: {
    nome: 'Rio Grande do Sul',
    concessionaria: 'CEEE / RGE',
    irradiacaoMedia: 4.20,
    tarifa: 0.92,
    mensal: [5.3, 4.9, 4.2, 3.5, 2.8, 2.4, 2.6, 3.3, 3.7, 4.5, 5.1, 5.5]
  },
  SC: {
    nome: 'Santa Catarina',
    concessionaria: 'Celesc',
    irradiacaoMedia: 4.10,
    tarifa: 0.85,
    mensal: [4.9, 4.7, 4.2, 3.6, 3.1, 2.7, 2.9, 3.6, 3.7, 4.2, 4.7, 5.0]
  },
  SE: {
    nome: 'Sergipe',
    concessionaria: 'Energisa Sergipe',
    irradiacaoMedia: 5.20,
    tarifa: 0.94,
    mensal: [5.6, 5.5, 5.3, 4.5, 4.5, 4.2, 4.3, 4.8, 5.3, 5.6, 5.7, 5.7]
  },
  SP: {
    nome: 'São Paulo',
    concessionaria: 'Enel SP / CPFL',
    irradiacaoMedia: 4.70,
    tarifa: 0.94,
    mensal: [5.2, 5.1, 4.7, 4.4, 3.9, 3.6, 3.8, 4.4, 4.5, 4.7, 5.0, 5.1]
  },
  TO: {
    nome: 'Tocantins',
    concessionaria: 'Energisa Tocantins',
    irradiacaoMedia: 5.00,
    tarifa: 1.01,
    mensal: [4.4, 4.4, 4.5, 4.8, 5.1, 5.3, 5.5, 5.7, 5.5, 5.0, 4.6, 4.3]
  }
}

export const MESES_NOMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

// Tipos de estruturas disponíveis
export const TIPOS_ESTRUTURA = [
  { id: 'telhado_ceramico', label: 'Telhado Cerâmico (Colonial)', custoBasePorModulo: 65 },
  { id: 'telhado_metalico', label: 'Telhado Metálico (Trapezoidal / Sanduíche)', custoBasePorModulo: 50 },
  { id: 'telhado_fibrocimento', label: 'Telhado Fibrocimento (Madeira / Aço)', custoBasePorModulo: 55 },
  { id: 'laje_plana', label: 'Laje Plana (Triângulo de Alumínio)', custoBasePorModulo: 85 },
  { id: 'solo_monoposte', label: 'Estrutura de Solo (Monoposte Aço Galvanizado)', custoBasePorModulo: 140 },
  { id: 'solo_biposte', label: 'Estrutura de Solo (Biposte Industrial)', custoBasePorModulo: 160 },
  { id: 'garagem_carport', label: 'Garagem Solar (Carport)', custoBasePorModulo: 220 }
]

// Tipos de ligação e custo de disponibilidade (Lei 14.300 / RN 1000)
export const TIPOS_LIGACAO = [
  { id: 'monofasico', label: 'Monofásico (Padrão 30 kWh/mês)', custoKwh: 30 },
  { id: 'bifasico', label: 'Bifásico (Padrão 50 kWh/mês)', custoKwh: 50 },
  { id: 'trifasico', label: 'Trifásico (Padrão 100 kWh/mês)', custoKwh: 100 }
]

// Modelos padrão de módulos
export const MODULOS_PADRAO = [
  { id: 'mod_550', nome: 'Módulo 550W Monocristalino Half-Cell', potenciaW: 550, precoUnitario: 340, areaM2: 2.58, marca: 'Tier 1' },
  { id: 'mod_580', nome: 'Módulo 580W N-Type TOPCon', potenciaW: 580, precoUnitario: 375, areaM2: 2.58, marca: 'Jinko / Canadian' },
  { id: 'mod_600', nome: 'Módulo 600W Bifacial N-Type', potenciaW: 600, precoUnitario: 410, areaM2: 2.65, marca: 'Trina / JA Solar' },
  { id: 'mod_700', nome: 'Módulo 700W HJT / TOPCon Alta Potência', potenciaW: 700, precoUnitario: 520, areaM2: 3.10, marca: 'Huasun / Risen' }
]

// Modelos padrão de Inversores
export const INVERSORES_PADRAO = [
  { id: 'inv_3k', nome: 'Inversor 3.0 kW Monofásico 220V', potenciaKw: 3.0, precoUnitario: 2600, mppt: 2, marca: 'Growatt / Deye' },
  { id: 'inv_5k', nome: 'Inversor 5.0 kW Monofásico 220V', potenciaKw: 5.0, precoUnitario: 3800, mppt: 2, marca: 'Growatt / Deye' },
  { id: 'inv_6k', nome: 'Inversor 6.0 kW Monofásico 220V', potenciaKw: 6.0, precoUnitario: 4300, mppt: 2, marca: 'Solis / Sofar' },
  { id: 'inv_8k', nome: 'Inversor 8.0 kW Monofásico/Trifásico', potenciaKw: 8.0, precoUnitario: 5400, mppt: 2, marca: 'Deye / Growatt' },
  { id: 'inv_10k_tri', nome: 'Inversor 10.0 kW Trifásico 380V/220V', potenciaKw: 10.0, precoUnitario: 6800, mppt: 2, marca: 'Huawei / Sungrow' },
  { id: 'inv_15k_tri', nome: 'Inversor 15.0 kW Trifásico 380V', potenciaKw: 15.0, precoUnitario: 8900, mppt: 2, marca: 'Huawei / Sungrow' },
  { id: 'inv_25k_tri', nome: 'Inversor 25.0 kW Trifásico 380V', potenciaKw: 25.0, precoUnitario: 12500, mppt: 3, marca: 'Sungrow / Deye' },
  { id: 'inv_50k_tri', nome: 'Inversor 50.0 kW Trifásico 380V', potenciaKw: 50.0, precoUnitario: 21000, mppt: 4, marca: 'Huawei / Sungrow' },
  { id: 'inv_75k_tri', nome: 'Inversor 75.0 kW Trifásico 380V', potenciaKw: 75.0, precoUnitario: 28000, mppt: 6, marca: 'Solis / Sungrow' }
]

// Itens padrão de Material Elétrico CA Avulso
export const MATERIAIS_CA_DEFAULT = [
  { id: 'ca_cabos', nome: 'Cabos de Potência CA (Cobre Flexível 750V/1kV)', unidade: 'metros', qtd: 25, valorUnitario: 18.5, detalhe: 'Bitola 10mm² a 16mm²' },
  { id: 'ca_disjuntor', nome: 'Disjuntor Termomagnético Geral CA', unidade: 'unidade', qtd: 1, valorUnitario: 145.0, detalhe: 'Curva C - Bipolar/Tripolar conforme rede' },
  { id: 'ca_dps', nome: 'DPS CA Classe II (Dispositivo contra Surtos)', unidade: 'unidade', qtd: 3, valorUnitario: 75.0, detalhe: 'Clamper / Schneider 275V 45kA' },
  { id: 'ca_quadro', nome: 'Quadro de Distribuição / Proteção CA (QGBT)', unidade: 'unidade', qtd: 1, valorUnitario: 180.0, detalhe: 'Caixa de sobrepor DIN IP65 c/ barramento' },
  { id: 'ca_eletrodutos', nome: 'Eletrodutos, Conexões, Abraçadeiras e Curvas', unidade: 'kit', qtd: 1, valorUnitario: 320.0, detalhe: 'PVC Antichama / Rígido c/ conexões' },
  { id: 'ca_fixadores', nome: 'Parafusos, Buchas, Terminais Ilhós e Insumos', unidade: 'kit', qtd: 1, valorUnitario: 160.0, detalhe: 'Terminais de compressão, anilhas e fitas' }
]

// Percentual de cobrança do Fio B pelo ano de transição (Lei 14.300)
export const REGRAS_TRANSICAO_FIO_B = [
  { ano: 2023, percentual: 15 },
  { ano: 2024, percentual: 30 },
  { ano: 2025, percentual: 45 },
  { ano: 2026, percentual: 60, atual: true },
  { ano: 2027, percentual: 75 },
  { ano: 2028, percentual: 90 },
  { ano: 2029, percentual: 100 }
]

// Perfis típicos de simultaneidade (autoconsumo instantâneo)
export const PERFIS_SIMULTANEIDADE = [
  { id: 'res_baixo', nome: 'Residencial Baixo', detalhe: 'Moradores fora de casa durante o dia', valor: 25 },
  { id: 'res_medio', nome: 'Residencial Médio', detalhe: 'Home office, ar-condicionado e geladeiras', valor: 40 },
  { id: 'comercial', nome: 'Comercial', detalhe: 'Escritórios, clínicas e lojas diurnas', valor: 65 },
  { id: 'industrial', nome: 'Industrial / Produtivo', detalhe: 'Maquinários e cargas ativas durante o dia', valor: 85 }
]

// Formatação monetária BRL
export function formatCurrency(value) {
  if (value === undefined || value === null || isNaN(value)) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

// Formatação de números gerais
export function formatNumber(value, decimals = 2) {
  if (value === undefined || value === null || isNaN(value)) return '0'
  return Number(value).toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}
