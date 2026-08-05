"use client";

import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

export type EvidenceFileRow = {
  id: string;
  original_name: string;
  file_type: string;
  size_bytes: number;
};

export async function uploadEvidenceFile({
  requestId,
  file,
}: {
  requestId: string;
  file: File;
}): Promise<EvidenceFileRow> {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  let fileToUpload: File = file;

  if (IMAGE_EXTENSIONS.includes(extension)) {
    try {
      fileToUpload = await imageCompression(file, {
        maxWidthOrHeight: 1920,
        maxSizeMB: 1.5,
        initialQuality: 0.8,
        useWebWorker: true,
      });
    } catch {
      fileToUpload = file;
    }
  }

  const prepareResponse = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requestId,
      originalName: file.name,
      mimeType: fileToUpload.type || file.type,
      sizeBytes: fileToUpload.size,
    }),
  });
  const prepareResult = await prepareResponse.json();

  if (!prepareResponse.ok) {
    throw new Error(prepareResult.error ?? "Nao foi possivel preparar o upload.");
  }

  const supabase = createClient();

  const { error: uploadError } = await supabase.storage
    .from("collection-evidences")
    .uploadToSignedUrl(prepareResult.storagePath, prepareResult.token, fileToUpload);

  if (uploadError) {
    throw new Error("Falha ao enviar o arquivo.");
  }

  const { data: inserted, error: insertError } = await supabase
    .from("collection_request_files")
    .insert({
      request_id: requestId,
      file_type: prepareResult.fileType,
      storage_path: prepareResult.storagePath,
      original_name: file.name,
      mime_type: fileToUpload.type || file.type,
      size_bytes: fileToUpload.size,
    })
    .select("id, original_name, file_type, size_bytes")
    .single();

  if (insertError || !inserted) {
    throw new Error("Arquivo enviado, mas nao foi possivel registrar.");
  }

  await supabase.rpc("log_request_history", {
    p_request_id: requestId,
    p_action: "UPLOAD_ANEXO",
    p_observation: file.name,
  });

  return inserted as EvidenceFileRow;
}
