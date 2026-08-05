-- =============================================================================
-- Migração 0004 — Cadastros administrativos
-- Sprint 4 — Cadastros Administrativos
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tabela stores (lojas)
-- -----------------------------------------------------------------------------
create table public.stores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cidade text not null,
  endereco text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Evita duas lojas com o mesmo nome na mesma cidade. Não impede o mesmo
-- nome em cidades diferentes (redes com múltiplas unidades).
create unique index stores_nome_cidade_key on public.stores (nome, cidade);
create index stores_cidade_idx on public.stores (cidade);
create index stores_ativo_idx on public.stores (ativo);

create trigger set_stores_updated_at
before update on public.stores
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Tabela products (produtos)
-- -----------------------------------------------------------------------------
-- "codigo" é obrigatório e único — é a chave de busca usada pelo Promotor
-- na Sprint 7, para não precisar digitar o nome completo do produto.
create table public.products (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  descricao text not null,
  unidade text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_descricao_idx on public.products (descricao);

create trigger set_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Tabela request_types (tipos de solicitação)
-- -----------------------------------------------------------------------------
create table public.request_types (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_request_types_updated_at
before update on public.request_types
for each row execute function public.set_updated_at();

-- Seed inicial, conforme a Etapa 1 (seção 5) do planejamento.
insert into public.request_types (nome) values
  ('Avaria'),
  ('Troca'),
  ('Devolução'),
  ('Produto vencido'),
  ('Outro');

-- -----------------------------------------------------------------------------
-- RLS — leitura liberada a qualquer usuário autenticado (necessário para
-- preencher formulários na Área do Promotor), escrita restrita ao Admin.
-- Sem política de DELETE em nenhuma das três: exclusão física nunca é
-- permitida, só o campo "ativo" pode ser alterado (regra de integridade
-- da Etapa 3 — não pode sumir referência usada em solicitações antigas).
-- -----------------------------------------------------------------------------

alter table public.stores enable row level security;
alter table public.stores force row level security;

create policy "Autenticado lê lojas"
on public.stores for select
using (auth.uid() is not null);

create policy "Admin cria lojas"
on public.stores for insert
with check (public.is_admin());

create policy "Admin edita lojas"
on public.stores for update
using (public.is_admin());

alter table public.products enable row level security;
alter table public.products force row level security;

create policy "Autenticado lê produtos"
on public.products for select
using (auth.uid() is not null);

create policy "Admin cria produtos"
on public.products for insert
with check (public.is_admin());

create policy "Admin edita produtos"
on public.products for update
using (public.is_admin());

alter table public.request_types enable row level security;
alter table public.request_types force row level security;

create policy "Autenticado lê tipos de solicitação"
on public.request_types for select
using (auth.uid() is not null);

create policy "Admin cria tipos de solicitação"
on public.request_types for insert
with check (public.is_admin());

create policy "Admin edita tipos de solicitação"
on public.request_types for update
using (public.is_admin());
