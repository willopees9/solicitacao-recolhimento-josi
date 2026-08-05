import { createClient } from "@/lib/supabase/server";
import { ProductManager } from "@/components/admin/ProductManager";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function ProdutosPage() {
  const supabase = createClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, codigo, descricao, unidade, ativo")
    .order("codigo");

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <AdminNav />
      <h1 className="mb-6 text-2xl font-semibold">Produtos</h1>
      <ProductManager initialProducts={products ?? []} />
    </main>
  );
}
