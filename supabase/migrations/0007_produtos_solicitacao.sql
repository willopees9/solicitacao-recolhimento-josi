-- =============================================================================
-- Migração 0007 — Produtos da solicitação
-- Sprint 7 — Produtos da Solicitação
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tabela collection_request_items
-- -----------------------------------------------------------------------------
create table public.collection_request_items (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.collection_requests(id) on delete cascade,
  product_id uuid references public.products(id),
  descricao_manual text,
  quantidade numeric not null check (quantidade > 0),
  unidade text,
  lote text,
  validade date,
  observacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Todo item tem produto do cadastro OU descrição manual — nunca os dois
  -- vazios (regra da Etapa 3, modelagem inicial).
  constraint collection_request_items_product_or_manual
    check (product_id is not null or descricao_manual is not null)
);

create index collection_request_items_request_id_idx on public.collection_request_items (request_id);

create trigger set_collection_request_items_updated_at
before update on public.collection_request_items
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- RLS — espelha a solicitação-mãe
-- -----------------------------------------------------------------------------
-- Nota sobre a condição de status abaixo: como o MVP não tem RASCUNHO, a
-- solicitação já nasce em AGUARDANDO_CONFERENCIA no exato momento em que
-- os itens do formulário são gravados (é tudo a mesma operação de envio).
-- Por isso a política libera escrita tanto em AGUARDANDO_CONFERENCIA
-- quanto em AGUARDANDO_CORRECAO — a primeira cobre a criação em si, a
-- segunda cobre a correção (Sprint 10). Isso é uma adaptação direta da
-- decisão de remover o rascunho; sem ela, não haveria como o Promotor
-- incluir produtos na hora de criar a solicitação.
alter table public.collection_request_items enable row level security;
alter table public.collection_request_items force row level security;

create policy "Promotor vê itens das próprias solicitações"
on public.collection_request_items for select
using (
  exists (
    select 1 from public.collection_requests cr
    where cr.id = collection_request_items.request_id
      and cr.promotor_id = auth.uid()
  )
);

create policy "Admin vê todos os itens"
on public.collection_request_items for select
using (public.is_admin());

create policy "Promotor adiciona item em solicitação editável"
on public.collection_request_items for insert
with check (
  exists (
    select 1 from public.collection_requests cr
    where cr.id = collection_request_items.request_id
      and cr.promotor_id = auth.uid()
      and cr.status in ('AGUARDANDO_CONFERENCIA', 'AGUARDANDO_CORRECAO')
  )
);

create policy "Promotor edita item em solicitação editável"
on public.collection_request_items for update
using (
  exists (
    select 1 from public.collection_requests cr
    where cr.id = collection_request_items.request_id
      and cr.promotor_id = auth.uid()
      and cr.status in ('AGUARDANDO_CONFERENCIA', 'AGUARDANDO_CORRECAO')
  )
);

create policy "Promotor remove item em solicitação editável"
on public.collection_request_items for delete
using (
  exists (
    select 1 from public.collection_requests cr
    where cr.id = collection_request_items.request_id
      and cr.promotor_id = auth.uid()
      and cr.status in ('AGUARDANDO_CONFERENCIA', 'AGUARDANDO_CORRECAO')
  )
);

-- -----------------------------------------------------------------------------
-- Função create_collection_request()
-- -----------------------------------------------------------------------------
-- Cria a solicitação e todos os seus itens numa transação só. Sem isso, o
-- Route Handler precisaria fazer múltiplas chamadas separadas (criar a
-- solicitação, depois inserir cada item), e uma falha no meio do caminho
-- deixaria uma solicitação sem nenhum item — inconsistente com a regra de
-- que toda solicitação precisa ter ao menos um produto.
--
-- É SECURITY INVOKER de propósito (não DEFINER): executa com o papel de
-- quem chama, então as políticas de RLS de collection_requests e
-- collection_request_items continuam valendo normalmente — a função só
-- agrupa as operações, não contorna a segurança.
create or replace function public.create_collection_request(
  p_store_id uuid,
  p_vendedor text,
  p_nota_fiscal text,
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
    p_store_id, p_vendedor, p_nota_fiscal, p_nfd, p_request_type_id, p_observacoes
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

grant execute on function public.create_collection_request(uuid, text, text, text, uuid, text, jsonb) to authenticated;
