import { RequestResetForm } from "@/components/auth/RequestResetForm";

export default function RedefinirSenhaPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6">
      <div className="text-center">
        <h1 className="text-xl font-semibold">Redefinir senha</h1>
        <p className="text-sm text-muted-foreground">
          Informe seu e-mail para receber o link
        </p>
      </div>
      <RequestResetForm />
    </main>
  );
}
