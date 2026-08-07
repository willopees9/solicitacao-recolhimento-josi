import Link from "next/link";

const links = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/conferencia", label: "Solicitacoes" },
  { href: "/admin/historico", label: "Historico" },
  { href: "/admin/usuarios", label: "Usuarios" },
  { href: "/admin/lojas", label: "Lojas" },
  { href: "/admin/produtos", label: "Produtos" },
  { href: "/admin/tipos", label: "Tipos" },
];

export function AdminNav({ variant = "top" }: { variant?: "top" | "side" }) {
  if (variant === "side") {
    return (
      <aside className="hidden min-h-[calc(100vh-3rem)] w-64 shrink-0 rounded-r-[32px] bg-[#00583f] px-5 py-6 text-white lg:block">
        <div className="mb-8">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#f4c95d]">Grupo Josidith</p>
          <h2 className="mt-2 text-xl font-semibold leading-tight">Recolhimento</h2>
        </div>

        <nav className="space-y-1 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex rounded-md px-3 py-2 text-white/80 transition hover:bg-white/[0.12] hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="mt-10 rounded-md border border-white/15 bg-white/[0.08] p-4">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#f4c95d]">Operacao</p>
          <p className="mt-2 text-sm leading-5 text-white/80">Painel claro para acompanhar solicitacoes sem poluir a rotina.</p>
        </div>
      </aside>
    );
  }

  return (
    <nav className="mb-8 flex flex-wrap gap-4 border-b border-border pb-4 text-sm">
      {links.map((link) => (
        <Link key={link.href} href={link.href} className="text-muted-foreground hover:text-foreground">
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
