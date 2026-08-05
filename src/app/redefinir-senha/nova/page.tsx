import { SetNewPasswordForm } from "@/components/auth/SetNewPasswordForm";

export default function NovaSenhaPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6">
      <div className="text-center">
        <h1 className="text-xl font-semibold">Defina sua nova senha</h1>
      </div>
      <SetNewPasswordForm />
    </main>
  );
}
