import { NextResponse } from "next/server";
import { getCurrentProfile, type Profile } from "@/lib/auth/profile";
import { logSecurityEvent } from "@/lib/auth/securityLog";

/**
 * Equivalente ao requireRole() (usado em layouts), mas para Route Handlers
 * — que não podem chamar redirect(), só devolver uma resposta HTTP. Todo
 * endpoint sob /api/admin/* deve começar chamando esta função.
 *
 * Uso típico:
 *   const check = await requireApiRole(["ADMIN"]);
 *   if ("error" in check) return check.error;
 *   const { profile } = check;
 */
export async function requireApiRole(
  allowedRoles: Array<Profile["role"]>
): Promise<{ profile: Profile } | { error: NextResponse }> {
  const profile = await getCurrentProfile();

  if (!profile) {
    return { error: NextResponse.json({ error: "Não autenticado." }, { status: 401 }) };
  }

  if (!profile.ativo) {
    return { error: NextResponse.json({ error: "Usuário inativo." }, { status: 403 }) };
  }

  if (!allowedRoles.includes(profile.role)) {
    await logSecurityEvent({
      action: "ACESSO_NEGADO_API",
      entity: "route",
      metadata: { role: profile.role, permitido: allowedRoles },
    });
    return { error: NextResponse.json({ error: "Acesso negado." }, { status: 403 }) };
  }

  return { profile };
}
