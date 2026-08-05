import Link from "next/link";
import { LogoutButton } from "@/components/auth/LogoutButton";

/**
 * Navegação simples da Área do Promotor. Mobile-first: os itens quebram
 * linha em telas estreitas em vez de espremer, conforme a Etapa 4.
 */
export function PromotorNav() {
  return (
    <nav className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
      <div className="flex flex-wrap gap-4 text-sm">
        <Link href="/promotor" className="text-muted-foreground hover:text-foreground">
          Início
        </Link>
        <Link href="/promotor/solicitacoes" className="text-muted-foreground hover:text-foreground">
          Minhas Solicitações
        </Link>
        <Link href="/promotor/perfil" className="text-muted-foreground hover:text-foreground">
          Perfil
        </Link>
      </div>
      <LogoutButton />
    </nav>
  );
}
