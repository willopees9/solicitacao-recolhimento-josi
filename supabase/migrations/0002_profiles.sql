-- =============================================================================
-- Migração 0002 — Perfis (profiles) e autenticação
-- Sprint 2 — Autenticação
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tabela profiles
-- -----------------------------------------------------------------------------
-- Estende auth.users (1:1) com os dados de negócio do usuário. O "id" é o
-- mesmo do auth.users — não existe um id independente aqui de propósito,
-- para nunca haver ambiguidade sobre "de quem" é um perfil.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  email text not null unique,
  telefone text,
  role role_type not null default 'PROMOTOR',
  ativo boolean not null default true,
  primeiro_acesso boolean not null default true,
  ultimo_acesso timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);

-- -----------------------------------------------------------------------------
-- updated_at automático
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Sincronização automática com auth.users
-- -----------------------------------------------------------------------------
-- Sempre que um usuário é criado no Supabase Auth, um registro correspondente
-- é criado aqui automaticamente. Isso cobre tanto o bootstrap manual do
-- primeiro Admin (feito direto no painel do Supabase, ver README) quanto o
-- fluxo de criação de usuário pelo Admin, que será construído na Sprint 4.
--
-- "nome", "telefone" e "role" são lidos de raw_user_meta_data, que é o campo
-- de metadados que o Supabase Auth permite anexar na criação do usuário.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nome, email, telefone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'telefone',
    coalesce((new.raw_user_meta_data->>'role')::role_type, 'PROMOTOR')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
-- Nesta sprint, a única política é a de leitura do próprio perfil (necessária
-- para a tela /promotor/perfil e para as telas de login/primeiro acesso lerem
-- primeiro_acesso e ativo). A política que permite ao Admin ler TODOS os
-- perfis entra na Sprint 3, junto com o restante da matriz de permissões.
alter table public.profiles enable row level security;
alter table public.profiles force row level security;

create policy "Usuário vê o próprio perfil"
on public.profiles for select
using (id = auth.uid());

-- Nenhuma política de INSERT/UPDATE/DELETE é criada para o client aqui.
-- Toda escrita em profiles acontece via funções SECURITY DEFINER (abaixo) ou,
-- a partir da Sprint 4, via Service Role no Route Handler de administração de
-- usuários. Isso impede que o próprio usuário altere seu "role" ou "ativo".

-- -----------------------------------------------------------------------------
-- Função: registrar último acesso
-- -----------------------------------------------------------------------------
-- Chamada pelo client logo após um login bem-sucedido. Só altera o campo
-- ultimo_acesso do PRÓPRIO usuário (auth.uid()) — não recebe nenhum parâmetro
-- que permita apontar para outro registro.
create or replace function public.register_login()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles
  set ultimo_acesso = now()
  where id = auth.uid();
end;
$$;

revoke all on function public.register_login() from public;
grant execute on function public.register_login() to authenticated;

-- -----------------------------------------------------------------------------
-- Função: concluir primeiro acesso
-- -----------------------------------------------------------------------------
-- Chamada depois que o usuário define a nova senha na tela /primeiro-acesso.
-- Assim como a anterior, só altera o campo primeiro_acesso do próprio
-- usuário — nunca role ou ativo.
create or replace function public.complete_first_access()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles
  set primeiro_acesso = false
  where id = auth.uid();
end;
$$;

revoke all on function public.complete_first_access() from public;
grant execute on function public.complete_first_access() to authenticated;
