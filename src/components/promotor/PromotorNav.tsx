import Link from "next/link";
import { LogoutButton } from "@/components/auth/LogoutButton";

/**
 * Navegação simples da Área do Promotor. Mobile-first: os itens quebram
 * linha em telas estreitas em vez de espremer, conforme a Etapa 4.
 */
export function PromotorNav() {
  return (
    <nav className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-[18px] bg-white px-3 py-3 shadow-sm">
      <div className="flex flex-wrap gap-2 text-sm">
        <Link href="/promotor" className="rounded-md px-3 py-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
          Início
        </Link>
        <Link href="/promotor/solicitacoes" className="rounded-md px-3 py-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
          Minhas Solicitações
        </Link>
        <Link href="/promotor/perfil" className="rounded-md px-3 py-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
          Perfil
        </Link>
      </div>
      <LogoutButton />
    </nav>
  );
}
