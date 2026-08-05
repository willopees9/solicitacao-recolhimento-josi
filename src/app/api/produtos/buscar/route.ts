import { NextRequest, NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/requireApiRole";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const check = await requireApiRole(["PROMOTOR"]);
  if ("error" in check) return check.error;

  const { searchParams } = new URL(request.url);
  const codigo = searchParams.get("codigo");

  if (!codigo) {
    return NextResponse.json({ product: null });
  }

  const supabase = createClient();
  const { data } = await supabase
    .from("products")
    .select("id, codigo, descricao, unidade")
    .eq("codigo", codigo)
    .eq("ativo", true)
    .maybeSingle();

  return NextResponse.json({ product: data ?? null });
}
