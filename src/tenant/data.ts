import { callFn } from '../crm/data';

export type Etapa = 'novo' | 'contato' | 'visita' | 'proposta' | 'negociacao' | 'ganho' | 'perdido';

export const ETAPAS: { id: Etapa; label: string; hint: string; color: string; bg: string }[] = [
  { id: 'novo', label: 'Novo', hint: 'Chegou agora', color: 'text-et-novo', bg: 'bg-et-novo' },
  { id: 'contato', label: 'Em contato', hint: 'Conversa iniciada', color: 'text-et-contato', bg: 'bg-et-contato' },
  { id: 'visita', label: 'Visita técnica', hint: 'Levantamento no local', color: 'text-et-visita', bg: 'bg-et-visita' },
  { id: 'proposta', label: 'Proposta', hint: 'Proposta enviada', color: 'text-et-proposta', bg: 'bg-et-proposta' },
  { id: 'negociacao', label: 'Negociação', hint: 'Ajustando condições', color: 'text-et-negociacao', bg: 'bg-et-negociacao' },
  { id: 'ganho', label: 'Fechado', hint: 'Contrato fechado', color: 'text-et-ganho', bg: 'bg-et-ganho' },
  { id: 'perdido', label: 'Perdido', hint: 'Não avançou', color: 'text-et-perdido', bg: 'bg-et-perdido' },
];
export const etapaMeta = (e: Etapa) => ETAPAS.find((x) => x.id === e) || ETAPAS[0];

export interface Cliente {
  id: string;
  company_id: string;
  nome: string;
  documento: string | null;
  email: string | null;
  telefone: string | null;
  cep: string | null;
  cidade: string | null;
  uf: string | null;
  endereco: string | null;
  consumo_kwh: number | null;
  tipo_ligacao: string | null;
  concessionaria: string | null;
  etapa: Etapa;
  valor_estimado: number | null;
  potencia_kwp: number | null;
  origem: string | null;
  observacoes: string | null;
  motivo_perda: string | null;
  created_at: string;
  updated_at: string;
}

export type PropostaStatus = 'rascunho' | 'enviada' | 'aceita' | 'recusada';
export interface Proposta {
  id: string;
  company_id: string;
  cliente_id: string | null;
  titulo: string;
  dados: Record<string, unknown>;
  potencia_kwp: number | null;
  qtd_modulos: number | null;
  geracao_mensal_kwh: number | null;
  custo_total: number | null;
  preco_venda: number | null;
  economia_mensal: number | null;
  payback_anos: number | null;
  status: PropostaStatus;
  created_at: string;
  updated_at: string;
}
export const PROPOSTA_STATUS: Record<PropostaStatus, { label: string; cls: string }> = {
  rascunho: { label: 'Rascunho', cls: 'text-fg-3' },
  enviada: { label: 'Enviada', cls: 'text-st-inadimplente' },
  aceita: { label: 'Aceita', cls: 'text-st-ativo' },
  recusada: { label: 'Recusada', cls: 'text-st-cancelado' },
};

export interface ContratoCliente {
  id: string;
  cliente_id: string;
  proposta_id: string | null;
  conteudo: string;
  status: 'rascunho' | 'enviado' | 'assinado' | 'recusado' | 'cancelado';
  enviado_em: string | null;
  assinado_em: string | null;
  created_at: string;
}

export interface CobrancaCliente {
  id: string;
  cliente_id: string | null;
  asaas_payment_id: string | null;
  descricao: string | null;
  valor: number;
  forma: string | null;
  status: string | null;
  vencimento: string | null;
  pago_em: string | null;
  invoice_url: string | null;
}

export interface EventoCliente { id: string; tipo: string; descricao: string; created_at: string }

export const CLIENTE_COLS =
  'id, company_id, nome, documento, email, telefone, cep, cidade, uf, endereco, consumo_kwh, tipo_ligacao, concessionaria, etapa, valor_estimado, potencia_kwp, origem, observacoes, motivo_perda, created_at, updated_at';

export const ORIGENS = ['Indicação', 'Instagram', 'Google', 'WhatsApp', 'Site', 'Feira/evento', 'Porta a porta', 'Outro'];

/** Chama a Edge Function do CRM do associado. */
export const tenantFn = <T = any>(companyId: string, action: string, body: Record<string, unknown> = {}) =>
  callFn<T>('tenant-crm', { action, company_id: companyId, ...body });

export const formatDoc = (v?: string | null) => {
  const d = (v || '').replace(/\D/g, '');
  if (d.length <= 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (_, a, b, c, e) => `${a}.${b}.${c}${e ? `-${e}` : ''}`);
  return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, (_, a, b, c, e, f) => `${a}.${b}.${c}/${e}${f ? `-${f}` : ''}`);
};

export const kwp = (v?: number | null) =>
  v == null ? '—' : `${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kWp`;

// ---------- Contrato do associado com o cliente ----------
export const DEFAULT_CONTRATO_CLIENTE = `CONTRATO DE FORNECIMENTO E INSTALAÇÃO DE SISTEMA FOTOVOLTAICO

CONTRATADA: {{empresa}}, inscrita no CNPJ {{empresa_cnpj}}.
CONTRATANTE: {{cliente}}, CPF/CNPJ {{cliente_documento}}, residente em {{cliente_endereco}}, {{cliente_cidade}}/{{cliente_uf}}.

CLÁUSULA 1 — OBJETO
Fornecimento, instalação e homologação junto à {{concessionaria}} de um sistema fotovoltaico de {{potencia_kwp}} kWp, composto por {{qtd_modulos}} módulos, com geração média estimada de {{geracao_mensal}} kWh/mês.

CLÁUSULA 2 — PREÇO E PAGAMENTO
O valor total é de {{valor_total}}, pago conforme as condições acordadas entre as partes e as cobranças emitidas pela CONTRATADA.

CLÁUSULA 3 — PRAZOS
A instalação será concluída em até 30 dias após a aprovação do projeto pela distribuidora, salvo atrasos causados por terceiros.

CLÁUSULA 4 — GARANTIAS
Os equipamentos têm a garantia dos respectivos fabricantes. A instalação tem garantia de 12 meses a partir da conclusão.

CLÁUSULA 5 — FORO
Fica eleito o foro da comarca de {{cliente_cidade}}/{{cliente_uf}}.

{{cidade_empresa}}, {{data}}.`;

export const CONTRATO_CLIENTE_VARS = [
  'empresa', 'empresa_cnpj', 'cliente', 'cliente_documento', 'cliente_endereco', 'cliente_cidade', 'cliente_uf',
  'concessionaria', 'potencia_kwp', 'qtd_modulos', 'geracao_mensal', 'valor_total', 'cidade_empresa', 'data',
];

export function renderTemplate(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
}
