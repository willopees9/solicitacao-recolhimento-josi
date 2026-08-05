-- =============================================================================
-- Migração 0006 — Criação de solicitação (Dados Gerais)
-- Sprint 6 — Nova Solicitação (Dados Gerais)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tabela collection_request_history (histórico de negócio, append-only)
-- -----------------------------------------------------------------------------
create table public.collection_request_history (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.collection_requests(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  action history_action not null,
  observation text,
  previous_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create index collection_request_history_request_id_idx on public.collection_request_history (request_id);
create index collection_request_history_created_at_idx on public.collection_request_history (created_at);

alter table public.collection_request_history enable row level security;
alter table public.collection_request_history force row level security;

-- Leitura: Promotor vê o histórico só das próprias solicitações (join
-- implícito via subconsulta); Admin vê tudo.
create policy "Promotor vê histórico das próprias solicitações"
on public.collection_request_history for select
using (
  exists (
    select 1 from public.collection_requests cr
    where cr.id = collection_request_history.request_id
      and cr.promotor_id = auth.uid()
  )
);

create policy "Admin vê todo o histórico"
on public.collection_request_history for select
using (public.is_admin());

-- Sem política de INSERT/UPDATE/DELETE para o client — toda escrita
-- acontece via log_request_history() abaixo, e ninguém (nem Admin) edita
-- ou apaga histórico, conforme a regra de auditoria imutável da Etapa 3.

-- -----------------------------------------------------------------------------
-- Função log_request_history()
-- -----------------------------------------------------------------------------
-- Registra um evento de histórico. Verifica internamente se quem está
-- chamando tem relação com a solicitação (é o dono ou é Admin) antes de
-- gravar — mesmo sendo SECURITY DEFINER, não confia cegamente no
-- parâmetro request_id vindo de fora.
create or replace function public.log_request_history(
  p_request_id uuid,
  p_action history_action,
  p_observation text default null,
  p_previous_data jsonb default null,
  p_new_data jsonb default null
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  has_permission boolean;
begin
  select exists (
    select 1 from public.collection_requests
    where id = p_request_id
      and (promotor_id = auth.uid() or public.is_admin())
  ) into has_permission;

  if not has_permission then
    raise exception 'Sem permissão para registrar histórico nesta solicitação.';
  end if;

  insert into public.collection_request_history (request_id, user_id, action, observation, previous_data, new_data)
  values (p_request_id, auth.uid(), p_action, p_observation, p_previous_data, p_new_data);
end;
$$;

revoke all on function public.log_request_history(uuid, history_action, text, jsonb, jsonb) from public;
grant execute on function public.log_request_history(uuid, history_action, text, jsonb, jsonb) to authenticated;

-- -----------------------------------------------------------------------------
-- collection_requests: Promotor agora pode criar a própria solicitação
-- -----------------------------------------------------------------------------
-- O "with check" garante que promotor_id e created_by só podem ser o
-- próprio usuário, mesmo que o payload enviado pelo client tente informar
-- outro valor — a política recusa o INSERT nesse caso.
create policy "Promotor cria a própria solicitação"
on public.collection_requests for insert
with check (promotor_id = auth.uid() and created_by = auth.uid());

-- -----------------------------------------------------------------------------
-- Função de checagem de duplicidade ativa (aviso não bloqueante na UI)
-- -----------------------------------------------------------------------------
-- Usada pelo formulário para avisar o Promotor antes do envio. Precisa ser
-- SECURITY DEFINER porque a RLS de leitura de collection_requests só
-- deixa o Promotor ver as próprias solicitações — mas a duplicidade
-- precisa ser checada contra TODAS (inclusive de outros Promotores). O
-- bloqueio de verdade continua sendo o índice único parcial da migração
-- 0005; esta função é só para a mensagem de aviso aparecer mais cedo.
create or replace function public.has_active_duplicate_request(
  p_nota_fiscal text,
  p_nfd text
)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.collection_requests
    where nota_fiscal = p_nota_fiscal
      and nfd = p_nfd
      and status <> 'REJEITADA'
  );
$$;

grant execute on function public.has_active_duplicate_request(text, text) to authenticated;
