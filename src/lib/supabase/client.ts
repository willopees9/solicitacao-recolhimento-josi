"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Cria um cliente Supabase para uso dentro de Client Components
 * (componentes marcados com "use client").
 *
 * IMPORTANTE: este client usa a chave "anon" (pública). Ele NUNCA deve
 * receber a Service Role Key. A segurança de leitura/escrita fica a cargo
 * das políticas de RLS configuradas no banco (ver /supabase/migrations).
 *
 * Uso típico dentro de um componente:
 *   const supabase = createClient();
 *   const { data } = await supabase.from("collection_requests").select("*");
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
