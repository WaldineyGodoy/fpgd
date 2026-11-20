-- Aplicada no projeto ayhbafvvnbwrnfqglklp (migration crm_admins_settings_pagamentos)

alter table public.companies add column is_admin boolean not null default false;

create or replace function public.is_root() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from companies where auth_user_id = auth.uid() and user_type = 'superadmin');
$$;
create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from companies where auth_user_id = auth.uid() and (user_type in ('superadmin','mediador') or is_admin));
$$;
create or replace function public.is_superadmin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from companies where auth_user_id = auth.uid() and (user_type = 'superadmin' or is_admin));
$$;
revoke all on function public.is_root() from public, anon;
grant execute on function public.is_root() to authenticated;

create or replace function public.companies_protect() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;
  if (new.is_admin is distinct from old.is_admin)
     or (new.user_type is distinct from old.user_type and new.user_type in ('superadmin','mediador')) then
    if not public.is_root() then
      raise exception 'Apenas o superadmin pode alterar perfis de administração.';
    end if;
  end if;
  if not public.is_staff() and (
       new.status_associado is distinct from old.status_associado
    or new.plano_id is distinct from old.plano_id
    or new.matricula is distinct from old.matricula
    or new.data_adesao is distinct from old.data_adesao
    or new.observacoes_crm is distinct from old.observacoes_crm) then
    raise exception 'Somente a equipe da FPGD altera dados de associação.';
  end if;
  return new;
end $$;
create trigger tr_companies_protect before update on public.companies
  for each row execute function public.companies_protect();

create table public.app_settings (
  chave text primary key,
  valor jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.app_settings enable row level security;
create policy "Configurações visíveis" on public.app_settings for select to anon, authenticated using (true);
create policy "Gestão altera configurações" on public.app_settings for all to authenticated
  using (public.is_superadmin()) with check (public.is_superadmin());
insert into public.app_settings (chave, valor) values ('tickets', '{"enabled": false}');

create table public.cobrancas (
  id uuid primary key default gen_random_uuid(),
  asaas_payment_id text unique,
  company_id uuid references public.companies(id) on delete set null,
  asaas_customer_id text,
  descricao text,
  valor numeric(10,2) not null,
  valor_liquido numeric(10,2),
  forma text,
  status text not null,
  vencimento date not null,
  pago_em date,
  invoice_url text,
  origem text not null default 'asaas' check (origem in ('asaas','manual')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.cobrancas (vencimento desc);
create index on public.cobrancas (company_id);
alter table public.cobrancas enable row level security;
create policy "Equipe gerencia cobranças" on public.cobrancas for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "Associado vê suas cobranças" on public.cobrancas for select to authenticated
  using (company_id in (select id from public.companies where auth_user_id = auth.uid()));
revoke all on public.cobrancas from anon;
