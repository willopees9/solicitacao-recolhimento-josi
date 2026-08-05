import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Quem já está logado não precisa ver a tela de login de novo.
  if (user) redirect("/");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6">
      <div className="text-center">
        <h1 className="text-xl font-semibold">Solicitação de Recolhimento</h1>
        <p className="text-sm text-muted-foreground">
          Acesse com seu e-mail e senha
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
