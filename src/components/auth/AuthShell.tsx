export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f2e8] px-6 py-10">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-sm lg:grid-cols-[0.9fr_1.1fr]">
        <div className="bg-[#00583f] p-8 text-white sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#f4c95d]">Grupo Josidith</p>
          <h1 className="mt-4 max-w-sm text-3xl font-semibold leading-tight">Solicitacao de Recolhimento</h1>
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/75">
            Controle simples para registrar, acompanhar e conferir recolhimentos com mais clareza.
          </p>
        </div>

        <div className="flex flex-col justify-center p-8 sm:p-10">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-[#123026]">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-[#65746c]">{subtitle}</p>}
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
