"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type FileRow = {
  id: string;
  original_name: string;
  file_type: string;
  size_bytes: number;
};

/**
 * Lista arquivos e permite visualizar sob demanda — cada clique gera uma
 * Signed URL nova (nunca persistida), conforme a estratégia de Storage da
 * Etapa 2. Não pré-carrega nada: só busca a URL quando o usuário realmente
 * pede para ver.
 */
export function FileGallery({ files }: { files: FileRow[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleView(fileId: string) {
    setLoadingId(fileId);
    try {
      const response = await fetch(`/api/arquivos/${fileId}/signed-url`);
      const result = await response.json();
      if (response.ok && result.url) {
        window.open(result.url, "_blank", "noopener,noreferrer");
      }
    } finally {
      setLoadingId(null);
    }
  }

  if (files.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
        Nenhum arquivo anexado ainda.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {files.map((file) => (
        <li
          key={file.id}
          className="flex items-center justify-between rounded-md border border-border p-3 text-sm"
        >
          <div>
            <p className="font-medium">{file.original_name}</p>
            <p className="text-muted-foreground">
              {file.file_type} · {(file.size_bytes / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleView(file.id)}
            disabled={loadingId === file.id}
          >
            {loadingId === file.id ? "Abrindo..." : "Visualizar"}
          </Button>
        </li>
      ))}
    </ul>
  );
}
