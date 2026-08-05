import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, type Profile } from "@/lib/auth/profile";
import { logSecurityEvent } from "@/lib/auth/securityLog";

/**
 * Camada 1 de proteção de rota (aplicação/servidor), conforme decidido na
 * Etapa 2. Deve ser chamada no topo de todo layout protegido (/promotor,
 * /admin) — nunca só em componentes filhos, para garantir que nenhuma
 * página nova esqueça a checagem.
 *
 * A Camada 2 (RLS, no banco) continua valendo de forma independente: mesmo
 * que alguém chame a API do Supabase diretamente, sem passar por esta
 * função, o Postgres ainda bloqueia o acesso indevido a dado.
 *
 * A separação entre áreas é estrita nos dois sentidos: um Promotor nunca
 * acessa /admin, e um Admin nunca acessa /promotor — cada perfil só entra
 * na sua própria área, conforme a "separação real" exigida na Etapa 1.
 */
export async function requireRole(
  allowedRoles: Array<Profile["role"]>
): Promise<Profile> {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (!profile.ativo) {
    // Usuário foi desativado pelo Admin depois de já ter uma sessão válida.
    // Não basta negar a rota — a sessão precisa ser encerrada.
    const supabase = createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  if (!allowedRoles.includes(profile.role)) {
    await logSecurityEvent({
      action: "ACESSO_NEGADO",
      entity: "route",
      metadata: { role: profile.role, permitido: allowedRoles },
    });
    redirect("/acesso-negado");
  }

  return profile;
}
