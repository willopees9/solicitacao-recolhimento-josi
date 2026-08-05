import { NextRequest, NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/requireApiRole";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import { reviewDecisionSchema } from "@/lib/validations/admin";

const REVIEWABLE_STATUSES = ["AGUARDANDO_CONFERENCIA", "AGUARDANDO_CORRECAO"];

const DECISION_CONFIG = {
  APROVAR: {
    status: "APROVADA",
    action: "APROVACAO",
  },
  SOLICITAR_CORRECAO: {
    status: "AGUARDANDO_CORRECAO",
    action: "SOLICITACAO_CORRECAO",
  },
  REJEITAR: {
    status: "REJEITADA",
    action: "REJEICAO",
  },
} as const;

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const check = await requireApiRole(["ADMIN"]);
    if ("error" in check) return check.error;

    const body = await request.json();
    const parsed = reviewDecisionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados invalidos." },
        { status: 400 }
      );
    }

    const config = DECISION_CONFIG[parsed.data.decision];
    const note = parsed.data.note?.trim() || null;
    const serviceClient = createServiceRoleClient();

    const { data: existingRequest, error: readError } = await serviceClient
      .from("collection_requests")
      .select("id, status")
      .eq("id", params.id)
      .single();

    if (readError || !existingRequest) {
      return NextResponse.json(
        { error: "Solicitacao nao encontrada." },
        { status: 404 }
      );
    }

    if (!REVIEWABLE_STATUSES.includes(existingRequest.status)) {
      return NextResponse.json(
        { error: "Esta solicitacao nao esta disponivel para conferencia." },
        { status: 409 }
      );
    }

    const updatePayload: Record<string, unknown> = {
      status: config.status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: check.profile.id,
    };

    if (parsed.data.decision === "SOLICITAR_CORRECAO") {
      updatePayload.correction_notes = note;
      updatePayload.rejection_reason = null;
    }

    if (parsed.data.decision === "REJEITAR") {
      updatePayload.rejection_reason = note;
    }

    if (parsed.data.decision === "APROVAR") {
      updatePayload.correction_notes = null;
      updatePayload.rejection_reason = null;
    }

    const { error: updateError } = await serviceClient
      .from("collection_requests")
      .update(updatePayload)
      .eq("id", params.id);

    if (updateError) {
      return NextResponse.json(
        { error: "Nao foi possivel registrar a decisao." },
        { status: 500 }
      );
    }

    await serviceClient.from("collection_request_history").insert({
      request_id: params.id,
      user_id: check.profile.id,
      action: config.action,
      observation: note,
      previous_data: { status: existingRequest.status },
      new_data: { status: config.status },
    });

    return NextResponse.json({ ok: true, status: config.status });
  } catch (err) {
    console.error("Erro em POST /api/admin/solicitacoes/[id]/decisao:", err);
    return NextResponse.json(
      { error: "Erro inesperado ao registrar a decisao." },
      { status: 500 }
    );
  }
}
