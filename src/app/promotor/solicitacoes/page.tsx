import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PromotorNav } from "@/components/promotor/PromotorNav";
import { StatusBadge } from "@/components/shared/StatusBadge";

const STATUS_LABELS: Record<string, string> = {
  AGUARDANDO_CONFERENCIA: "Aguardando Conferencia",
  AGUARDANDO_CORRECAO: "Aguardando Correcao",
  APROVADA: "Aprovada",
  REJEITADA: "Rejeitada",
};

type RequestRow = {
  id: string;
  numero: string;
  status: string;
  created_at: string;
  nfd: string;
  store: { nome?: string } | null;
  request_type: { nome?: string } | null;
};

export default async function MinhasSolicitacoesPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string };
}) {
  const supabase = createClient();
  const filters = {
    status: STATUS_LABELS[searchParams.status ?? ""] ? searchParams.status ?? "" : "",
    q: searchParams.q?.trim() ?? "",
  };

  let query = supabase
    .from("collection_requests")
    .select("id, numero, status, created_at, nfd, store:store_id(nome), request_type:request_type_id(nome)")
    .order("created_at", { ascending: false });

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  const { data: requests } = await query;
  const rows = applyTextSearch((requests ?? []) as unknown as RequestRow[], filters.q);
  const hasAnyFilter = Boolean(filters.status || filters.q);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <PromotorNav />

      <h1 className="mb-4 text-2xl font-semibold">Minhas Solicitacoes</h1>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <form className="flex w-full gap-2 sm:max-w-md">
          {filters.status && <input type="hidden" name="status" value={filters.status} />}
          <input
            name="q"
            defaultValue={filters.q}
            placeholder="Buscar por numero, NFD ou loja..."
            className="min-w-0 flex-1 rounded-md border border-input px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Buscar
          </button>
        </form>

        <details className="group">
          <summary className="ml-auto flex w-fit cursor-pointer list-none items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
            <span>Filtros</span>
            {filters.status && <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">ativos</span>}
            <span className="text-xs group-open:hidden">abrir</span>
            <span className="hidden text-xs group-open:inline">fechar</span>
          </summary>

          <form className="mt-3 grid gap-3 rounded-md border border-border p-4 sm:min-w-[320px]">
            {filters.q && <input type="hidden" name="q" value={filters.q} />}
            <Field label="Status">
              <select name="status" defaultValue={filters.status} className="w-full rounded-md border border-input px-3 py-2 text-sm">
                <option value="">Todos</option>
                {Object.entries(STATUS_LABELS).map(([status, label]) => (
                  <option key={status} value={status}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex items-center gap-2">
              <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                Aplicar
              </button>
              <Link href="/promotor/solicitacoes" className="rounded-md border border-border px-4 py-2 text-sm">
                Limpar
              </Link>
            </div>
          </form>
        </details>
      </div>

      {hasAnyFilter && (
        <p className="mb-4 text-sm text-muted-foreground">
          {rows.length} resultado(s)
          {filters.status ? ` em ${STATUS_LABELS[filters.status]}` : ""}.{" "}
          <Link href="/promotor/solicitacoes" className="underline">
            limpar
          </Link>
        </p>
      )}

      <div className="space-y-2">
        {rows.map((request) => (
          <div key={request.id} className="flex items-center justify-between rounded-md border border-border p-4">
            <div>
              <p className="font-medium">{request.numero}</p>
              <p className="text-sm text-muted-foreground">
                {request.store?.nome ?? "-"} · {request.request_type?.nome ?? "-"} · NFD {request.nfd}
              </p>
            </div>
            <StatusBadge status={request.status} />
          </div>
        ))}

        {rows.length === 0 && (
          <div className="rounded-md border border-dashed border-border p-8 text-center text-muted-foreground">
            {hasAnyFilter
              ? "Nenhuma solicitacao encontrada com esses filtros."
              : "Voce ainda nao tem solicitacoes."}
          </div>
        )}
      </div>
    </main>
  );
}

function applyTextSearch(rows: RequestRow[], query: string) {
  if (!query) return rows;
  const term = query.toLowerCase();
  return rows.filter((request) =>
    [request.numero, request.nfd, request.store?.nome, request.request_type?.nome]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(term))
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}
