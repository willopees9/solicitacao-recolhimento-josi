import { NextRequest, NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/requireApiRole";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import { logSecurityEvent } from "@/lib/auth/securityLog";
import { updateUserSchema } from "@/lib/validations/admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const check = await requireApiRole(["ADMIN"]);
    if ("error" in check) return check.error;

    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
        { status: 400 }
      );
    }

    let serviceClient;
    try {
      serviceClient = createServiceRoleClient();
    } catch {
      return NextResponse.json(
        {
          error:
            "SUPABASE_SERVICE_ROLE_KEY não configurada no .env.local. Veja o README para saber onde encontrar essa chave no painel do Supabase.",
        },
        { status: 500 }
      );
    }

    const { error } = await serviceClient
      .from("profiles")
      .update({
        nome: parsed.data.nome,
        telefone: parsed.data.telefone || null,
        role: parsed.data.role,
        ativo: parsed.data.ativo,
      })
      .eq("id", params.id);

    if (error) {
      return NextResponse.json(
        { error: "Não foi possível atualizar o usuário." },
        { status: 400 }
      );
    }

    await logSecurityEvent({
      action: parsed.data.ativo ? "USUARIO_ATIVADO" : "USUARIO_DESATIVADO",
      entity: "profiles",
      entityId: params.id,
      metadata: { role: parsed.data.role },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Erro em PATCH /api/admin/usuarios/[id]:", err);
    return NextResponse.json(
      { error: "Erro inesperado ao atualizar o usuário. Veja o terminal do servidor para detalhes." },
      { status: 500 }
    );
  }
}
