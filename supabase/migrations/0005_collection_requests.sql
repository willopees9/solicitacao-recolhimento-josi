-- =============================================================================
-- Migração 0005 — collection_requests (estrutura + leitura)
-- Sprint 5 — Área do Promotor (Home + Listagem)
-- =============================================================================
-- Esta migração cria a tabela e a função de numeração. O fluxo de ESCRITA
-- (INSERT do Promotor) só é liberado na Sprint 6 — de propósito, para não
-- ficar nenhuma política de escrita "adiantada" sem o código que a usa.

-- -----------------------------------------------------------------------------
-- Controle de numeração (SR-ANO-sequencial)
-- -----------------------------------------------------------------------------
-- Uma linha por ano, com o último número emitido. O UPSERT abaixo é
-- atômico (row-level lock implícito do ON CONFLICT DO UPDATE), então duas
-- solicitações criadas ao mesmo tempo nunca recebem o mesmo número.
create table public.request_number_control (
  ano integer primary key,
  ultimo_numero integer not null default 0
);

alter table public.request_number_control enable row level security;
alter table public.request_number_control force row level security;
-- Sem nenhuma política — só a função SECURITY DEFINER abaixo consegue
-- tocar nesta tabela.

create or replace function public.generate_request_number()
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  current_year integer := extract(year from now());
  next_number integer;
begin
  insert into public.request_number_control (ano, ultimo_numero)
  values (current_year, 1)
  on conflict (ano) do update
    set ultimo_numero = public.request_number_control.ultimo_numero + 1
  returning ultimo_numero into next_number;

  return 'SR-' || current_year || '-' || lpad(next_number::text, 6, '0');
end;
$$;

-- -----------------------------------------------------------------------------
-- Tabela collection_requests
-- -----------------------------------------------------------------------------
create table public.collection_requests (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique default public.generate_request_number(),
  store_id uuid not null references public.stores(id),
  promotor_id uuid not null references public.profiles(id) default auth.uid(),
  created_by uuid not null references public.profiles(id) default auth.uid(),
  vendedor text not null,
  nota_fiscal text not null,
  nfd text not null,
  request_type_id uuid not null references public.request_types(id),
  status request_status not null default 'AGUARDANDO_CONFERENCIA',
  observacoes text not null,
  rejection_reason text,
  correction_notes text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index collection_requests_status_idx on public.collection_requests (status);
create index collection_requests_store_id_idx on public.collection_requests (store_id);
create index collection_requests_promotor_id_idx on public.collection_requests (promotor_id);
create index collection_requests_created_at_idx on public.collection_requests (created_at);
create index collection_requests_nota_fiscal_idx on public.collection_requests (nota_fiscal);
create index collection_requests_nfd_idx on public.collection_requests (nfd);

-- Bloqueia NF+NFD duplicados apenas entre solicitações "vivas" — uma
-- REJEITADA não conta, para não travar um reenvio legítimo. Decisão
-- tomada na Etapa 3 do planejamento.
create unique index collection_requests_nf_nfd_live_key
  on public.collection_requests (nota_fiscal, nfd)
  where status <> 'REJEITADA';

create trigger set_collection_requests_updated_at
before update on public.collection_requests
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- RLS — só leitura nesta sprint
-- -----------------------------------------------------------------------------
alter table public.collection_requests enable row level security;
alter table public.collection_requests force row level security;

create policy "Promotor vê as próprias solicitações"
on public.collection_requests for select
using (promotor_id = auth.uid());

create policy "Admin vê todas as solicitações"
on public.collection_requests for select
using (public.is_admin());

-- Nenhuma política de INSERT/UPDATE ainda — chega na Sprint 6 (criação) e
-- Sprint 10 (decisão do Admin), respectivamente.
