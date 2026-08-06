export const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "mp4", "mov", "pdf", "xml"] as const;

export const MAX_FILES_PER_REQUEST = 20;

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

type UploadFileType = "FOTO" | "VIDEO" | "PDF" | "XML";

type UploadInput = {
  requestId?: string;
  originalName?: string;
  mimeType?: string;
  sizeBytes?: number;
};

type UploadValidationResult =
  | {
      ok: true;
      requestId: string;
      originalName: string;
      sanitizedName: string;
      extension: string;
      fileType: UploadFileType;
      sizeBytes: number;
    }
  | {
      ok: false;
      error: string;
      status: number;
    };

function fileTypeFromExtension(ext: string): UploadFileType | null {
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

export function sanitizeFileName(originalName: string) {
  return originalName.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/^_+/, "") || "arquivo";
}

export function validateUploadRequest(input: UploadInput): UploadValidationResult {
  const { requestId, originalName, mimeType, sizeBytes } = input;

  if (!requestId || !originalName || !mimeType || typeof sizeBytes !== "number") {
    return { ok: false, error: "Dados de upload incompletos.", status: 400 };
  }

  if (sizeBytes <= 0) {
    return { ok: false, error: "Arquivo vazio ou invalido.", status: 400 };
  }

  const extension = originalName.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.includes(extension as (typeof ALLOWED_EXTENSIONS)[number])) {
    return { ok: false, error: "Tipo de arquivo nao permitido.", status: 400 };
  }

  if (!isAllowedMimeType(extension, mimeType)) {
    return { ok: false, error: "MIME type nao permitido para este arquivo.", status: 400 };
  }

  const fileType = fileTypeFromExtension(extension);
  if (!fileType) {
    return { ok: false, error: "Tipo de arquivo nao reconhecido.", status: 400 };
  }

  const maxSize = MAX_SIZES[extension];
  if (!maxSize || sizeBytes > maxSize) {
    return { ok: false, error: "Arquivo acima do tamanho maximo permitido para este tipo.", status: 400 };
  }

  return {
    ok: true,
    requestId,
    originalName,
    sanitizedName: sanitizeFileName(originalName),
    extension,
    fileType,
    sizeBytes,
  };
}
