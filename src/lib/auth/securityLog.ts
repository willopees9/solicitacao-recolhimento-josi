import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

/**
 * Registra um evento de segurança (ex: tentativa de acesso a rota sem
 * permissão). Roda sempre no servidor — nunca é chamado a partir do
 * navegador diretamente — porque lê o IP e o user-agent reais da
 * requisição via next/headers, algo que um valor enviado pelo client não
 * garantiria ser verdadeiro.
 *
 * A escrita em si acontece através da função SECURITY DEFINER
 * "log_security_event" (migração 0003), que só grava eventos em nome do
 * próprio usuário autenticado (auth.uid()).
 */
export async function logSecurityEvent(params: {
  action: string;
  entity?: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createClient();
  const headerList = headers();

  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerList.get("x-real-ip") ??
    null;
  const userAgent = headerList.get("user-agent");

  await supabase.rpc("log_security_event", {
    p_action: params.action,
    p_entity: params.entity ?? null,
    p_entity_id: params.entityId ?? null,
    p_ip: ip,
    p_user_agent: userAgent,
    p_metadata: params.metadata ?? null,
  });
}
