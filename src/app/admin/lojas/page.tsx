import { createClient } from "@/lib/supabase/server";
import { StoreManager } from "@/components/admin/StoreManager";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function LojasPage() {
  const supabase = createClient();
  const { data: stores } = await supabase
    .from("stores")
    .select("id, nome, cidade, endereco, ativo")
    .order("nome");

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <AdminNav />
      <h1 className="mb-6 text-2xl font-semibold">Lojas</h1>
      <StoreManager initialStores={stores ?? []} />
    </main>
  );
}
