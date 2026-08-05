import { NextRequest, NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/requireApiRole";
import { createClient } from "@/lib/supabase/server";
import { novaSolicitacaoSchema } from "@/lib/validations/collectionRequest";

export async function POST(request: NextRequest) {
  try {
    const check = await requireApiRole(["PROMOTOR"]);
    if ("error" in check) return check.error;

    const body = await request.json();
    const parsed = novaSolicitacaoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Preencha todos os campos obrigatorios." },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // create_collection_request() cria a solicitacao e todos os itens em uma
    // transacao. Se houver conflito de NFD, nada fica gravado pela metade.
    const { data, error } = await supabase.rpc("create_collection_request", {
      p_store_id: parsed.data.storeId,
      p_vendedor: parsed.data.vendedor,
      p_nfd: parsed.data.nfd,
      p_request_type_id: parsed.data.requestTypeId,
      p_observacoes: parsed.data.observacoes,
      p_items: parsed.data.itens,
    });

    const created = data?.[0];

    if (error || !created) {
      const duplicated = error?.code === "23505";
      return NextResponse.json(
        {
          error: duplicated
            ? "Ja existe uma solicitacao em andamento com este NFD."
            : "Nao foi possivel criar a solicitacao.",
        },
        { status: duplicated ? 409 : 400 }
      );
    }

    return NextResponse.json({ id: created.id, numero: created.numero });
  } catch (err) {
    console.error("Erro em POST /api/solicitacoes:", err);
    return NextResponse.json(
      { error: "Erro inesperado ao criar a solicitacao." },
      { status: 500 }
    );
  }
}
