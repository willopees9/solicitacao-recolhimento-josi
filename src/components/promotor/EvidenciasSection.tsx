"use client";

import { useState, type ChangeEvent } from "react";
import { FileGallery } from "@/components/shared/FileGallery";
import { uploadEvidenceFile, type EvidenceFileRow } from "@/lib/upload/evidences";

const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "mp4", "mov", "pdf", "xml"];

type UploadStatus = "comprimindo" | "enviando" | "enviado" | "erro";

type UploadItem = {
  localId: string;
  name: string;
  status: UploadStatus;
  errorMessage?: string;
};

export function EvidenciasSection({
  requestId,
  initialFiles,
  editable,
}: {
  requestId: string;
  initialFiles: EvidenceFileRow[];
  editable: boolean;
}) {
  const [files, setFiles] = useState<EvidenceFileRow[]>(initialFiles);
  const [uploads, setUploads] = useState<UploadItem[]>([]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";

    for (const file of selected) {
      await handleSingleFile(file);
    }
  }

  async function handleSingleFile(file: File) {
    const localId = crypto.randomUUID();
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      setUploads((prev) => [
        ...prev,
        { localId, name: file.name, status: "erro", errorMessage: "Tipo de arquivo nao permitido." },
      ]);
      return;
    }

    setUploads((prev) => [...prev, { localId, name: file.name, status: "comprimindo" }]);
    setUploads((prev) =>
      prev.map((item) => (item.localId === localId ? { ...item, status: "enviando" } : item))
    );

    try {
      const inserted = await uploadEvidenceFile({ requestId, file });
      setFiles((prev) => [...prev, inserted]);
      setUploads((prev) =>
        prev.map((item) => (item.localId === localId ? { ...item, status: "enviado" } : item))
      );
    } catch (err) {
      setUploads((prev) =>
        prev.map((item) =>
          item.localId === localId
            ? {
                ...item,
                status: "erro",
                errorMessage: err instanceof Error ? err.message : "Erro ao enviar.",
              }
            : item
        )
      );
    }
  }

  return (
    <div className="space-y-4">
      <FileGallery files={files} />

      {editable && (
        <div className="space-y-2">
          <label className="inline-block cursor-pointer rounded-md border border-input bg-background px-4 py-2 text-sm hover:bg-secondary">
            + Anexar arquivos
            <input
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp,.mp4,.mov,.pdf,.xml"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          <p className="text-xs text-muted-foreground">
            Fotos, videos, PDF ou XML. Imagens sao comprimidas automaticamente antes do envio.
          </p>

          {uploads.length > 0 && (
            <ul className="space-y-1 text-sm">
              {uploads.map((item) => (
                <li key={item.localId} className="flex items-center justify-between gap-4">
                  <span className="min-w-0 truncate">{item.name}</span>
                  <span
                    className={
                      item.status === "erro"
                        ? "text-destructive"
                        : item.status === "enviado"
                          ? "text-status-aprovada"
                          : "text-muted-foreground"
                    }
                  >
                    {item.status === "comprimindo" && "Comprimindo..."}
                    {item.status === "enviando" && "Enviando..."}
                    {item.status === "enviado" && "Enviado"}
                    {item.status === "erro" && (item.errorMessage ?? "Erro")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
