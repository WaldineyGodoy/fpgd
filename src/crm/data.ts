import { supabase } from '../supabaseClient';

export type StatusAssociado = 'inscrito' | 'ativo' | 'inadimplente' | 'inativo' | 'cancelado';

export const STATUS: { id: StatusAssociado; label: string; hint: string }[] = [
  { id: 'inscrito', label: 'Inscritos', hint: 'Cadastrados, sem contrato ou pagamento' },
  { id: 'ativo', label: 'Ativos', hint: 'Contrato assinado e mensalidade em dia' },
  { id: 'inadimplente', label: 'Inadimplentes', hint: 'Mensalidade vencida' },
  { id: 'inativo', label: 'Inativos', hint: 'Pausados, sem cobrança' },
  { id: 'cancelado', label: 'Cancelados', hint: 'Saíram da Frente' },
];
export const statusLabel = (s: StatusAssociado) =>
  ({ inscrito: 'Inscrito', ativo: 'Ativo', inadimplente: 'Inadimplente', inativo: 'Inativo', cancelado: 'Cancelado' })[s];

export interface Plano {
  id: string;
  nome: string;
  descricao: string | null;
  valor: number;
  ciclo: 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
  dia_vencimento: number;
  ativo: boolean;
}
export const CICLO_LABEL: Record<Plano['ciclo'], string> = {
  MONTHLY: 'mensal', QUARTERLY: 'trimestral', SEMIANNUALLY: 'semestral', YEARLY: 'anual',
};

export interface Associado {
  id: string;
  cnpj: string;
  razao_social: string | null;
  nome_fantasia: string | null;
  email: string | null;
  telefone: string | null;
  contato_nome: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  bairro: string | null;
  municipio: string | null;
  uf: string | null;
  created_at: string;
  status_associado: StatusAssociado;
  plano_id: string | null;
  matricula: number | null;
  data_adesao: string | null;
  status_alterado_em: string | null;
  observacoes_crm: string | null;
  is_admin: boolean;
  crm_habilitado: boolean;
}

export interface Contrato {
  id: string;
  company_id: string;
  plano_id: string | null;
  status: 'rascunho' | 'enviado' | 'assinado' | 'recusado' | 'cancelado';
  conteudo: string;
  link_assinatura: string | null;
  enviado_whatsapp: boolean;
  enviado_email: boolean;
  enviado_em: string | null;
  assinado_em: string | null;
  created_at: string;
}

export interface Financeiro {
  company_id: string;
  asaas_customer_id: string | null;
  asaas_subscription_id: string | null;
  valor: number | null;
  proximo_vencimento: string | null;
  status_assinatura: string | null;
  ultimo_pagamento_status: string | null;
  ultimo_pagamento_em: string | null;
  invoice_url: string | null;
}

export interface Evento {
  id: string;
  tipo: string;
  descricao: string;
  created_at: string;
}

export const ASSOCIADO_COLS =
  'id, cnpj, razao_social, nome_fantasia, email, telefone, contato_nome, cep, logradouro, numero, bairro, municipio, uf, created_at, status_associado, plano_id, matricula, data_adesao, status_alterado_em, observacoes_crm, is_admin, crm_habilitado';

export const nomeAssociado = (a: Pick<Associado, 'nome_fantasia' | 'razao_social'>) =>
  a.nome_fantasia || a.razao_social || 'Sem nome';

export const matriculaLabel = (n: number | null) => (n ? `FPGD ${String(n).padStart(4, '0')}` : 'Sem matrícula');

export const brl = (v: number | null | undefined) =>
  v == null ? '—' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const dataBR = (d: string | null | undefined) =>
  d ? new Date(d.length === 10 ? `${d}T12:00:00` : d).toLocaleDateString('pt-BR') : '—';

export function formatCnpj(v: string) {
  const d = (v || '').replace(/\D/g, '');
  if (d.length === 14) return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  if (d.length === 11) return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  return v;
}

export function formatPhone(v: string | null) {
  const d = (v || '').replace(/\D/g, '');
  if (d.length === 11) return d.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  if (d.length === 10) return d.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  return v || '';
}

/** Chama uma Edge Function e devolve a mensagem de erro do servidor em vez do genérico. */
export async function callFn<T = any>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    let msg = error.message;
    try {
      const ctx = (error as any).context as Response | undefined;
      const j = ctx ? await ctx.json() : null;
      if (j?.error) msg = j.error;
    } catch { /* mantém a mensagem original */ }
    throw new Error(msg);
  }
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as T;
}

