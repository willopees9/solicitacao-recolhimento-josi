"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { reviewDecisionSchema } from "@/lib/validations/admin";

type Decision = "APROVAR" | "SOLICITAR_CORRECAO" | "REJEITAR";

const DECISION_LABELS: Record<Decision, string> = {
  APROVAR: "Aprovar",
  SOLICITAR_CORRECAO: "Solicitar Correcao",
  REJEITAR: "Rejeitar",
};

export function ReviewActions({
  requestId,
  status,
}: {
  requestId: string;
  status: string;
}) {
  const router = useRouter();
  const [dialogDecision, setDialogDecision] = useState<Decision | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const reviewable = ["AGUARDANDO_CONFERENCIA", "AGUARDANDO_CORRECAO"].includes(status);

  if (!reviewable) {
    return (
      <div className="rounded-md border border-border bg-secondary p-4 text-sm text-muted-foreground">
        Esta solicitacao ja teve uma decisao registrada.
      </div>
    );
  }

  function openDecision(decision: Decision) {
    setDialogDecision(decision);
    setNote("");
    setError(null);
  }

  async function submitDecision(event: FormEvent) {
    event.preventDefault();
    if (!dialogDecision) return;

    setError(null);

    const parsed = reviewDecisionSchema.safeParse({
      decision: dialogDecision,
      note,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados invalidos.");
      return;
    }

    setLoading(true);
    const response = await fetch(`/api/admin/solicitacoes/${requestId}/decisao`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(result.error ?? "Nao foi possivel registrar a decisao.");
      return;
    }

    setDialogDecision(null);
    router.refresh();
  }

  const requiresNote = dialogDecision && dialogDecision !== "APROVAR";

  return (
    <div className="space-y-3 rounded-md border border-border p-4">
      <h2 className="text-sm font-medium text-muted-foreground">Decisao administrativa</h2>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => openDecision("APROVAR")}>
          Aprovar
        </Button>
        <Button type="button" variant="outline" onClick={() => openDecision("SOLICITAR_CORRECAO")}>
          Solicitar Correcao
        </Button>
        <Button type="button" variant="destructive" onClick={() => openDecision("REJEITAR")}>
          Rejeitar
        </Button>
      </div>

      <Dialog
        open={!!dialogDecision}
        onClose={() => (loading ? undefined : setDialogDecision(null))}
        title={dialogDecision ? DECISION_LABELS[dialogDecision] : "Decisao"}
      >
        <form onSubmit={submitDecision} className="space-y-4">
          {requiresNote && (
            <div className="space-y-2">
              <Label htmlFor="review-note">
                {dialogDecision === "REJEITAR" ? "Motivo" : "Observacao"}
              </Label>
              <textarea
                id="review-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={4}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              />
            </div>
          )}

          {dialogDecision === "APROVAR" && (
            <p className="text-sm text-muted-foreground">
              Confirmar aprovacao desta solicitacao?
            </p>
          )}

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" disabled={loading} onClick={() => setDialogDecision(null)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Confirmar"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
