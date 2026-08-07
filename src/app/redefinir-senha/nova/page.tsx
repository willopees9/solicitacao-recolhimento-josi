import { AuthShell } from "@/components/auth/AuthShell";
import { SetNewPasswordForm } from "@/components/auth/SetNewPasswordForm";

export default function NovaSenhaPage() {
  return (
    <AuthShell title="Defina sua nova senha">
      <SetNewPasswordForm />
    </AuthShell>
  );
}
