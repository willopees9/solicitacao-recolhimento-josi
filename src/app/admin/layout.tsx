import { requireRole } from "@/lib/auth/requireRole";

/**
 * Todo o subtree de /admin passa por aqui antes de renderizar. Mesma lógica
 * do layout do Promotor, exigindo o perfil ADMIN.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["ADMIN"]);

  return <div className="min-h-screen bg-background">{children}</div>;
}
