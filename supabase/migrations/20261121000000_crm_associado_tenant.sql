-- CRM próprio do associado (multi-tenant, white label).
-- Tenant = companies.id do integrador. Cada associado vê só os próprios dados;
-- o superadmin da FPGD entra para manutenção. Admins e mediadores não veem a carteira do associado.

alter table companies add column if not exists crm_habilitado boolean not null default false;

-- Tenant do usuário logado (id da empresa ligada ao auth.uid()).
create or replace function public.my_company_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from companies where auth_user_id = auth.uid() limit 1;
$$;

-- Pode operar o CRM deste tenant: o próprio associado (com CRM habilitado) ou o superadmin.
create or replace function public.tenant_can(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_root() or exists (
    select 1 from companies where id = cid and auth_user_id = auth.uid() and crm_habilitado
  );
$$;

-- Habilitar o CRM é decisão da FPGD (superadmin ou admin).
create or replace function public.companies_protect()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if; -- service role / backend
  if (new.is_admin is distinct from old.is_admin)
     or (new.user_type is distinct from old.user_type and new.user_type in ('superadmin','mediador')) then
    if not public.is_root() then
      raise exception 'Apenas o superadmin pode alterar perfis de administração.';
    end if;
  end if;
  if new.crm_habilitado is distinct from old.crm_habilitado and not public.is_superadmin() then
    raise exception 'Somente superadmin ou admin da FPGD habilita o CRM do associado.';
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

-- Credenciais e configuração white label do associado. Sem policies: só Edge Function (service role).
create table if not exists tenant_config (
  company_id uuid not null references companies(id) on delete cascade,
  chave text not null,
  valor jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid,
  primary key (company_id, chave)
);
alter table tenant_config enable row level security;

-- Clientes / oportunidades do associado.
create table if not exists tenant_clientes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  nome text not null,
  documento text,
  email text,
  telefone text,
  cep text,
  cidade text,
  uf text,
  endereco text,
  consumo_kwh numeric,
  tipo_ligacao text,
  concessionaria text,
  etapa text not null default 'novo'
    check (etapa in ('novo','contato','visita','proposta','negociacao','ganho','perdido')),
  valor_estimado numeric,
  potencia_kwp numeric,
  origem text,
  observacoes text,
  motivo_perda text,
  ordem double precision not null default 0,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tenant_clientes_company_idx on tenant_clientes(company_id, etapa);

-- Propostas: retrato completo do dimensionamento/precificação no momento em que foi salva.
create table if not exists tenant_propostas (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  cliente_id uuid references tenant_clientes(id) on delete set null,
  titulo text not null,
  dados jsonb not null default '{}'::jsonb,
  potencia_kwp numeric,
  qtd_modulos int,
  geracao_mensal_kwh numeric,
  custo_total numeric,
  preco_venda numeric,
  economia_mensal numeric,
  payback_anos numeric,
  status text not null default 'rascunho' check (status in ('rascunho','enviada','aceita','recusada')),
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tenant_propostas_company_idx on tenant_propostas(company_id, cliente_id);

-- Contratos do associado com o cliente final.
create table if not exists tenant_contratos (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  cliente_id uuid not null references tenant_clientes(id) on delete cascade,
  proposta_id uuid references tenant_propostas(id) on delete set null,
  conteudo text not null,
  status text not null default 'rascunho' check (status in ('rascunho','enviado','assinado','recusado','cancelado')),
  enviado_em timestamptz,
  assinado_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Cobranças do associado (Asaas do próprio associado).
create table if not exists tenant_cobrancas (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  cliente_id uuid references tenant_clientes(id) on delete set null,
  asaas_payment_id text unique,
  descricao text,
  valor numeric not null default 0,
  forma text,
  status text,
  vencimento date,
  pago_em date,
  invoice_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Linha do tempo do cliente.
create table if not exists tenant_eventos (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  cliente_id uuid references tenant_clientes(id) on delete cascade,
  tipo text not null,
  descricao text not null,
  autor uuid,
  created_at timestamptz not null default now()
);
create index if not exists tenant_eventos_cliente_idx on tenant_eventos(cliente_id, created_at desc);

-- RLS: isolamento por tenant.
do $$
declare t text;
begin
  foreach t in array array['tenant_clientes','tenant_propostas','tenant_contratos','tenant_cobrancas','tenant_eventos'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists tenant_rw on %I', t);
    execute format('create policy tenant_rw on %I for all to authenticated using (public.tenant_can(company_id)) with check (public.tenant_can(company_id))', t);
  end loop;
end $$;

-- Cobranças só são escritas pela Edge Function (Asaas); o associado lê.
drop policy if exists tenant_rw on tenant_cobrancas;
create policy tenant_read on tenant_cobrancas for select to authenticated using (public.tenant_can(company_id));

-- Endurecimento (aplicado como crm_associado_tenant_hardening): nada de acesso anônimo,
-- e tenant_config nem aparece para usuários logados (só service role via Edge Function).
revoke all on table tenant_config, tenant_clientes, tenant_propostas, tenant_contratos, tenant_cobrancas, tenant_eventos from anon;
revoke all on table tenant_config from authenticated;
revoke execute on function public.tenant_can(uuid) from public, anon;
revoke execute on function public.my_company_id() from public, anon;
grant execute on function public.tenant_can(uuid) to authenticated;
grant execute on function public.my_company_id() to authenticated;
