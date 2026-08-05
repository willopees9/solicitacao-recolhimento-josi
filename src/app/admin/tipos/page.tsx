import { createClient } from "@/lib/supabase/server";
import { RequestTypeManager } from "@/components/admin/RequestTypeManager";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function TiposPage() {
  const supabase = createClient();
  const { data: types } = await supabase
    .from("request_types")
    .select("id, nome, ativo")
    .order("nome");

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <AdminNav />
      <h1 className="mb-6 text-2xl font-semibold">Tipos de Solicitação</h1>
      <RequestTypeManager initialTypes={types ?? []} />
    </main>
  );
}
