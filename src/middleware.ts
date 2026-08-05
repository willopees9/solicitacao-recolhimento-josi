import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware global do Next.js.
 *
 * Responsabilidade única nesta Sprint 1: manter a sessão do Supabase Auth
 * sempre renovada, em toda requisição, escrevendo o cookie atualizado na
 * resposta. Sem isso, sessões expirariam de forma inconsistente entre
 * Server Components e Client Components.
 *
 * A partir da Sprint 3 (Perfis e Segurança), este arquivo também passará a
 * verificar o "role" do usuário (via tabela profiles) e bloquear o acesso
 * de Promotores a rotas /admin/* diretamente aqui, além da checagem feita
 * em cada layout — essa é a primeira das duas camadas de proteção descritas
 * na Etapa 2 do planejamento.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // getUser() (não getSession()) é usado de propósito: ele revalida o token
  // contra o servidor do Supabase em vez de confiar cegamente no cookie,
  // o que é a recomendação oficial para uso em middleware.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /*
     * Roda em todas as rotas, exceto arquivos estáticos e de otimização de
     * imagem do Next.js, para não desperdiçar processamento em requisições
     * que não precisam de sessão.
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
