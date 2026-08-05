import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AdminNav } from "@/components/admin/AdminNav";
import { ReviewActions } from "@/components/admin/ReviewActions";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { FileGallery } from "@/components/shared/FileGallery";

type StoreInfo = { nome: string; cidade: string } | null;
type RequestTypeInfo = { nome: string } | null;
type ProfileInfo = { nome: string; email?: string } | null;

export default async function ConferenciaDetalhePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: request } = await supabase
    .from("collection_requests")
    .select(
      "id, numero, status, created_at, vendedor, nfd, observacoes, correction_notes, rejection_reason, store:store_id(nome, cidade), request_type:request_type_id(nome), promotor:promotor_id(nome, email)"
    )
    .eq("id", params.id)
    .single();

  if (!request) notFound();

  const [{ data: items }, { data: files }, { data: history }] = await Promise.all([
    supabase
      .from("collection_request_items")
      .select("id, descricao_manual, quantidade, unidade, lote, validade, observacao, product:product_id(codigo, descricao)")
      .eq("request_id", params.id)
      .order("created_at"),
    supabase
      .from("collection_request_files")
      .select("id, original_name, file_type, size_bytes")
      .eq("request_id", params.id)
      .order("created_at"),
    supabase
      .from("collection_request_history")
      .select("id, action, observation, created_at, user:user_id(nome)")
      .eq("request_id", params.id)
      .order("created_at", { ascending: false }),
  ]);

  const store = request.store as unknown as StoreInfo;
  const requestType = request.request_type as unknown as RequestTypeInfo;
  const promotor = request.promotor as unknown as ProfileInfo;
  const isFinalized = ["APROVADA", "REJEITADA"].includes(request.status);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <AdminNav />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href={isFinalized ? "/admin/historico" : "/admin/conferencia"} className="mb-2 inline-block text-sm underline">
            Voltar para {isFinalized ? "Historico" : "Solicitacoes"}
          </Link>
          <h1 className="text-2xl font-semibold">{request.numero}</h1>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <section className="grid gap-4 rounded-md border border-border p-4 text-sm sm:grid-cols-2">
        <Row label="Data" value={new Date(request.created_at).toLocaleString("pt-BR")} />
        <Row label="Promotor" value={promotor?.nome} />
        <Row label="Loja" value={store?.nome} />
        <Row label="Cidade" value={store?.cidade} />
        <Row label="Vendedor" value={request.vendedor} />
        <Row label="NFD" value={request.nfd} />
        <Row label="Tipo" value={requestType?.nome} />
        <Row label="Observacoes" value={request.observacoes} />
      </section>

      <section className="mt-6">
        <ReviewActions requestId={request.id} status={request.status} />
      </section>

      {request.correction_notes && (
        <section className="mt-6 rounded-md border border-status-aguardandoCorrecao bg-status-aguardandoCorrecao/10 p-4 text-sm">
          <p className="font-medium">Correcao solicitada:</p>
          <p>{request.correction_notes}</p>
        </section>
      )}

      {request.rejection_reason && (
        <section className="mt-6 rounded-md border border-status-rejeitada bg-status-rejeitada/10 p-4 text-sm">
          <p className="font-medium">Motivo da rejeicao:</p>
          <p>{request.rejection_reason}</p>
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Produtos</h2>
        <ul className="space-y-2">
          {items?.map((item) => {
            const product = item.product as unknown as { codigo: string; descricao: string } | null;
            const descricao = product ? `${product.codigo} - ${product.descricao}` : item.descricao_manual;

            return (
              <li key={item.id} className="rounded-md border border-border p-3 text-sm">
                <p className="font-medium">{descricao}</p>
                <p className="text-muted-foreground">
                  Qtd: {item.quantidade}
                  {item.unidade ? ` ${item.unidade}` : ""}
                  {item.lote ? ` - Lote: ${item.lote}` : ""}
                  {item.validade ? ` - Validade: ${item.validade}` : ""}
                </p>
                {item.observacao && <p className="mt-1 text-muted-foreground">{item.observacao}</p>}
              </li>
            );
          })}

          {(!items || items.length === 0) && (
            <li className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              Nenhum produto encontrado.
            </li>
          )}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Evidencias</h2>
        <FileGallery files={files ?? []} />
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Historico</h2>
        <div className="rounded-md border border-border">
          {history?.map((entry) => {
            const user = entry.user as unknown as { nome?: string } | null;

            return (
              <div key={entry.id} className="border-b border-border p-3 text-sm last:border-b-0">
                <p className="font-medium">{entry.action}</p>
                <p className="text-muted-foreground">
                  {new Date(entry.created_at).toLocaleString("pt-BR")} - {user?.nome ?? "Sistema"}
                </p>
                {entry.observation && <p className="mt-1">{entry.observation}</p>}
              </div>
            );
          })}

          {(!history || history.length === 0) && (
            <p className="p-4 text-center text-sm text-muted-foreground">
              Nenhum historico registrado.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value ?? "-"}</dd>
    </div>
  );
}
