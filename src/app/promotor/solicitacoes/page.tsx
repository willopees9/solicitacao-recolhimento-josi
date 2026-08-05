import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PromotorNav } from "@/components/promotor/PromotorNav";
import { StatusBadge } from "@/components/shared/StatusBadge";

const STATUS_LABELS: Record<string, string> = {
  AGUARDANDO_CONFERENCIA: "Aguardando Conferência",
  AGUARDANDO_CORRECAO: "Aguardando Correção",
  APROVADA: "Aprovada",
  REJEITADA: "Rejeitada",
};

export default async function MinhasSolicitacoesPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const supabase = createClient();

  // RLS filtra por dono automaticamente — o .eq("status", ...) abaixo é
  // só um filtro adicional de UI, não uma checagem de permissão.
  let query = supabase
    .from("collection_requests")
    .select("id, numero, status, created_at, store:store_id(nome), request_type:request_type_id(nome)")
    .order("created_at", { ascending: false });

  if (searchParams.status) {
    query = query.eq("status", searchParams.status);
  }

  const { data: requests } = await query;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <PromotorNav />

      <h1 className="mb-4 text-2xl font-semibold">Minhas Solicitações</h1>

      {searchParams.status && (
        <p className="mb-4 text-sm text-muted-foreground">
          Filtrando por: {STATUS_LABELS[searchParams.status] ?? searchParams.status} ·{" "}
          <Link href="/promotor/solicitacoes" className="underline">
            limpar filtro
          </Link>
        </p>
      )}

      <div className="space-y-2">
        {requests?.map((request) => (
          <div
            key={request.id}
            className="flex items-center justify-between rounded-md border border-border p-4"
          >
            <div>
              <p className="font-medium">{request.numero}</p>
              <p className="text-sm text-muted-foreground">
                {(request.store as { nome?: string } | null)?.nome ?? "—"} ·{" "}
                {(request.request_type as { nome?: string } | null)?.nome ?? "—"}
              </p>
            </div>
            <StatusBadge status={request.status} />
          </div>
        ))}

        {(!requests || requests.length === 0) && (
          <div className="rounded-md border border-dashed border-border p-8 text-center text-muted-foreground">
            {searchParams.status
              ? "Nenhuma solicitação encontrada com esse filtro."
              : "Você ainda não tem solicitações. Isso muda na próxima sprint!"}
          </div>
        )}
      </div>
    </main>
  );
}
