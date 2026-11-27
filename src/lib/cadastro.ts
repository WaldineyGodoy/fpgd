import { supabase } from '../supabaseClient';

export type SituacaoCnpj = { situacao: 'livre' | 'vincular' | 'tem_login' | 'email_divergente'; email?: string };

/** Situação do CNPJ na base, sem expor a linha (função no servidor). */
export async function situacaoCnpj(cnpj: string, email?: string): Promise<SituacaoCnpj> {
  const { data, error } = await supabase.rpc('cnpj_situacao', { p_cnpj: cnpj, p_email: email ?? null });
  if (error) throw error;
  return data as SituacaoCnpj;
}

export function mensagemSituacao(s: SituacaoCnpj): string | null {
  if (s.situacao === 'tem_login') return 'Este CNPJ já tem login. Entre com o e-mail cadastrado ou use "Esqueci a senha".';
  if (s.situacao === 'email_divergente') return `Este CNPJ já está na base da FPGD com outro e-mail (${s.email}). Use esse e-mail no cadastro ou fale com a FPGD para atualizar.`;
  return null;
}

/**
 * Cria o login. A empresa é criada ou vinculada no servidor (gatilho em auth.users),
 * com perfil e status definidos lá, nunca pelo navegador.
 */
export async function cadastrar(email: string, password: string, cadastro: Record<string, unknown>) {
  const pre = await situacaoCnpj(String(cadastro.cnpj || ''), email);
  const msg = mensagemSituacao(pre);
  if (msg) throw new Error(msg);
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: {
      emailRedirectTo: `${window.location.origin}/`,
      data: { nome: cadastro.nome_fantasia || cadastro.razao_social, user_type: cadastro.user_type, cadastro },
    },
  });
  if (error) {
    if (/database error/i.test(error.message)) throw new Error('Não foi possível vincular este CNPJ ao seu e-mail. Fale com a FPGD.');
    if (/already registered/i.test(error.message)) throw new Error('Este e-mail já tem login. Entre ou use "Esqueci a senha".');
    throw error;
  }
  return data;
}
