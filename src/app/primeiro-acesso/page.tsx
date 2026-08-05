import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FirstAccessForm } from "@/components/auth/FirstAccessForm";

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

  // Se já concluiu o primeiro acesso, não faz sentido ver esta tela de novo.
  if (!profile || !profile.primeiro_acesso) redirect("/");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6">
      <div className="text-center">
        <h1 className="text-xl font-semibold">Bem-vindo(a)!</h1>
      </div>
      <FirstAccessForm />
    </main>
  );
}
