"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { newPasswordSchema } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SetNewPasswordForm() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // O Supabase processa o link do e-mail automaticamente (via hash da URL)
    // e dispara o evento PASSWORD_RECOVERY quando a sessão temporária de
    // recuperação é estabelecida. Só liberamos o formulário depois disso —
    // sem isso, updateUser() falharia por falta de sessão.
    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });

    // Cobre o caso de o evento já ter disparado antes deste componente montar.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const parsed = newPasswordSchema.safeParse({ password, confirmPassword });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error: updateError } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });

    setLoading(false);

    if (updateError) {
      setError("Não foi possível redefinir a senha. Solicite um novo link.");
      return;
    }

    // Navegação completa, mesmo padrão usado em todo o fluxo de auth —
    // evita qualquer inconsistência entre a sessão já autenticada nesta
    // recuperação e o que o servidor enxerga na página seguinte.
    window.location.href = "/login";
  }

  if (!ready) {
    return (
      <p className="max-w-sm text-center text-sm text-muted-foreground">
        Link inválido ou expirado. Solicite um novo link de redefinição de
        senha.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">Nova senha</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          required
        />
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Salvando..." : "Salvar nova senha"}
      </Button>
    </form>
  );
}
