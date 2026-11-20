-- Aplicada no projeto ayhbafvvnbwrnfqglklp em 2026-11-19 (migrations crm_associados + crm_revoke_anon)

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from companies where auth_user_id = auth.uid() and user_type in ('superadmin','mediador'));
$$;
create or replace function public.is_superadmin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from companies where auth_user_id = auth.uid() and user_type = 'superadmin');
$$;
revoke all on function public.is_staff() from public, anon;
revoke all on function public.is_superadmin() from public, anon;
grant execute on function public.is_staff() to authenticated;
grant execute on function public.is_superadmin() to authenticated;

create table public.planos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  valor numeric(10,2) not null check (valor >= 0),
  ciclo text not null default 'MONTHLY' check (ciclo in ('MONTHLY','QUARTERLY','SEMIANNUALLY','YEARLY')),
  dia_vencimento int not null default 10 check (dia_vencimento between 1 and 28),
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.planos enable row level security;
create policy "Planos visíveis a autenticados" on public.planos for select to authenticated using (true);
create policy "Superadmin gerencia planos" on public.planos for all to authenticated using (public.is_superadmin()) with check (public.is_superadmin());

create sequence if not exists public.companies_matricula_seq start 1;
alter table public.companies
  add column status_associado text not null default 'inscrito'
    check (status_associado in ('inscrito','ativo','inadimplente','inativo','cancelado')),
  add column plano_id uuid references public.planos(id) on delete set null,
  add column matricula int unique,
  add column data_adesao date,
  add column status_alterado_em timestamptz default now(),
  add column observacoes_crm text;

create or replace function public.companies_matricula() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.user_type = 'integrador' and new.matricula is null then
    new.matricula := nextval('public.companies_matricula_seq');
  end if;
  if tg_op = 'UPDATE' and new.status_associado is distinct from old.status_associado then
    new.status_alterado_em := now();
  end if;
  return new;
end $$;
create trigger tr_companies_matricula before insert or update on public.companies
  for each row execute function public.companies_matricula();

with ordered as (
  select id, row_number() over (order by created_at) rn from public.companies where user_type = 'integrador'
)
update public.companies c set matricula = o.rn from ordered o where c.id = o.id;
select setval('public.companies_matricula_seq', coalesce((select max(matricula) from public.companies), 0) + 1, false);

create policy "Equipe atualiza companies" on public.companies for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

create table public.contratos (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  plano_id uuid references public.planos(id) on delete set null,
  status text not null default 'rascunho' check (status in ('rascunho','enviado','assinado','recusado','cancelado')),
  conteudo text not null,
  autentique_document_id text,
  link_assinatura text,
  enviado_whatsapp boolean not null default false,
  enviado_email boolean not null default false,
  enviado_em timestamptz,
  assinado_em timestamptz,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create index on public.contratos (company_id, created_at desc);
alter table public.contratos enable row level security;
create policy "Equipe gerencia contratos" on public.contratos for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "Associado vê seus contratos" on public.contratos for select to authenticated
  using (company_id in (select id from public.companies where auth_user_id = auth.uid()));

create table public.associado_financeiro (
  company_id uuid primary key references public.companies(id) on delete cascade,
  asaas_customer_id text,
  asaas_subscription_id text,
  valor numeric(10,2),
  proximo_vencimento date,
  status_assinatura text,
  ultimo_pagamento_status text,
  ultimo_pagamento_em timestamptz,
  invoice_url text,
  updated_at timestamptz not null default now()
);
alter table public.associado_financeiro enable row level security;
create policy "Equipe vê financeiro" on public.associado_financeiro for select to authenticated using (public.is_staff());
create policy "Associado vê seu financeiro" on public.associado_financeiro for select to authenticated
  using (company_id in (select id from public.companies where auth_user_id = auth.uid()));

create table public.crm_eventos (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  tipo text not null,
  descricao text not null,
  autor uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create index on public.crm_eventos (company_id, created_at desc);
alter table public.crm_eventos enable row level security;
create policy "Equipe gerencia eventos" on public.crm_eventos for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- Credenciais: RLS sem policies => apenas service role (Edge Functions)
create table public.crm_config (
  chave text primary key check (chave in ('autentique','evolution','resend','asaas','contrato')),
  valor jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid
);
alter table public.crm_config enable row level security;
revoke all on public.crm_config from anon, authenticated;
revoke all on public.contratos, public.associado_financeiro, public.crm_eventos, public.planos from anon;
