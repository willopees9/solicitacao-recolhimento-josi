import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Solicitação de Recolhimento",
  description: "Sistema interno de solicitação de recolhimento de mercadorias",
};

/**
 * Layout raiz. Nesta Sprint 1 ele só define o HTML base e importa o CSS
 * global — nenhuma lógica de autenticação/autorização ainda.
 *
 * A partir da Sprint 3, os layouts específicos de /promotor e /admin (não
 * este) é que vão concentrar a checagem de sessão e de "role", conforme
 * decidido na Etapa 2 (proteção de rota no servidor, em duas camadas).
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
