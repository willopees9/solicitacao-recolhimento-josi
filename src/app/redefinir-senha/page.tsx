import { AuthShell } from "@/components/auth/AuthShell";
import { RequestResetForm } from "@/components/auth/RequestResetForm";

export default function RedefinirSenhaPage() {
  return (
    <AuthShell title="Redefinir senha" subtitle="Informe seu e-mail para receber o link.">
      <RequestResetForm />
    </AuthShell>
  );
}
