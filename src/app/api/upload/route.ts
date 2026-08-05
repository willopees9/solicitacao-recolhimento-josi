import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireApiRole } from "@/lib/auth/requireApiRole";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "mp4", "mov", "pdf", "xml"];

const MAX_SIZES: Record<string, number> = {
  jpg: 8 * 1024 * 1024,
  jpeg: 8 * 1024 * 1024,
  png: 8 * 1024 * 1024,
  webp: 8 * 1024 * 1024,
  mp4: 100 * 1024 * 1024,
  mov: 100 * 1024 * 1024,
  pdf: 15 * 1024 * 1024,
  xml: 15 * 1024 * 1024,
};

const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  png: ["image/png"],
  webp: ["image/webp"],
  mp4: ["video/mp4"],
  mov: ["video/quicktime", "video/mp4"],
  pdf: ["application/pdf"],
  xml: ["application/xml", "text/xml"],
};

const MAX_FILES_PER_REQUEST = 20;

function fileTypeFromExtension(ext: string): "FOTO" | "VIDEO" | "PDF" | "XML" | null {
  if (["jpg", "jpeg", "png", "webp"].includes(ext)) return "FOTO";
  if (["mp4", "mov"].includes(ext)) return "VIDEO";
  if (ext === "pdf") return "PDF";
  if (ext === "xml") return "XML";
  return null;
}

function isAllowedMimeType(extension: string, mimeType: string) {
  const allowed = ALLOWED_MIME_TYPES[extension] ?? [];
  return allowed.includes(mimeType);
}

export async function POST(request: NextRequest) {
  try {
    const check = await requireApiRole(["PROMOTOR"]);
    if ("error" in check) return check.error;

    const body = await request.json();
    const { requestId, originalName, mimeType, sizeBytes } = body as {
      requestId?: string;
      originalName?: string;
      mimeType?: string;
      sizeBytes?: number;
    };

    if (!requestId || !originalName || !mimeType || typeof sizeBytes !== "number") {
      return NextResponse.json({ error: "Dados de upload incompletos." }, { status: 400 });
    }

    const extension = originalName.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return NextResponse.json({ error: "Tipo de arquivo nao permitido." }, { status: 400 });
    }

    if (!isAllowedMimeType(extension, mimeType)) {
      return NextResponse.json({ error: "MIME type nao permitido para este arquivo." }, { status: 400 });
    }

    const fileType = fileTypeFromExtension(extension);
    if (!fileType) {
      return NextResponse.json({ error: "Tipo de arquivo nao reconhecido." }, { status: 400 });
    }

    const maxSize = MAX_SIZES[extension];
    if (!maxSize || sizeBytes > maxSize) {
      return NextResponse.json(
        { error: "Arquivo acima do tamanho maximo permitido para este tipo." },
        { status: 400 }
      );
    }

    const supabase = createClient();

    const { data: existingRequest } = await supabase
      .from("collection_requests")
      .select("id, status")
      .eq("id", requestId)
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
      .eq("request_id", requestId);

    if ((count ?? 0) >= MAX_FILES_PER_REQUEST) {
      return NextResponse.json(
        { error: `Limite de ${MAX_FILES_PER_REQUEST} anexos por solicitacao atingido.` },
        { status: 400 }
      );
    }

    const sanitized = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${requestId}/${randomUUID()}-${sanitized}`;

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

    return NextResponse.json({
      storagePath,
      token: signedUpload.token,
      fileType,
    });
  } catch (err) {
    console.error("Erro em POST /api/upload:", err);
    return NextResponse.json({ error: "Erro inesperado ao preparar o upload." }, { status: 500 });
  }
}
