-- =============================================================================
-- Migracao 0010 - Reparo idempotente de evidencias/storage
-- =============================================================================
-- Use quando o bucket existir, mas a API nao encontrar
-- public.collection_request_files no schema cache.

insert into storage.buckets (id, name, public)
values ('collection-evidences', 'collection-evidences', false)
on conflict (id) do update set public = false;

create table if not exists public.collection_request_files (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.collection_requests(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id) default auth.uid(),
  file_type file_type not null,
  storage_path text not null unique,
  original_name text not null,
  mime_type text not null,
  size_bytes bigint not null,
  created_at timestamptz not null default now()
);

create index if not exists collection_request_files_request_id_idx
  on public.collection_request_files (request_id);

create index if not exists collection_request_files_file_type_idx
  on public.collection_request_files (file_type);

alter table public.collection_request_files enable row level security;
alter table public.collection_request_files force row level security;

drop policy if exists "Promotor ve arquivos das proprias solicitacoes" on public.collection_request_files;
drop policy if exists "Admin ve todos os arquivos" on public.collection_request_files;
drop policy if exists "Promotor registra arquivo em solicitacao editavel" on public.collection_request_files;

drop policy if exists "Promotor vÃª arquivos das prÃ³prias solicitaÃ§Ãµes" on public.collection_request_files;
drop policy if exists "Admin vÃª todos os arquivos" on public.collection_request_files;
drop policy if exists "Promotor registra arquivo em solicitaÃ§Ã£o editÃ¡vel" on public.collection_request_files;

create policy "Promotor ve arquivos das proprias solicitacoes"
on public.collection_request_files for select
using (
  exists (
    select 1 from public.collection_requests cr
    where cr.id = collection_request_files.request_id
      and cr.promotor_id = auth.uid()
  )
);

create policy "Admin ve todos os arquivos"
on public.collection_request_files for select
using (public.is_admin());

create policy "Promotor registra arquivo em solicitacao editavel"
on public.collection_request_files for insert
with check (
  exists (
    select 1 from public.collection_requests cr
    where cr.id = collection_request_files.request_id
      and cr.promotor_id = auth.uid()
      and cr.status in ('AGUARDANDO_CONFERENCIA', 'AGUARDANDO_CORRECAO')
  )
);

drop policy if exists "Promotor le arquivos das proprias solicitacoes no storage" on storage.objects;
drop policy if exists "Admin le todos os arquivos do bucket" on storage.objects;
drop policy if exists "Promotor envia arquivo em solicitacao editavel no storage" on storage.objects;

drop policy if exists "Promotor lÃª arquivos das prÃ³prias solicitaÃ§Ãµes no storage" on storage.objects;
drop policy if exists "Admin lÃª todos os arquivos do bucket" on storage.objects;
drop policy if exists "Promotor envia arquivo em solicitaÃ§Ã£o editÃ¡vel no storage" on storage.objects;

create policy "Promotor le arquivos das proprias solicitacoes no storage"
on storage.objects for select
using (
  bucket_id = 'collection-evidences'
  and exists (
    select 1 from public.collection_requests cr
    where cr.id::text = (storage.foldername(name))[1]
      and cr.promotor_id = auth.uid()
  )
);

create policy "Admin le todos os arquivos do bucket"
on storage.objects for select
using (
  bucket_id = 'collection-evidences' and public.is_admin()
);

create policy "Promotor envia arquivo em solicitacao editavel no storage"
on storage.objects for insert
with check (
  bucket_id = 'collection-evidences'
  and exists (
    select 1 from public.collection_requests cr
    where cr.id::text = (storage.foldername(name))[1]
      and cr.promotor_id = auth.uid()
      and cr.status in ('AGUARDANDO_CONFERENCIA', 'AGUARDANDO_CORRECAO')
  )
);

notify pgrst, 'reload schema';
