import { getCurrentProfile } from "@/lib/auth/profile";
import { PromotorNav } from "@/components/promotor/PromotorNav";
import { ChangePasswordForm } from "@/components/shared/ChangePasswordForm";

export default async function PerfilPage() {
  const profile = await getCurrentProfile();

  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <PromotorNav />

      <h1 className="mb-6 text-2xl font-semibold">Meu Perfil</h1>

      <dl className="mb-10 space-y-4 text-sm">
        <div>
          <dt className="text-muted-foreground">Nome</dt>
          <dd className="font-medium">{profile?.nome}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">E-mail</dt>
          <dd className="font-medium">{profile?.email}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Telefone</dt>
          <dd className="font-medium">{profile?.telefone ?? "Não informado"}</dd>
        </div>
      </dl>

      <h2 className="mb-4 text-lg font-semibold">Trocar senha</h2>
      <ChangePasswordForm />
    </main>
  );
}
