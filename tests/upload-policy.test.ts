import test from "node:test";
import assert from "node:assert/strict";
import {
  validateUploadRequest,
  MAX_FILES_PER_REQUEST,
} from "../src/lib/upload/policy";

test("accepts a valid jpeg evidence file", () => {
  const result = validateUploadRequest({
    requestId: "request-1",
    originalName: "foto loja.jpeg",
    mimeType: "image/jpeg",
    sizeBytes: 1024,
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.fileType, "FOTO");
  assert.equal(result.extension, "jpeg");
  assert.equal(result.sanitizedName, "foto_loja.jpeg");
});

test("rejects a file when extension and MIME type do not match", () => {
  const result = validateUploadRequest({
    requestId: "request-1",
    originalName: "nota.pdf",
    mimeType: "image/jpeg",
    sizeBytes: 1024,
  });

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.status, 400);
  assert.match(result.error, /MIME/i);
});

test("rejects files above the allowed size for the extension", () => {
  const result = validateUploadRequest({
    requestId: "request-1",
    originalName: "evidencia.png",
    mimeType: "image/png",
    sizeBytes: 9 * 1024 * 1024,
  });

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.error, /tamanho/i);
});

test("keeps the per-request attachment limit explicit", () => {
  assert.equal(MAX_FILES_PER_REQUEST, 20);
});
