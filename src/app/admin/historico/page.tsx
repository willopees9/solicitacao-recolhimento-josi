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

type SearchParams = {
  q?: string;
  status?: string;
  loja?: string;
  cidade?: string;
  promotor?: string;
  tipo?: string;
};

type Option = { id: string; nome: string; cidade?: string };

export default async function HistoricoPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = createClient();
  const filters = normalizeFilters(searchParams);

  const [{ data: stores }, { data: promoters }, { data: requestTypes }] = await Promise.all([
    supabase.from("stores").select("id, nome, cidade").order("nome"),
    supabase.from("profiles").select("id, nome").eq("role", "PROMOTOR").order("nome"),
    supabase.from("request_types").select("id, nome").order("nome"),
  ]);

  const storeOptions = (stores ?? []) as unknown as Option[];
  const promotorOptions = (promoters ?? []) as unknown as Option[];
  const typeOptions = (requestTypes ?? []) as unknown as Option[];
  const cityOptions = Array.from(new Set(storeOptions.map((store) => store.cidade).filter(Boolean))).sort();
  const cityStoreIds = filters.cidade
    ? storeOptions.filter((store) => store.cidade === filters.cidade).map((store) => store.id)
    : null;

  let query = supabase
    .from("collection_requests")
    .select(
      "id, numero, status, created_at, reviewed_at, vendedor, nfd, store:store_id(nome, cidade), request_type:request_type_id(nome), promotor:promotor_id(nome)"
    )
    .in("status", filters.status ? [filters.status] : [...FINAL_STATUSES])
    .order("reviewed_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (filters.loja) query = query.eq("store_id", filters.loja);
  if (filters.promotor) query = query.eq("promotor_id", filters.promotor);
  if (filters.tipo) query = query.eq("request_type_id", filters.tipo);
  if (cityStoreIds) query = cityStoreIds.length > 0 ? query.in("store_id", cityStoreIds) : query.eq("store_id", "__none__");

  const { data: requests } = await query;
  const rows = applyTextSearch((requests ?? []) as unknown as RequestRow[], filters.q);
  const hasAdvancedFilters = Boolean(filters.loja || filters.cidade || filters.promotor || filters.tipo);
  const hasAnyFilter = Boolean(filters.q || filters.status || hasAdvancedFilters);
  const statusLinks = buildStatusLinks(filters);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <AdminNav />

      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Historico de Solicitacoes</h1>
        <p className="text-sm text-muted-foreground">
          Solicitacoes ja aprovadas ou rejeitadas para consulta administrativa.
        </p>
      </div>

      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <form className="flex w-full gap-2 sm:max-w-md">
            {filters.status && <input type="hidden" name="status" value={filters.status} />}
            <input
              name="q"
              defaultValue={filters.q}
              placeholder="Buscar por numero, NFD, loja, promotor..."
              className="min-w-0 flex-1 rounded-md border border-input px-3 py-2 text-sm"
            />
            <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              Buscar
            </button>
          </form>

          <details className="group">
            <summary className="ml-auto flex w-fit cursor-pointer list-none items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
              <span>Filtros</span>
              {hasAdvancedFilters && <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">ativos</span>}
              <span className="text-xs group-open:hidden">abrir</span>
              <span className="hidden text-xs group-open:inline">fechar</span>
            </summary>

            <form className="mt-3 grid gap-3 rounded-md border border-border p-4 sm:min-w-[720px] md:grid-cols-3">
              {filters.q && <input type="hidden" name="q" value={filters.q} />}
              {filters.status && <input type="hidden" name="status" value={filters.status} />}
              <Field label="Loja">
                <select name="loja" defaultValue={filters.loja} className="w-full rounded-md border border-input px-3 py-2 text-sm">
                  <option value="">Todas</option>
                  {storeOptions.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.nome}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Cidade">
                <select name="cidade" defaultValue={filters.cidade} className="w-full rounded-md border border-input px-3 py-2 text-sm">
                  <option value="">Todas</option>
                  {cityOptions.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Promotor">
                <select name="promotor" defaultValue={filters.promotor} className="w-full rounded-md border border-input px-3 py-2 text-sm">
                  <option value="">Todos</option>
                  {promotorOptions.map((promotor) => (
                    <option key={promotor.id} value={promotor.id}>
                      {promotor.nome}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Tipo">
                <select name="tipo" defaultValue={filters.tipo} className="w-full rounded-md border border-input px-3 py-2 text-sm">
                  <option value="">Todos</option>
                  {typeOptions.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.nome}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="flex items-end gap-2 md:col-span-2">
                <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                  Aplicar
                </button>
                <Link href={filters.status ? `/admin/historico?status=${filters.status}` : "/admin/historico"} className="rounded-md border border-border px-4 py-2 text-sm">
                  Limpar
                </Link>
              </div>
            </form>
          </details>
        </div>

        <div className="flex flex-wrap gap-2">
          {statusLinks.map((filter) => {
            const active = filters.status === filter.value;

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
      </div>

      {hasAnyFilter && (
        <p className="mb-3 text-sm text-muted-foreground">
          {rows.length} resultado(s) encontrado(s).{" "}
          <Link href="/admin/historico" className="underline">
            limpar
          </Link>
        </p>
      )}

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

function normalizeFilters(searchParams: SearchParams) {
  return {
    q: searchParams.q?.trim() ?? "",
    status: FINAL_STATUSES.includes(searchParams.status as (typeof FINAL_STATUSES)[number])
      ? searchParams.status ?? ""
      : "",
    loja: searchParams.loja ?? "",
    cidade: searchParams.cidade ?? "",
    promotor: searchParams.promotor ?? "",
    tipo: searchParams.tipo ?? "",
  };
}

function applyTextSearch(rows: RequestRow[], query: string) {
  if (!query) return rows;
  const term = query.toLowerCase();
  return rows.filter((request) =>
    [
      request.numero,
      request.nfd,
      request.vendedor,
      request.store?.nome,
      request.store?.cidade,
      request.promotor?.nome,
      request.request_type?.nome,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(term))
  );
}

function buildStatusLinks(filters: ReturnType<typeof normalizeFilters>) {
  const base = new URLSearchParams();
  if (filters.q) base.set("q", filters.q);
  if (filters.loja) base.set("loja", filters.loja);
  if (filters.cidade) base.set("cidade", filters.cidade);
  if (filters.promotor) base.set("promotor", filters.promotor);
  if (filters.tipo) base.set("tipo", filters.tipo);

  return [
    { href: `/admin/historico${base.toString() ? `?${base.toString()}` : ""}`, label: "Todas", value: "" },
    { href: withStatus(base, "APROVADA"), label: "Aprovadas", value: "APROVADA" },
    { href: withStatus(base, "REJEITADA"), label: "Rejeitadas", value: "REJEITADA" },
  ];
}

function withStatus(base: URLSearchParams, status: string) {
  const params = new URLSearchParams(base);
  params.set("status", status);
  return `/admin/historico?${params.toString()}`;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}
