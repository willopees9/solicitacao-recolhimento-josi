import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/profile";
import { PromotorNav } from "@/components/promotor/PromotorNav";
import { cn } from "@/lib/utils";

const STATUS_CARDS = [
  { status: "AGUARDANDO_CONFERENCIA", label: "Aguardando Conferência" },
  { status: "AGUARDANDO_CORRECAO", label: "Aguardando Correção" },
  { status: "APROVADA", label: "Aprovadas" },
  { status: "REJEITADA", label: "Rejeitadas" },
] as const;

/**
 * Home real do Promotor, conforme a Etapa 4 (wireframe da seção 3). O
 * botão "Nova Solicitação" já existe mas fica desabilitado nesta sprint —
 * o formulário de criação é construído na Sprint 6. Preferi deixar o
 * botão visível e claramente "em breve" a esconder a funcionalidade,
 * para o fluxo da tela já ficar correto desde já.
 */
export default async function PromotorHomePage() {
  const profile = await getCurrentProfile();
  const supabase = createClient();

  // RLS já garante que só vêm solicitações do próprio Promotor — não é
  // preciso filtrar por promotor_id aqui, o banco faz isso sozinho.
  const { data: requests } = await supabase.from("collection_requests").select("status");

  const counts = STATUS_CARDS.reduce<Record<string, number>>((acc, card) => {
    acc[card.status] = requests?.filter((r) => r.status === card.status).length ?? 0;
    return acc;
  }, {});

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <PromotorNav />

      <h1 className="mb-1 text-2xl font-semibold">
        Olá, {profile?.nome?.split(" ")[0] ?? "Promotor"}
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">O que você precisa fazer hoje?</p>

      <Link
        href="/promotor/solicitacoes/nova"
        className="mb-8 block w-full rounded-md bg-primary px-4 py-3 text-center text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        + Nova Solicitação
      </Link>

      <h2 className="mb-3 text-sm font-medium text-muted-foreground">Minhas Solicitações</h2>
      <div className="grid grid-cols-2 gap-3">
        {STATUS_CARDS.map((card) => (
          <Link
            key={card.status}
            href={`/promotor/solicitacoes?status=${card.status}`}
            className={cn(
              "rounded-lg border border-border p-4 transition-colors hover:bg-secondary",
              card.status === "AGUARDANDO_CORRECAO" &&
                (counts[card.status] ?? 0) > 0 &&
                "border-status-aguardandoCorrecao bg-status-aguardandoCorrecao/10"
            )}
          >
            <p className="text-2xl font-semibold">{counts[card.status] ?? 0}</p>
            <p className="text-sm text-muted-foreground">{card.label}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
