import { NextRequest, NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/requireApiRole";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import { logSecurityEvent } from "@/lib/auth/securityLog";
import { createUserSchema } from "@/lib/validations/admin";
import { generateTemporaryPassword } from "@/lib/security/password";

/**
 * Gera uma senha provisória aleatória. O usuário é obrigado a trocá-la no
 * primeiro acesso (primeiro_acesso = true, definido por padrão na tabela).
 * Não existe envio de e-mail configurado neste MVP — a senha é devolvida
 * na resposta para o Admin repassar manualmente ao usuário.
 */
export async function POST(request: NextRequest) {
  try {
    const check = await requireApiRole(["ADMIN"]);
    if ("error" in check) return check.error;

    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
        { status: 400 }
      );
    }

    const { nome, email, telefone, role } = parsed.data;
    const temporaryPassword = generateTemporaryPassword();

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

    // O trigger public.handle_new_user() (migração 0002) cria o registro em
    // public.profiles automaticamente, lendo nome/telefone/role a partir do
    // user_metadata informado aqui.
    const { data, error } = await serviceClient.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true, // sem SMTP configurado neste MVP — dispensa confirmação por e-mail
      user_metadata: { nome, telefone: telefone || null, role },
    });

    if (error || !data.user) {
      const duplicated = error?.message?.toLowerCase().includes("already registered");
      return NextResponse.json(
        { error: duplicated ? "Já existe um usuário com este e-mail." : "Não foi possível criar o usuário." },
        { status: 400 }
      );
    }

    await logSecurityEvent({
      action: "USUARIO_CRIADO",
      entity: "profiles",
      entityId: data.user.id,
      metadata: { email, role },
    });

    return NextResponse.json(
      { id: data.user.id, temporaryPassword },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    // Rede de segurança final: qualquer erro inesperado (ex: falha de rede
    // com o Supabase) sempre volta como JSON, nunca como resposta vazia —
    // é exatamente esse tipo de falha silenciosa que causava o erro
    // "Unexpected end of JSON input" no navegador.
    console.error("Erro em POST /api/admin/usuarios:", err);
    return NextResponse.json(
      { error: "Erro inesperado ao criar o usuário. Veja o terminal do servidor para detalhes." },
      { status: 500 }
    );
  }
}
