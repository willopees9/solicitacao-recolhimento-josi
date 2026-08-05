"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { loginSchema } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    // Mensagem sempre genérica — nunca revela se o e-mail existe ou se foi a
    // senha que errou, conforme regra de segurança definida na Etapa 2.
    if (signInError || !data.user) {
      setError("E-mail ou senha inválidos.");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("ativo, primeiro_acesso, role")
      .eq("id", data.user.id)
      .single();

    // Usuário desativado pelo Admin não deve conseguir permanecer logado,
    // mesmo com credenciais corretas.
    if (!profile || !profile.ativo) {
      await supabase.auth.signOut();
      setError("Usuário inativo. Entre em contato com o administrador.");
      setLoading(false);
      return;
    }

    // Função SECURITY DEFINER — só atualiza o próprio ultimo_acesso.
    await supabase.rpc("register_login");

    // Navegação completa (não router.push) de propósito: garante que o
    // cookie de sessão recém-criado já esteja presente na requisição que o
    // servidor recebe para renderizar a próxima página. Usar router.push
    // aqui causa uma corrida entre a gravação do cookie e a leitura dele
    // pelo Server Component seguinte, resultando num redirecionamento de
    // volta ao /login.
    if (profile.primeiro_acesso) {
      window.location.href = "/primeiro-acesso";
    } else {
      window.location.href = profile.role === "ADMIN" ? "/admin/dashboard" : "/promotor";
    }
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

      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Entrando..." : "Entrar"}
      </Button>

      <div className="text-center">
        <a
          href="/redefinir-senha"
          className="text-sm text-muted-foreground hover:underline"
        >
          Esqueci minha senha
        </a>
      </div>
    </form>
  );
}
