-- =============================================================================
-- Migracao 0009 - NFD como identificador fiscal unico
-- Ajuste aprovado apos a Sprint 8
-- =============================================================================
-- O Promotor nao possui a Nota Fiscal no momento da abertura da solicitacao.
-- A partir desta migracao, a interface e as APIs usam somente NFD. A coluna
-- nota_fiscal permanece como compatibilidade interna para bancos ja aplicados.

-- Mantem a coluna antiga satisfeita mesmo quando o fluxo novo nao envia NF.
alter table public.collection_requests
  alter column nota_fiscal set default 'N/A';

-- A duplicidade ativa agora considera somente NFD. Solicitacoes rejeitadas nao
-- bloqueiam novo envio, mantendo a regra anterior de "solicitacao viva".
drop index if exists public.collection_requests_nf_nfd_live_key;

do $$
begin
  if exists (
    select 1
    from public.collection_requests
    where status <> 'REJEITADA'
    group by nfd
    having count(*) > 1
  ) then
    raise exception 'Existem solicitacoes ativas duplicadas por NFD. Resolva as duplicidades antes de aplicar a migracao 0009.';
  end if;
end;
$$;

create unique index collection_requests_nfd_live_key
  on public.collection_requests (nfd)
  where status <> 'REJEITADA';

-- Substitui a funcao antiga, que recebia Nota Fiscal + NFD, pela verificacao
-- usando apenas NFD.
drop function if exists public.has_active_duplicate_request(text, text);

create or replace function public.has_active_duplicate_request(
  p_nfd text
)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.collection_requests
    where nfd = p_nfd
      and status <> 'REJEITADA'
  );
$$;

grant execute on function public.has_active_duplicate_request(text) to authenticated;

-- Recria a RPC de criacao sem o parametro de Nota Fiscal. A coluna antiga
-- recebe o valor interno "N/A" e nao aparece mais no fluxo de negocio.
drop function if exists public.create_collection_request(uuid, text, text, text, uuid, text, jsonb);

create or replace function public.create_collection_request(
  p_store_id uuid,
  p_vendedor text,
  p_nfd text,
  p_request_type_id uuid,
  p_observacoes text,
  p_items jsonb
)
returns table (id uuid, numero text)
language plpgsql
security invoker
set search_path = public
as $$
declare
  new_request_id uuid;
  new_numero text;
  item jsonb;
begin
  insert into public.collection_requests (
    store_id, vendedor, nota_fiscal, nfd, request_type_id, observacoes
  ) values (
    p_store_id, p_vendedor, 'N/A', p_nfd, p_request_type_id, p_observacoes
  )
  returning collection_requests.id, collection_requests.numero
  into new_request_id, new_numero;

  for item in select * from jsonb_array_elements(p_items)
  loop
    insert into public.collection_request_items (
      request_id, product_id, descricao_manual, quantidade, unidade, lote, validade, observacao
    ) values (
      new_request_id,
      nullif(item->>'productId', '')::uuid,
      nullif(item->>'descricaoManual', ''),
      (item->>'quantidade')::numeric,
      nullif(item->>'unidade', ''),
      nullif(item->>'lote', ''),
      nullif(item->>'validade', '')::date,
      nullif(item->>'observacao', '')
    );
  end loop;

  perform public.log_request_history(new_request_id, 'CRIACAO'::history_action);

  return query select new_request_id, new_numero;
end;
$$;

grant execute on function public.create_collection_request(uuid, text, text, uuid, text, jsonb) to authenticated;

-- Atualiza o schema cache do PostgREST/Supabase para expor as novas
-- assinaturas das RPCs imediatamente apos aplicar pelo SQL Editor.
notify pgrst, 'reload schema';
