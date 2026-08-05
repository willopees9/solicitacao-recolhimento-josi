import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente com a Service Role Key — ignora completamente as políticas de
 * RLS. Só deve ser instanciado dentro de Route Handlers do servidor,
 * depois de já ter confirmado (via requireApiRole) que quem está chamando
 * é um Admin autenticado. Nunca importar isto em um Client Component.
 *
 * Uso nesta sprint: criar usuário no Supabase Auth (operação que a lib
 * client-side não expõe) e editar campos de "profiles" que não têm
 * nenhuma política de UPDATE liberada para o client comum, de propósito
 * (ver migração 0002).
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY não configurada no .env.local — necessária para operações administrativas."
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
