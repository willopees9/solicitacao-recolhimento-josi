const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  AGUARDANDO_CONFERENCIA: {
    label: "Aguardando Conferência",
    className: "bg-status-aguardandoConferencia/15 text-status-aguardandoConferencia",
  },
  AGUARDANDO_CORRECAO: {
    label: "Aguardando Correção",
    className: "bg-status-aguardandoCorrecao/15 text-status-aguardandoCorrecao",
  },
  APROVADA: {
    label: "Aprovada",
    className: "bg-status-aprovada/15 text-status-aprovada",
  },
  REJEITADA: {
    label: "Rejeitada",
    className: "bg-status-rejeitada/15 text-status-rejeitada",
  },
};

/**
 * Badge de status — cor semântica consistente em todo o sistema, conforme
 * a Etapa 4 (seção "Diretrizes Visuais"). Usado tanto na Área do Promotor
 * quanto na Administrativa.
 */
export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: "bg-secondary text-secondary-foreground",
  };

  return (
    <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
