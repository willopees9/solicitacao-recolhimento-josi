import { requireRole } from "@/lib/auth/requireRole";

/**
 * Todo o subtree de /promotor passa por aqui antes de renderizar. Se o
 * usuário não estiver logado, não estiver ativo, ou não for PROMOTOR, a
 * requireRole() já redireciona — nenhuma página filha precisa repetir essa
 * checagem.
 */
export default async function PromotorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["PROMOTOR"]);

  return <div className="min-h-screen bg-background">{children}</div>;
}
