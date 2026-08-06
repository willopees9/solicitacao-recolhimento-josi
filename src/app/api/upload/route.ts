import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireApiRole } from "@/lib/auth/requireApiRole";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import { MAX_FILES_PER_REQUEST, validateUploadRequest } from "@/lib/upload/policy";

export async function POST(request: NextRequest) {
  try {
    const check = await requireApiRole(["PROMOTOR"]);
    if ("error" in check) return check.error;

    const body = await request.json();
    const validation = validateUploadRequest(body as {
      requestId?: string;
      originalName?: string;
      mimeType?: string;
      sizeBytes?: number;
    });

    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    const supabase = createClient();

    const { data: existingRequest } = await supabase
      .from("collection_requests")
      .select("id, status")
      .eq("id", validation.requestId)
      .single();

    if (!existingRequest) {
      return NextResponse.json({ error: "Solicitacao nao encontrada." }, { status: 404 });
    }

    if (!["AGUARDANDO_CONFERENCIA", "AGUARDANDO_CORRECAO"].includes(existingRequest.status)) {
      return NextResponse.json(
        { error: "Nao e possivel anexar arquivos neste status da solicitacao." },
        { status: 403 }
      );
    }

    const { count } = await supabase
      .from("collection_request_files")
      .select("id", { count: "exact", head: true })
      .eq("request_id", validation.requestId);

    if ((count ?? 0) >= MAX_FILES_PER_REQUEST) {
      return NextResponse.json(
        { error: `Limite de ${MAX_FILES_PER_REQUEST} anexos por solicitacao atingido.` },
        { status: 400 }
      );
    }

    const storagePath = `${validation.requestId}/${randomUUID()}-${validation.sanitizedName}`;

    let storageClient;
    try {
      storageClient = createServiceRoleClient();
    } catch {
      return NextResponse.json(
        { error: "Servidor sem chave de storage configurada." },
        { status: 500 }
      );
    }

    const { data: signedUpload, error: signedError } = await storageClient.storage
      .from("collection-evidences")
      .createSignedUploadUrl(storagePath);

    if (signedError || !signedUpload) {
      console.error("Erro ao gerar signed upload URL:", signedError);
      return NextResponse.json(
        { error: signedError?.message ?? "Nao foi possivel gerar a URL de upload." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        storagePath,
        token: signedUpload.token,
        fileType: validation.fileType,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("Erro em POST /api/upload:", err);
    return NextResponse.json({ error: "Erro inesperado ao preparar o upload." }, { status: 500 });
  }
}
