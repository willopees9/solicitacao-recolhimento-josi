import type { Config } from "tailwindcss";

// Configuração do Tailwind. As cores usam variáveis CSS (definidas em
// src/app/globals.css) em vez de valores fixos, seguindo o padrão do
// shadcn/ui — isso facilita trocar o tema (ex: dark mode) no futuro sem
// precisar reescrever classes espalhadas pelo código.
const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        // Cores semânticas de status, usadas no componente StatusBadge (Sprint 5+)
        status: {
          aguardandoConferencia: "hsl(var(--status-aguardando-conferencia))",
          aguardandoCorrecao: "hsl(var(--status-aguardando-correcao))",
          aprovada: "hsl(var(--status-aprovada))",
          rejeitada: "hsl(var(--status-rejeitada))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
