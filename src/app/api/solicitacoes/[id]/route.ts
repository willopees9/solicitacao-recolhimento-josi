import { NextRequest, NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/requireApiRole";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const check = await requireApiRole(["PROMOTOR"]);
  if ("error" in check) return check.error;

  const supabase = createClient();

  const { data: request } = await supabase
    .from("collection_requests")
    .select("id, status")
    .eq("id", params.id)
    .single();

  if (!request) {
    return NextResponse.json({ error: "Solicitacao nao encontrada." }, { status: 404 });
  }

  if (request.status !== "AGUARDANDO_CONFERENCIA") {
    return NextResponse.json(
      { error: "Esta solicitacao nao pode ser removida automaticamente." },
      { status: 403 }
    );
  }

  let serviceClient;
  try {
    serviceClient = createServiceRoleClient();
  } catch {
    return NextResponse.json(
      { error: "Servidor sem permissao para limpeza automatica." },
      { status: 500 }
    );
  }

  const { data: files } = await serviceClient
    .from("collection_request_files")
    .select("storage_path")
    .eq("request_id", params.id);

  const paths = files?.map((file) => file.storage_path).filter(Boolean) ?? [];
  if (paths.length > 0) {
    await serviceClient.storage.from("collection-evidences").remove(paths);
  }

  const { error } = await serviceClient
    .from("collection_requests")
    .delete()
    .eq("id", params.id);

  if (error) {
    return NextResponse.json(
      { error: "Nao foi possivel limpar a solicitacao criada sem anexo." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
