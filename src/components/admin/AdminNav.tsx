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

export function AdminNav() {
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
