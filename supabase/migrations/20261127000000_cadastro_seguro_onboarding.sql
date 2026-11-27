-- Cadastro seguro + onboarding automático (contrato, 1º boleto, recorrência).

-- 1) O navegador não grava mais em companies no cadastro. Os dados vêm em
--    raw_user_meta_data->'cadastro' e este gatilho cria ou vincula a empresa.
create or replace function public.cadastro_do_usuario()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  d jsonb := new.raw_user_meta_data -> 'cadastro';
  doc text;
  tipo text;
  atual companies%rowtype;
  txt text;
begin
  if d is null then return new; end if;
  doc := regexp_replace(coalesce(d->>'cnpj', ''), '\D', '', 'g');
  if length(doc) < 11 then raise exception 'CADASTRO_DOCUMENTO_INVALIDO'; end if;
  tipo := case when d->>'user_type' = 'cliente' then 'cliente' else 'integrador' end;

  select * into atual from companies where regexp_replace(cnpj, '\D', '', 'g') = doc limit 1;
  if found then
    if atual.auth_user_id is not null then raise exception 'CADASTRO_CNPJ_COM_LOGIN'; end if;
    if atual.email is not null and btrim(atual.email) <> '' and lower(btrim(atual.email)) <> lower(new.email) then
      raise exception 'CADASTRO_EMAIL_DIVERGENTE';
    end if;
    update companies set
      auth_user_id = new.id,
      cnpj = doc,
      email = new.email,
      razao_social = coalesce(nullif(d->>'razao_social', ''), razao_social),
      nome_fantasia = coalesce(nullif(d->>'nome_fantasia', ''), nome_fantasia),
      telefone = coalesce(nullif(d->>'telefone', ''), telefone),
      contato_nome = coalesce(nullif(d->>'contato_nome', ''), contato_nome),
      cep = coalesce(nullif(d->>'cep', ''), cep),
      logradouro = coalesce(nullif(d->>'logradouro', ''), logradouro),
      numero = coalesce(nullif(d->>'numero', ''), numero),
      bairro = coalesce(nullif(d->>'bairro', ''), bairro),
      municipio = coalesce(nullif(d->>'municipio', ''), municipio),
      uf = coalesce(nullif(d->>'uf', ''), uf)
    where id = atual.id;
  else
    insert into companies (cnpj, auth_user_id, user_type, email, razao_social, nome_fantasia, telefone, contato_nome,
                           cep, logradouro, numero, bairro, municipio, uf)
    values (doc, new.id, tipo, new.email, nullif(d->>'razao_social', ''), nullif(d->>'nome_fantasia', ''),
            nullif(d->>'telefone', ''), nullif(d->>'contato_nome', ''), nullif(d->>'cep', ''), nullif(d->>'logradouro', ''),
            nullif(d->>'numero', ''), nullif(d->>'bairro', ''), nullif(d->>'municipio', ''), nullif(d->>'uf', ''));
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_cadastro on auth.users;
create trigger on_auth_user_cadastro after insert on auth.users
  for each row execute function public.cadastro_do_usuario();

-- Pré-checagem do formulário: sem expor a linha inteira.
create or replace function public.cnpj_situacao(p_cnpj text, p_email text default null)
returns jsonb language plpgsql security definer set search_path = public stable as $$
declare
  doc text := regexp_replace(coalesce(p_cnpj, ''), '\D', '', 'g');
  c companies%rowtype;
  m text;
begin
  select * into c from companies where regexp_replace(cnpj, '\D', '', 'g') = doc limit 1;
  if not found then return jsonb_build_object('situacao', 'livre'); end if;
  if c.auth_user_id is not null then return jsonb_build_object('situacao', 'tem_login'); end if;
  if c.email is not null and btrim(c.email) <> '' then
    m := left(c.email, 2) || '•••' || substr(c.email, position('@' in c.email));
    if p_email is not null and lower(btrim(c.email)) <> lower(btrim(p_email)) then
      return jsonb_build_object('situacao', 'email_divergente', 'email', m);
    end if;
    return jsonb_build_object('situacao', 'vincular', 'email', m);
  end if;
  return jsonb_build_object('situacao', 'vincular');
end $$;
revoke all on function public.cnpj_situacao(text, text) from public;
grant execute on function public.cnpj_situacao(text, text) to anon, authenticated;
revoke all on function public.cadastro_do_usuario() from public, anon, authenticated;

-- 2) Fecha as brechas: ninguém insere empresas pelo navegador nem altera empresas sem dono.
drop policy if exists "Allow public inserts" on public.companies;
drop policy if exists "Allow update if orphan or owner" on public.companies;
create policy "Dono atualiza a própria empresa" on public.companies for update to authenticated
  using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());
create policy "Equipe insere companies" on public.companies for insert to authenticated
  with check (public.is_staff());

-- Trava de perfis também na inserção e em mais campos.
create or replace function public.companies_protect() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;  -- service role / gatilhos do servidor
  if tg_op = 'INSERT' then
    if (new.is_admin or new.user_type in ('superadmin', 'mediador')) and not public.is_root() then
      raise exception 'Apenas o superadmin pode criar perfis de administração.';
    end if;
    return new;
  end if;
  if (new.is_admin is distinct from old.is_admin) or (new.user_type is distinct from old.user_type) then
    if not public.is_root() then
      raise exception 'Apenas o superadmin pode alterar perfis de administração.';
    end if;
  end if;
  if not public.is_staff() and (
       new.status_associado is distinct from old.status_associado
    or new.plano_id is distinct from old.plano_id
    or new.matricula is distinct from old.matricula
    or new.data_adesao is distinct from old.data_adesao
    or new.observacoes_crm is distinct from old.observacoes_crm
    or new.crm_habilitado is distinct from old.crm_habilitado
    or new.cnpj is distinct from old.cnpj
    or new.auth_user_id is distinct from old.auth_user_id) then
    raise exception 'Somente a equipe da FPGD altera dados de associação.';
  end if;
  return new;
end $$;
drop trigger if exists tr_companies_protect_insert on public.companies;
create trigger tr_companies_protect_insert before insert on public.companies
  for each row execute function public.companies_protect();

-- 3) Automação: 1º boleto (adesão) separado da recorrência; marca de envio do boleto.
alter table public.associado_financeiro add column if not exists adesao_payment_id text;
alter table public.associado_financeiro add column if not exists onboarding_em timestamptz;
alter table public.cobrancas add column if not exists notificado_em timestamptz;
