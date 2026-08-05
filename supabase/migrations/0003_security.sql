-- =============================================================================
-- Migração 0003 — Segurança: is_admin(), security_logs, log de eventos
-- Sprint 3 — Perfis e Segurança
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Função is_admin()
-- -----------------------------------------------------------------------------
-- Usada dentro de políticas de RLS para checar se o usuário autenticado é
-- Admin, sem cair em recursão infinita (uma policy em "profiles" não pode
-- fazer "select ... from profiles" diretamente sem ajuda, porque essa
-- subconsulta também estaria sujeita à própria RLS). Por ser SECURITY
-- DEFINER, a função enxerga a tabela sem estar sujeita à RLS que ela mesma
-- ajuda a montar.
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'ADMIN'
  );
$$;

grant execute on function public.is_admin() to authenticated;

-- -----------------------------------------------------------------------------
-- profiles: Admin passa a ver todos os perfis
-- -----------------------------------------------------------------------------
-- Múltiplas políticas de SELECT na mesma tabela são combinadas com OR pelo
-- Postgres — ou seja, esta política SOMA com "Usuário vê o próprio perfil"
-- (criada na migração 0002), não a substitui.
create policy "Admin vê todos os perfis"
on public.profiles for select
using (public.is_admin());

-- -----------------------------------------------------------------------------
-- Tabela security_logs (Etapa 3, seção 33)
-- -----------------------------------------------------------------------------
create table public.security_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  action text not null,
  entity text,
  entity_id uuid,
  ip text,
  user_agent text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index security_logs_user_id_idx on public.security_logs (user_id);
create index security_logs_created_at_idx on public.security_logs (created_at);
create index security_logs_action_idx on public.security_logs (action);

alter table public.security_logs enable row level security;
alter table public.security_logs force row level security;

-- Só Admin lê. Sem política de INSERT/UPDATE/DELETE para o client — a única
-- forma de escrever é via log_security_event() abaixo, e ninguém apaga ou
-- edita log (mesmo Admin), conforme regra de auditoria imutável da Etapa 3.
create policy "Admin vê os logs de segurança"
on public.security_logs for select
using (public.is_admin());

-- -----------------------------------------------------------------------------
-- Função log_security_event()
-- -----------------------------------------------------------------------------
-- Chamada pelo servidor (nunca diretamente pelo client) sempre que uma
-- tentativa de acesso indevido é detectada — ver src/lib/auth/requireRole.ts.
-- O user_id é sempre o do próprio chamador (auth.uid()); não é possível
-- registrar um evento em nome de outro usuário.
create or replace function public.log_security_event(
  p_action text,
  p_entity text default null,
  p_entity_id uuid default null,
  p_ip text default null,
  p_user_agent text default null,
  p_metadata jsonb default null
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.security_logs (user_id, action, entity, entity_id, ip, user_agent, metadata)
  values (auth.uid(), p_action, p_entity, p_entity_id, p_ip, p_user_agent, p_metadata);
end;
$$;

revoke all on function public.log_security_event(text, text, uuid, text, text, jsonb) from public;
grant execute on function public.log_security_event(text, text, uuid, text, text, jsonb) to authenticated;
