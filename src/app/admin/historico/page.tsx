import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { createClient } from "@/lib/supabase/server";

type RelatedName = { nome?: string; cidade?: string } | null;
type RequestRow = {
  id: string;
  numero: string;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  vendedor: string;
  nfd: string;
  store: RelatedName;
  request_type: RelatedName;
  promotor: RelatedName;
};

const FINAL_STATUSES = ["APROVADA", "REJEITADA"] as const;
const STATUS_FILTERS = [
  { href: "/admin/historico", label: "Todas", value: null },
  { href: "/admin/historico?status=APROVADA", label: "Aprovadas", value: "APROVADA" },
  { href: "/admin/historico?status=REJEITADA", label: "Rejeitadas", value: "REJEITADA" },
];

export default async function HistoricoPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const supabase = createClient();
  const selectedStatus = FINAL_STATUSES.includes(searchParams.status as (typeof FINAL_STATUSES)[number])
    ? searchParams.status
    : null;

  let query = supabase
    .from("collection_requests")
    .select(
      "id, numero, status, created_at, reviewed_at, vendedor, nfd, store:store_id(nome, cidade), request_type:request_type_id(nome), promotor:promotor_id(nome)"
    )
    .in("status", selectedStatus ? [selectedStatus] : [...FINAL_STATUSES])
    .order("reviewed_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  const { data: requests } = await query;
  const rows = (requests ?? []) as unknown as RequestRow[];

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <AdminNav />

      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Historico de Solicitacoes</h1>
        <p className="text-sm text-muted-foreground">
          Solicitacoes ja aprovadas ou rejeitadas para consulta administrativa.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => {
          const active = selectedStatus === filter.value;

          return (
            <Link
              key={filter.label}
              href={filter.href}
              className={`rounded-md border px-3 py-2 text-sm ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-secondary">
            <tr>
              <th className="px-4 py-3 font-medium">Numero</th>
              <th className="px-4 py-3 font-medium">Criada em</th>
              <th className="px-4 py-3 font-medium">Decidida em</th>
              <th className="px-4 py-3 font-medium">Loja</th>
              <th className="px-4 py-3 font-medium">Cidade</th>
              <th className="px-4 py-3 font-medium">Promotor</th>
              <th className="px-4 py-3 font-medium">Vendedor</th>
              <th className="px-4 py-3 font-medium">NFD</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((request) => (
              <tr key={request.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{request.numero}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(request.created_at).toLocaleDateString("pt-BR")}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {request.reviewed_at ? new Date(request.reviewed_at).toLocaleDateString("pt-BR") : "-"}
                </td>
                <td className="px-4 py-3">{request.store?.nome ?? "-"}</td>
                <td className="px-4 py-3">{request.store?.cidade ?? "-"}</td>
                <td className="px-4 py-3">{request.promotor?.nome ?? "-"}</td>
                <td className="px-4 py-3">{request.vendedor}</td>
                <td className="px-4 py-3">{request.nfd}</td>
                <td className="px-4 py-3">{request.request_type?.nome ?? "-"}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={request.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/conferencia/${request.id}`} className="text-primary underline">
                    Abrir
                  </Link>
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={11} className="px-4 py-10 text-center text-muted-foreground">
                  Nenhuma solicitacao finalizada encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
