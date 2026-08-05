import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AdminNav } from "@/components/admin/AdminNav";
import { StatusBadge } from "@/components/shared/StatusBadge";

type RelatedName = { nome?: string; cidade?: string } | null;
type RequestRow = {
  id: string;
  numero: string;
  status: string;
  created_at: string;
  vendedor: string;
  nfd: string;
  store: RelatedName;
  request_type: RelatedName;
  promotor: RelatedName;
};

const PRIORITY_STATUSES = ["AGUARDANDO_CONFERENCIA", "AGUARDANDO_CORRECAO"];

export default async function ConferenciaPage() {
  const supabase = createClient();

  const { data: requests } = await supabase
    .from("collection_requests")
    .select(
      "id, numero, status, created_at, vendedor, nfd, store:store_id(nome, cidade), request_type:request_type_id(nome), promotor:promotor_id(nome)"
    )
    .in("status", PRIORITY_STATUSES)
    .order("created_at", { ascending: false });

  const rows = (requests ?? []) as unknown as RequestRow[];

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <AdminNav />

      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Painel de Conferencia</h1>
        <p className="text-sm text-muted-foreground">
          Solicitacoes aguardando analise administrativa.
        </p>
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="bg-secondary">
            <tr>
              <th className="px-4 py-3 font-medium">Numero</th>
              <th className="px-4 py-3 font-medium">Data</th>
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
                <td colSpan={10} className="px-4 py-10 text-center text-muted-foreground">
                  Nenhuma solicitacao aguardando conferencia agora.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
