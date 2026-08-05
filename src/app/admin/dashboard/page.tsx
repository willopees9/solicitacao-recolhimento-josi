import { getCurrentProfile } from "@/lib/auth/profile";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { AdminNav } from "@/components/admin/AdminNav";

/**
 * Página temporária, só para provar que a proteção de rota da Sprint 3
 * está funcionando. O dashboard real (cards de indicadores, filtros por
 * período/loja/cidade/promotor/tipo, conforme a Etapa 4) é construído na
 * Sprint 12.
 */
export default async function AdminDashboardPage() {
  const profile = await getCurrentProfile();

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <AdminNav />
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Dashboard Administrativo</h1>
        <p className="text-muted-foreground">
          Logado como <strong>{profile?.nome}</strong>
        </p>
        <p className="max-w-md text-sm text-muted-foreground">
          Esta ainda é uma tela temporária. O dashboard real (indicadores e
          filtros) chega na Sprint 12, e o painel de conferência, na Sprint
          9. Os cadastros administrativos (Sprint 4) já estão prontos — use
          o menu acima.
        </p>
        <LogoutButton />
      </div>
    </main>
  );
}