export const ASAAS_STATUS: Record<string, string> = {
  PENDING: 'Aguardando pagamento', RECEIVED: 'Pago', CONFIRMED: 'Pago', RECEIVED_IN_CASH: 'Pago em dinheiro',
  OVERDUE: 'Vencida', REFUNDED: 'Estornada', ACTIVE: 'Ativa', INACTIVE: 'Cancelada', EXPIRED: 'Expirada',
};

export const DEFAULT_CONTRATO = `CONTRATO DE ADESÃO À FRENTE POTIGUAR DE GERAÇÃO DISTRIBUÍDA — FPGD RN

Matrícula: {{matricula}}

CONTRATANTE (ASSOCIADO): {{razao_social}}, nome fantasia {{nome_fantasia}}, inscrita no CNPJ sob o nº {{cnpj}}, com sede em {{endereco}}, neste ato representada por {{contato_nome}}, e-mail {{email}}, telefone {{telefone}}.

CONTRATADA: FRENTE POTIGUAR DE GERAÇÃO DISTRIBUÍDA — FPGD RN, entidade sem fins lucrativos com atuação em Natal/RN.

CLÁUSULA 1 — DO OBJETO
1.1. O presente contrato formaliza a adesão do ASSOCIADO à FPGD RN, que reúne empresas integradoras e instaladoras de sistemas de energia solar do Rio Grande do Norte para representação coletiva do setor perante a distribuidora e órgãos reguladores.

CLÁUSULA 2 — DO PLANO E DA MENSALIDADE
2.1. O ASSOCIADO adere ao plano {{plano_nome}}, com contribuição {{plano_ciclo}} de {{plano_valor}}, com vencimento todo dia {{dia_vencimento}}.
2.2. A cobrança será emitida por meio da plataforma Asaas, por boleto, Pix ou cartão, conforme disponível.
2.3. O atraso superior a 30 (trinta) dias poderá suspender os benefícios da associação até a regularização.

CLÁUSULA 3 — DOS BENEFÍCIOS
3.1. Participar da representação coletiva da FPGD RN perante a Cosern e demais instâncias.
3.2. Registrar e acompanhar tickets de reclamação na plataforma da FPGD RN.
3.3. Receber informativos técnicos e regulatórios e participar das reuniões e grupos da Frente.

CLÁUSULA 4 — DAS OBRIGAÇÕES DO ASSOCIADO
4.1. Manter seus dados cadastrais atualizados.
4.2. Efetuar o pagamento das contribuições nas datas de vencimento.
4.3. Zelar pelo nome da FPGD RN e respeitar as deliberações coletivas.

CLÁUSULA 5 — DA VIGÊNCIA E DO CANCELAMENTO
5.1. Este contrato vigora por prazo indeterminado a partir da assinatura.
5.2. Qualquer das partes pode encerrá-lo mediante aviso por escrito com 30 (trinta) dias de antecedência, sem multa, ficando devidas as contribuições vencidas até a data do encerramento.

CLÁUSULA 6 — DA PROTEÇÃO DE DADOS
6.1. Os dados do ASSOCIADO serão tratados exclusivamente para a gestão da associação, cobrança e comunicação, nos termos da Lei nº 13.709/2018 (LGPD).

CLÁUSULA 7 — DO FORO
7.1. Fica eleito o foro da Comarca de Natal/RN para dirimir quaisquer questões oriundas deste contrato.

As partes assinam eletronicamente este contrato, por meio da plataforma Autentique, em {{data}}.`;

export const CONTRATO_VARS = [
  'matricula', 'razao_social', 'nome_fantasia', 'cnpj', 'endereco', 'contato_nome', 'email', 'telefone',
  'plano_nome', 'plano_valor', 'plano_ciclo', 'dia_vencimento', 'data',
];

export function renderContrato(template: string, a: Associado, plano: Plano | null) {
  const endereco = [a.logradouro, a.numero, a.bairro, a.municipio && `${a.municipio}/${a.uf ?? ''}`, a.cep && `CEP ${a.cep}`]
    .filter(Boolean).join(', ');
  const vars: Record<string, string> = {
    matricula: matriculaLabel(a.matricula),
    razao_social: a.razao_social || nomeAssociado(a),
    nome_fantasia: a.nome_fantasia || a.razao_social || '',
    cnpj: formatCnpj(a.cnpj),
    endereco: endereco || 'endereço não informado',
    contato_nome: a.contato_nome || 'seu representante legal',
    email: a.email || 'não informado',
    telefone: formatPhone(a.telefone) || 'não informado',
    plano_nome: plano?.nome || '[plano]',
    plano_valor: plano ? brl(Number(plano.valor)) : '[valor]',
    plano_ciclo: plano ? CICLO_LABEL[plano.ciclo] : '[ciclo]',
    dia_vencimento: plano ? String(plano.dia_vencimento) : '[dia]',
    data: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }),
  };
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
}
