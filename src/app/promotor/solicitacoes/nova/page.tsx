import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PromotorNav } from "@/components/promotor/PromotorNav";
import { NovaSolicitacaoForm } from "@/components/promotor/NovaSolicitacaoForm";

export default async function NovaSolicitacaoPage() {
  const supabase = createClient();

  const [
    { data: stores, error: storesError },
    { data: requestTypes, error: typesError },
  ] = await Promise.all([
    supabase.from("stores").select("id, nome, cidade").eq("ativo", true).order("nome"),
    supabase.from("request_types").select("id, nome").eq("ativo", true).order("nome"),
  ]);

  const noStores = !storesError && (!stores || stores.length === 0);
  const noTypes = !typesError && (!requestTypes || requestTypes.length === 0);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <PromotorNav />
      <h1 className="mb-6 text-2xl font-semibold">Nova Solicitação</h1>

      {(storesError || typesError) && (
        <p className="mb-6 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          Não foi possível carregar lojas ou tipos agora. Tente recarregar a
          página.
        </p>
      )}

      {(noStores || noTypes) && !storesError && !typesError && (
        <p className="mb-6 rounded-md border border-status-aguardandoCorrecao bg-status-aguardandoCorrecao/10 p-3 text-sm">
          {noStores && "Nenhuma loja ativa cadastrada. "}
          {noTypes && "Nenhum tipo de solicitação ativo cadastrado. "}
          Peça para um Admin cadastrar em{" "}
          <Link href="/admin/lojas" className="underline">
            Lojas
          </Link>{" "}
          e{" "}
          <Link href="/admin/tipos" className="underline">
            Tipos
          </Link>{" "}
          antes de continuar.
        </p>
      )}

      <NovaSolicitacaoForm stores={stores ?? []} requestTypes={requestTypes ?? []} />
    </main>
  );
}
