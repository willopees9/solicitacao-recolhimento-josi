import { createClient } from "@/lib/supabase/server";

/**
 * Formato da linha da tabela "profiles". Definido manualmente por enquanto;
 * quando o schema estabilizar, isso pode ser substituído por tipos gerados
 * automaticamente via `supabase gen types typescript`.
 */
export type Profile = {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  role: "PROMOTOR" | "ADMIN";
  ativo: boolean;
  primeiro_acesso: boolean;
  ultimo_acesso: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Retorna o perfil do usuário autenticado na requisição atual, ou null se
 * não houver sessão. Uso típico em Server Components (ex: layout, página
 * inicial) para decidir o que renderizar ou para onde redirecionar.
 *
 * A checagem de "role" para proteger rotas (ex: bloquear Promotor em /admin)
 * é implementada separadamente na Sprint 3, em src/lib/auth/requireRole.ts —
 * este helper aqui é só leitura de dado, sem lógica de autorização.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (profile as Profile) ?? null;
}
