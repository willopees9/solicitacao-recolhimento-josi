import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { createClient } from "@/lib/supabase/server";

type SearchParams = {
  periodo?: string;
  inicio?: string;
  fim?: string;
  loja?: string;
  cidade?: string;
  promotor?: string;
  tipo?: string;
};

type RelatedName = { nome?: string; cidade?: string } | null;
type RequestRow = {
  id: string;
  numero: string;
  status: string;
  created_at: string;
  store: RelatedName;
  request_type: RelatedName;
  promotor: RelatedName;
};

type Option = {
  id: string;
  nome: string;
  cidade?: string;
};

const STATUS_ORDER = ["AGUARDANDO_CONFERENCIA", "AGUARDANDO_CORRECAO", "APROVADA", "REJEITADA"];
const PERIOD_OPTIONS = [
  { value: "hoje", label: "Hoje" },
  { value: "7d", label: "Ultimos 7 dias" },
  { value: "30d", label: "Ultimos 30 dias" },
  { value: "custom", label: "Personalizado" },
];

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = createClient();
  const filters = normalizeFilters(searchParams);
  const period = resolvePeriod(filters);
  const today = getSaoPauloDateString(new Date());
  const todayRange = {
    start: `${today}T00:00:00.000-03:00`,
    end: `${today}T23:59:59.999-03:00`,
  };

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

  const [periodRows, todayRows] = await Promise.all([
    loadRequests({ supabase, filters, period, cityStoreIds }),
    loadRequests({ supabase, filters, period: todayRange, cityStoreIds }),
  ]);

  const statusCounts = countBy(periodRows, (request) => request.status);
  const typeCounts = countBy(periodRows, (request) => request.request_type?.nome ?? "Sem tipo");
  const promotorCounts = countBy(periodRows, (request) => request.promotor?.nome ?? "Sem promotor");
  const topPromoters = Object.entries(promotorCounts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5);

  const query = buildQuery(filters);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <AdminNav />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard Administrativo</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Indicadores operacionais de solicitacoes por periodo, loja, cidade, promotor e tipo.
          </p>
        </div>
        <LogoutButton />
      </div>

      <form className="mb-6 grid gap-3 rounded-md border border-border p-4 md:grid-cols-3 lg:grid-cols-6">
        <Field label="Periodo">
          <select name="periodo" defaultValue={filters.periodo} className="w-full rounded-md border border-input px-3 py-2 text-sm">
            {PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Inicio">
          <input
            name="inicio"
            type="date"
            defaultValue={filters.inicio}
            className="w-full rounded-md border border-input px-3 py-2 text-sm"
          />
        </Field>

        <Field label="Fim">
          <input
            name="fim"
            type="date"
            defaultValue={filters.fim}
            className="w-full rounded-md border border-input px-3 py-2 text-sm"
          />
        </Field>

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
          <select
            name="promotor"
            defaultValue={filters.promotor}
            className="w-full rounded-md border border-input px-3 py-2 text-sm"
          >
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

        <div className="flex items-end gap-2 md:col-span-2 lg:col-span-5">
          <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Aplicar filtros
          </button>
          <Link href="/admin/dashboard" className="rounded-md border border-border px-4 py-2 text-sm">
            Limpar
          </Link>
        </div>
      </form>

      <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-6">
        <MetricCard label="Hoje" value={todayRows.length} />
        <MetricCard label="Total no periodo" value={periodRows.length} />
        <MetricCard label="Aguardando conferencia" value={statusCounts.AGUARDANDO_CONFERENCIA ?? 0} />
        <MetricCard label="Aguardando correcao" value={statusCounts.AGUARDANDO_CORRECAO ?? 0} />
        <MetricCard label="Aprovadas" value={statusCounts.APROVADA ?? 0} />
        <MetricCard label="Rejeitadas" value={statusCounts.REJEITADA ?? 0} />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-3">
        <SummaryPanel title="Por status">
          {STATUS_ORDER.map((status) => (
            <div key={status} className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-b-0">
              <StatusBadge status={status} />
              <span className="font-semibold">{statusCounts[status] ?? 0}</span>
            </div>
          ))}
        </SummaryPanel>

        <SummaryPanel title="Por tipo">
          <RankedList rows={Object.entries(typeCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))} empty="Nenhum tipo no periodo." />
        </SummaryPanel>

        <SummaryPanel title="Top promotores">
          <RankedList rows={topPromoters} empty="Nenhum promotor no periodo." />
        </SummaryPanel>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">Solicitacoes recentes no periodo</h2>
          <Link href={`/admin/historico${query ? `?${query}` : ""}`} className="text-sm text-primary underline">
            Ver historico
          </Link>
        </div>

        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-secondary">
              <tr>
                <th className="px-4 py-3 font-medium">Numero</th>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Loja</th>
                <th className="px-4 py-3 font-medium">Cidade</th>
                <th className="px-4 py-3 font-medium">Promotor</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {periodRows.slice(0, 10).map((request) => (
                <tr key={request.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{request.numero}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(request.created_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">{request.store?.nome ?? "-"}</td>
                  <td className="px-4 py-3">{request.store?.cidade ?? "-"}</td>
                  <td className="px-4 py-3">{request.promotor?.nome ?? "-"}</td>
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

              {periodRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                    Nenhuma solicitacao encontrada para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

async function loadRequests({
  supabase,
  filters,
  period,
  cityStoreIds,
}: {
  supabase: ReturnType<typeof createClient>;
  filters: ReturnType<typeof normalizeFilters>;
  period: { start: string; end: string };
  cityStoreIds: string[] | null;
}) {
  if (cityStoreIds && cityStoreIds.length === 0) {
    return [];
  }

  let query = supabase
    .from("collection_requests")
    .select(
      "id, numero, status, created_at, store:store_id(nome, cidade), request_type:request_type_id(nome), promotor:promotor_id(nome)"
    )
    .gte("created_at", period.start)
    .lte("created_at", period.end)
    .order("created_at", { ascending: false });

  if (filters.loja) query = query.eq("store_id", filters.loja);
  if (filters.promotor) query = query.eq("promotor_id", filters.promotor);
  if (filters.tipo) query = query.eq("request_type_id", filters.tipo);
  if (cityStoreIds) query = query.in("store_id", cityStoreIds);

  const { data } = await query;
  return (data ?? []) as unknown as RequestRow[];
}

function normalizeFilters(searchParams: SearchParams) {
  return {
    periodo: searchParams.periodo && ["hoje", "7d", "30d", "custom"].includes(searchParams.periodo) ? searchParams.periodo : "hoje",
    inicio: isDateInput(searchParams.inicio) ? searchParams.inicio : "",
    fim: isDateInput(searchParams.fim) ? searchParams.fim : "",
    loja: searchParams.loja ?? "",
    cidade: searchParams.cidade ?? "",
    promotor: searchParams.promotor ?? "",
    tipo: searchParams.tipo ?? "",
  };
}

function resolvePeriod(filters: ReturnType<typeof normalizeFilters>) {
  if (filters.periodo === "custom" && filters.inicio && filters.fim) {
    return {
      start: `${filters.inicio}T00:00:00.000-03:00`,
      end: `${filters.fim}T23:59:59.999-03:00`,
    };
  }

  const today = getSaoPauloDateString(new Date());
  const days = filters.periodo === "30d" ? 29 : filters.periodo === "7d" ? 6 : 0;
  const start = subtractDays(today, days);

  return {
    start: `${start}T00:00:00.000-03:00`,
    end: `${today}T23:59:59.999-03:00`,
  };
}

function getSaoPauloDateString(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function subtractDays(dateString: string, days: number) {
  const date = new Date(`${dateString}T12:00:00.000-03:00`);
  date.setDate(date.getDate() - days);
  return getSaoPauloDateString(date);
}

function isDateInput(value?: string) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function countBy<T>(rows: T[], getKey: (row: T) => string) {
  return rows.reduce<Record<string, number>>((acc, row) => {
    const key = getKey(row);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

function buildQuery(filters: ReturnType<typeof normalizeFilters>) {
  const params = new URLSearchParams();
  if (filters.periodo) params.set("periodo", filters.periodo);
  if (filters.inicio) params.set("inicio", filters.inicio);
  if (filters.fim) params.set("fim", filters.fim);
  if (filters.loja) params.set("loja", filters.loja);
  if (filters.cidade) params.set("cidade", filters.cidade);
  if (filters.promotor) params.set("promotor", filters.promotor);
  if (filters.tipo) params.set("tipo", filters.tipo);
  return params.toString();
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border p-4">
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function SummaryPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-border p-4">
      <h2 className="mb-2 text-sm font-medium text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}

function RankedList({ rows, empty }: { rows: [string, number][]; empty: string }) {
  if (rows.length === 0) {
    return <p className="py-4 text-sm text-muted-foreground">{empty}</p>;
  }

  return (
    <div>
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between gap-3 border-b border-border py-3 text-sm last:border-b-0">
          <span className="truncate">{label}</span>
          <span className="font-semibold">{value}</span>
        </div>
      ))}
    </div>
  );
}
