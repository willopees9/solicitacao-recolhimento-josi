import { getCurrentProfile } from "@/lib/auth/profile";
import { LogoutButton } from "@/components/auth/LogoutButton";

/**
 * Exibida quando um usuário autenticado tenta acessar uma área que não é a
 * sua (ex: Promotor tentando /admin). Por decisão da Etapa 2, o sistema
 * NUNCA redireciona silenciosamente para a área certa nesse caso — mostra
 * esta tela, deixando claro que o acesso foi negado, o que também torna o
 * evento visível para quem estiver testando/auditando o sistema.
 */
export default async function AcessoNegadoPage() {
  const profile = await getCurrentProfile();

  const minhaAreaHref =
    profile?.role === "ADMIN" ? "/admin" : profile?.role === "PROMOTOR" ? "/promotor" : "/login";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">Acesso negado</h1>
      <p className="max-w-md text-muted-foreground">
        Você não tem permissão para acessar esta área do sistema.
      </p>
      <div className="flex items-center gap-4">
        <a href={minhaAreaHref} className="text-sm underline">
          Voltar à minha área
        </a>
        <LogoutButton />
      </div>
    </main>
  );
}
