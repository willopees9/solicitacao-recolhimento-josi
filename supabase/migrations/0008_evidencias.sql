-- =============================================================================
-- Migração 0008 — Upload de Evidências
-- Sprint 8 — Upload de Evidências
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Bucket privado no Supabase Storage
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('collection-evidences', 'collection-evidences', false)
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- Tabela collection_request_files
-- -----------------------------------------------------------------------------
create table public.collection_request_files (
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

create index collection_request_files_request_id_idx on public.collection_request_files (request_id);
create index collection_request_files_file_type_idx on public.collection_request_files (file_type);

alter table public.collection_request_files enable row level security;
alter table public.collection_request_files force row level security;

create policy "Promotor vê arquivos das próprias solicitações"
on public.collection_request_files for select
using (
  exists (
    select 1 from public.collection_requests cr
    where cr.id = collection_request_files.request_id
      and cr.promotor_id = auth.uid()
  )
);

create policy "Admin vê todos os arquivos"
on public.collection_request_files for select
using (public.is_admin());

-- Mesma adaptação explicada na migração 0007: sem rascunho, o registro do
-- arquivo só pode ser gravado quando a solicitação já existe, então a
-- condição de status cobre tanto o momento logo após a criação
-- (AGUARDANDO_CONFERENCIA) quanto a correção (AGUARDANDO_CORRECAO).
create policy "Promotor registra arquivo em solicitação editável"
on public.collection_request_files for insert
with check (
  exists (
    select 1 from public.collection_requests cr
    where cr.id = collection_request_files.request_id
      and cr.promotor_id = auth.uid()
      and cr.status in ('AGUARDANDO_CONFERENCIA', 'AGUARDANDO_CORRECAO')
  )
);

-- -----------------------------------------------------------------------------
-- RLS do Storage (storage.objects) — espelha a mesma regra
-- -----------------------------------------------------------------------------
-- Os arquivos são organizados como "{request_id}/{nome-unico}", então
-- storage.foldername(name) dá o request_id a partir do caminho — é assim
-- que a política sabe "de quem" é o arquivo sem precisar de outra tabela.
create policy "Promotor lê arquivos das próprias solicitações no storage"
on storage.objects for select
using (
  bucket_id = 'collection-evidences'
  and exists (
    select 1 from public.collection_requests cr
    where cr.id::text = (storage.foldername(name))[1]
      and cr.promotor_id = auth.uid()
  )
);

create policy "Admin lê todos os arquivos do bucket"
on storage.objects for select
using (
  bucket_id = 'collection-evidences' and public.is_admin()
);

create policy "Promotor envia arquivo em solicitação editável no storage"
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
