import { NextRequest, NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/requireApiRole";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const check = await requireApiRole(["PROMOTOR"]);
  if ("error" in check) return check.error;

  const { searchParams } = new URL(request.url);
  const nfd = searchParams.get("nfd");

  if (!nfd) {
    return NextResponse.json({ duplicate: false });
  }

  const supabase = createClient();
  const { data, error } = await supabase.rpc("has_active_duplicate_request", {
    p_nfd: nfd,
  });

  if (error) {
    // Falha na checagem não deve impedir o Promotor de continuar
    // preenchendo — é só um aviso, o bloqueio de verdade é no banco.
    return NextResponse.json({ duplicate: false });
  }

  return NextResponse.json({ duplicate: !!data });
}
