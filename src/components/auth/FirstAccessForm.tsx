"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { newPasswordSchema } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function FirstAccessForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

    if (updateError) {
      setError("Não foi possível definir a senha. Tente novamente.");
      setLoading(false);
      return;
    }

    // Função SECURITY DEFINER — altera só o primeiro_acesso do próprio
    // usuário. O client nunca teria permissão de UPDATE direto na tabela.
    await supabase.rpc("complete_first_access");

    // Busca o role para já mandar direto ao destino certo, sem passar
    // pelo hop intermediário de "/".
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user?.id ?? "")
      .single();

    window.location.href = profile?.role === "ADMIN" ? "/admin/dashboard" : "/promotor";
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
      <p className="text-sm text-muted-foreground">
        Este é seu primeiro acesso. Defina uma nova senha para continuar.
      </p>

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
        {loading ? "Salvando..." : "Definir senha e continuar"}
      </Button>
    </form>
  );
}
