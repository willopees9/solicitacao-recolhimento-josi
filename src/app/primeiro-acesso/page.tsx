import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { FirstAccessForm } from "@/components/auth/FirstAccessForm";
import { createClient } from "@/lib/supabase/server";

export default async function PrimeiroAcessoPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("primeiro_acesso")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.primeiro_acesso) redirect("/");

  return (
    <AuthShell title="Bem-vindo(a)" subtitle="Defina sua senha para concluir o primeiro acesso.">
      <FirstAccessForm />
    </AuthShell>
  );
}
