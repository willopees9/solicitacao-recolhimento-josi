import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cria um cliente Supabase para uso no servidor (Server Components,
 * Server Actions e Route Handlers).
 *
 * Este client lê/escreve a sessão do usuário através dos cookies da
 * requisição, o que permite que o Postgres saiba "quem" está chamando
 * (auth.uid()) e aplique as políticas de RLS corretamente.
 *
 * IMPORTANTE: assim como o client do navegador, este usa a chave "anon".
 * Para operações que precisam ignorar RLS (ex: criação de usuário pelo
 * Admin via Supabase Auth Admin API), use um client separado com a
 * Service Role Key — ver src/lib/supabase/serviceRole.ts, criado na Sprint 4.
 *
 * Uso típico dentro de uma Server Action ou Route Handler:
 *   const supabase = createClient();
 *   const { data: { user } } = await supabase.auth.getUser();
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Chamado a partir de um Server Component (não de uma Server
            // Action/Route Handler) — o Next.js não permite escrever cookies
            // nesse contexto. Isso é esperado quando o middleware já está
            // cuidando da renovação de sessão em toda requisição, então
            // podemos ignorar esse erro com segurança.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // Mesmo caso do "set" acima.
          }
        },
      },
    }
  );
}
