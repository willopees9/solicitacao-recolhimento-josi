import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/profile";

/**
 * Rota raiz. A partir desta sprint, quem já está logado é redirecionado
 * direto para sua área (Etapa 1, seção 13) — esta página só serve de porta
 * de entrada para quem ainda não está autenticado.
 */
export default async function HomePage() {
  const profile = await getCurrentProfile();

  if (profile) {
    redirect(profile.role === "ADMIN" ? "/admin/dashboard" : "/promotor");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">
        Sistema de Solicitação de Recolhimento
      </h1>
      <a href="/login" className="text-sm underline">
        Ir para o login
      </a>
    </main>
  );
}
