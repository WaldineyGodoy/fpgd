-- Gestão de acessos: empresas + dados do login (só superadmin).
create or replace function public.acessos_lista()
returns table (
  id uuid, nome text, razao_social text, cnpj text, matricula int, user_type text, is_admin boolean,
  status_associado text, email text, telefone text, tem_login boolean, login_email text,
  email_confirmado_em timestamptz, ultimo_acesso_em timestamptz, login_criado_em timestamptz
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_root() then raise exception 'Apenas o superadmin vê a gestão de acessos.'; end if;
  return query
    select c.id, coalesce(c.nome_fantasia, c.razao_social), c.razao_social, c.cnpj, c.matricula, c.user_type, c.is_admin,
           c.status_associado, c.email, c.telefone, c.auth_user_id is not null, u.email::text,
           u.email_confirmed_at, u.last_sign_in_at, u.created_at
    from companies c left join auth.users u on u.id = c.auth_user_id
    order by (c.user_type = 'superadmin') desc, c.is_admin desc, (c.user_type = 'mediador') desc, (c.auth_user_id is not null) desc, c.matricula nulls last;
end $$;
revoke all on function public.acessos_lista() from public, anon;
grant execute on function public.acessos_lista() to authenticated;

-- Empresas promovidas a admin a pedido da gestão (2026-11-27).
update public.companies set is_admin = true
where regexp_replace(cnpj, '\D', '', 'g') in ('62030370000129', '42687209000115', '53190689000120') and user_type = 'integrador';
