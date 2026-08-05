import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PromotorNav } from "@/components/promotor/PromotorNav";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EvidenciasSection } from "@/components/promotor/EvidenciasSection";

const EDITABLE_STATUSES = ["AGUARDANDO_CONFERENCIA", "AGUARDANDO_CORRECAO"];

type StoreInfo = { nome: string; cidade: string } | null;
type RequestTypeInfo = { nome: string } | null;

export default async function SolicitacaoDetalhePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  // A RLS (migração 0005) já filtra: se este ID pertencer a outro
  // Promotor, a linha simplesmente não vem — nem é preciso checar
  // "de quem é" aqui na página, o banco já resolveu isso.
  const { data: request } = await supabase
    .from("collection_requests")
    .select(
      "id, numero, status, vendedor, nfd, observacoes, rejection_reason, correction_notes, store:store_id(nome, cidade), request_type:request_type_id(nome)"
    )
    .eq("id", params.id)
    .single();

  if (!request) notFound();

  const { data: items } = await supabase
    .from("collection_request_items")
    .select("id, descricao_manual, quantidade, unidade, lote, validade, observacao, product:product_id(codigo, descricao)")
    .eq("request_id", params.id)
    .order("created_at");

  const { data: files } = await supabase
    .from("collection_request_files")
    .select("id, original_name, file_type, size_bytes")
    .eq("request_id", params.id)
    .order("created_at");

  const store = request.store as unknown as StoreInfo;
  const requestType = request.request_type as unknown as RequestTypeInfo;

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <PromotorNav />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{request.numero}</h1>
        <StatusBadge status={request.status} />
      </div>

      {request.status === "AGUARDANDO_CORRECAO" && request.correction_notes && (
        <div className="mb-6 rounded-md border border-status-aguardandoCorrecao bg-status-aguardandoCorrecao/10 p-4 text-sm">
          <p className="font-medium">Correção solicitada:</p>
          <p>{request.correction_notes}</p>
        </div>
      )}

      {request.status === "REJEITADA" && request.rejection_reason && (
        <div className="mb-6 rounded-md border border-status-rejeitada bg-status-rejeitada/10 p-4 text-sm">
          <p className="font-medium">Motivo da rejeição:</p>
          <p>{request.rejection_reason}</p>
        </div>
      )}

      <dl className="space-y-3 text-sm">
        <Row label="Loja" value={store?.nome} />
        <Row label="Cidade" value={store?.cidade} />
        <Row label="Vendedor" value={request.vendedor} />
        <Row label="NFD" value={request.nfd} />
        <Row label="Tipo" value={requestType?.nome} />
        <Row label="Observações" value={request.observacoes} />
      </dl>

      <h2 className="mb-3 mt-8 text-sm font-medium text-muted-foreground">Produtos</h2>
      <ul className="space-y-2">
        {items?.map((item) => {
          const product = item.product as unknown as { codigo: string; descricao: string } | null;
          const descricao = product ? `${product.codigo} — ${product.descricao}` : item.descricao_manual;
          return (
            <li key={item.id} className="rounded-md border border-border p-3 text-sm">
              <p className="font-medium">{descricao}</p>
              <p className="text-muted-foreground">
                Qtd: {item.quantidade}
                {item.unidade ? ` ${item.unidade}` : ""}
                {item.lote ? ` · Lote: ${item.lote}` : ""}
                {item.validade ? ` · Validade: ${item.validade}` : ""}
              </p>
            </li>
          );
        })}
        {(!items || items.length === 0) && (
          <li className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
            Nenhum produto encontrado.
          </li>
        )}
      </ul>

      <h2 className="mb-3 mt-8 text-sm font-medium text-muted-foreground">Evidências</h2>
      <EvidenciasSection
        requestId={request.id}
        initialFiles={files ?? []}
        editable={EDITABLE_STATUSES.includes(request.status)}
      />

      <Link href="/promotor/solicitacoes" className="mt-8 inline-block text-sm underline">
        ← Voltar para Minhas Solicitações
      </Link>
    </main>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value ?? "—"}</dd>
    </div>
  );
}
