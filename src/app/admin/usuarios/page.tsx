import { createClient } from "@/lib/supabase/server";
import { UserManager } from "@/components/admin/UserManager";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function UsuariosPage() {
  const supabase = createClient();
  const { data: users } = await supabase
    .from("profiles")
    .select("id, nome, email, telefone, role, ativo, primeiro_acesso")
    .order("nome");

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <AdminNav />
      <h1 className="mb-6 text-2xl font-semibold">Usuários</h1>
      <UserManager initialUsers={users ?? []} />
    </main>
  );
}
