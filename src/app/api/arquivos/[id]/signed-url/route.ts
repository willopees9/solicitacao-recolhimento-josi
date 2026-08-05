import { NextRequest, NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/requireApiRole";
import { createClient } from "@/lib/supabase/server";

const EXPIRY_SECONDS = Number(process.env.SIGNED_URL_EXPIRY_SECONDS ?? 900);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const check = await requireApiRole(["PROMOTOR", "ADMIN"]);
  if ("error" in check) return check.error;

  const supabase = createClient();

  // A RLS de collection_request_files (migração 0008) já garante que só
  // vem resultado se o usuário for o dono da solicitação ou Admin — se
  // não tiver permissão, "file" vem null e devolvemos 404 sem distinguir
  // "não existe" de "não é seu", para não vazar informação.
  const { data: file } = await supabase
    .from("collection_request_files")
    .select("storage_path")
    .eq("id", params.id)
    .single();

  if (!file) {
    return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 });
  }

  const { data: signed, error } = await supabase.storage
    .from("collection-evidences")
    .createSignedUrl(file.storage_path, EXPIRY_SECONDS);

  if (error || !signed) {
    return NextResponse.json({ error: "Não foi possível gerar o link do arquivo." }, { status: 500 });
  }

  return NextResponse.json({ url: signed.signedUrl });
}
