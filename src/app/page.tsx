import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { getCurrentProfile } from "@/lib/auth/profile";

export default async function HomePage() {
  const profile = await getCurrentProfile();

  if (profile) {
    redirect(profile.role === "ADMIN" ? "/admin/dashboard" : "/promotor");
  }

  return (
    <AuthShell title="Sistema de Recolhimento" subtitle="Acesse o painel para continuar.">
      <a href="/login" className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm">
        Ir para o login
      </a>
    </AuthShell>
  );
}
