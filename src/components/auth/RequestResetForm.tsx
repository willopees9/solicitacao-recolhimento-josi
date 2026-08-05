"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { requestResetSchema } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RequestResetForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const parsed = requestResetSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${window.location.origin}/redefinir-senha/nova`,
    });

    setLoading(false);

    // Sempre mostramos a mesma mensagem de sucesso, exista ou não o e-mail
    // cadastrado — evita que este formulário seja usado para descobrir quais
    // e-mails têm conta no sistema.
    setSent(true);
  }

  if (sent) {
    return (
      <p className="max-w-sm text-center text-sm text-muted-foreground">
        Se este e-mail estiver cadastrado, você receberá um link para
        redefinir sua senha em instantes.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Enviando..." : "Enviar link de redefinição"}
      </Button>

      <div className="text-center">
        <a href="/login" className="text-sm text-muted-foreground hover:underline">
          Voltar ao login
        </a>
      </div>
    </form>
  );
}
