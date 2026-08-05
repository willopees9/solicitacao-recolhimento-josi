"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    // Navegação completa (não router.push) — mesmo motivo do LoginForm:
    // garante que o cookie de sessão já removido seja respeitado pelo
    // servidor na próxima renderização, evitando qualquer estado "meio
    // logado" causado por uma corrida com o cookie.
    window.location.href = "/login";
  }

  return (
    <Button variant="outline" onClick={handleLogout}>
      Sair
    </Button>
  );
}
