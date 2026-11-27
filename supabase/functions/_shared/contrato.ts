// Modelo padrão e preenchimento do contrato de adesão (espelho de src/crm/data.ts).
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

As partes assinam eletronicamente este contrato, por meio da plataforma Documenso, em {{data}}.`;

const CICLO: Record<string, string> = { MONTHLY: 'mensal', QUARTERLY: 'trimestral', SEMIANNUALLY: 'semestral', YEARLY: 'anual' };
const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtDoc = (v: string) => {
  const d = (v || '').replace(/\D/g, '');
  if (d.length === 14) return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  return v || '';
};
const fmtFone = (v: string | null) => {
  const d = (v || '').replace(/\D/g, '');
  if (d.length === 11) return d.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  if (d.length === 10) return d.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  return v || '';
};

export function renderContrato(template: string, a: Record<string, any>, plano: Record<string, any> | null) {
  const endereco = [a.logradouro, a.numero, a.bairro, a.municipio && `${a.municipio}/${a.uf ?? ''}`, a.cep && `CEP ${a.cep}`]
    .filter(Boolean).join(', ');
  const vars: Record<string, string> = {
    matricula: a.matricula ? `FPGD ${String(a.matricula).padStart(4, '0')}` : '—',
    razao_social: a.razao_social || a.nome_fantasia || 'Associado',
    nome_fantasia: a.nome_fantasia || a.razao_social || '',
    cnpj: fmtDoc(a.cnpj),
    endereco: endereco || 'endereço não informado',
    contato_nome: a.contato_nome || 'seu representante legal',
    email: a.email || 'não informado',
    telefone: fmtFone(a.telefone) || 'não informado',
    plano_nome: plano?.nome || '[plano]',
    plano_valor: plano ? brl(Number(plano.valor)) : '[valor]',
    plano_ciclo: plano ? CICLO[plano.ciclo] || plano.ciclo : '[ciclo]',
    dia_vencimento: plano ? String(plano.dia_vencimento) : '[dia]',
    data: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Fortaleza' }),
  };
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
}
