"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { novaSolicitacaoSchema } from "@/lib/validations/collectionRequest";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ProductItemModal, type DraftItem } from "@/components/promotor/ProductItemModal";
import { uploadEvidenceFile } from "@/lib/upload/evidences";

type Store = { id: string; nome: string; cidade: string };
type RequestType = { id: string; nome: string };
type PendingEvidenceStatus = "pendente" | "enviando" | "enviado" | "erro";
type PendingEvidence = {
  localId: string;
  file: File;
  status: PendingEvidenceStatus;
  errorMessage?: string;
};

const ALLOWED_EVIDENCE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "mp4", "mov", "pdf", "xml"];

export function NovaSolicitacaoForm({
  stores,
  requestTypes,
}: {
  stores: Store[];
  requestTypes: RequestType[];
}) {
  const router = useRouter();
  const [storeId, setStoreId] = useState("");
  const [vendedor, setVendedor] = useState("");
  const [nfd, setNfd] = useState("");
  const [requestTypeId, setRequestTypeId] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [items, setItems] = useState<DraftItem[]>([]);
  const [evidences, setEvidences] = useState<PendingEvidence[]>([]);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedStore = stores.find((s) => s.id === storeId);
  const hasValidEvidence =
    evidences.length > 0 && evidences.every((evidence) => evidence.status !== "erro");
  const canSubmit = !loading && hasValidEvidence;

  async function checkDuplicate() {
    if (!nfd) {
      setDuplicateWarning(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/solicitacoes/verificar-duplicidade?nfd=${encodeURIComponent(nfd)}`
      );
      if (response.ok) {
        const result = await response.json();
        setDuplicateWarning(!!result.duplicate);
      }
    } catch {
      // Aviso nao bloqueante. O banco continua sendo a trava real.
    }
  }

  function removeItem(localId: string) {
    setItems((prev) => prev.filter((item) => item.localId !== localId));
  }

  function handleEvidenceChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";

    const newEvidences = selected.map((file) => {
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
      const allowed = ALLOWED_EVIDENCE_EXTENSIONS.includes(extension);

      return {
        localId: crypto.randomUUID(),
        file,
        status: allowed ? ("pendente" as const) : ("erro" as const),
        errorMessage: allowed ? undefined : "Tipo de arquivo nao permitido.",
      };
    });

    setEvidences((prev) => [...prev, ...newEvidences]);
  }

  function removeEvidence(localId: string) {
    setEvidences((prev) => prev.filter((evidence) => evidence.localId !== localId));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (items.length === 0) {
      setError("Adicione pelo menos um produto antes de enviar.");
      return;
    }

    if (evidences.length === 0) {
      setError("Anexe pelo menos uma evidencia antes de enviar.");
      return;
    }

    const invalidEvidence = evidences.find((evidence) => evidence.status === "erro");
    if (invalidEvidence) {
      setError("Remova o anexo com erro antes de enviar a solicitacao.");
      return;
    }

    const parsed = novaSolicitacaoSchema.safeParse({
      storeId,
      vendedor,
      nfd,
      requestTypeId,
      observacoes,
      itens: items.map((item) => ({
        productId: item.productId,
        descricaoManual: item.descricaoManual,
        quantidade: item.quantidade,
        unidade: item.unidade,
        lote: item.lote,
        validade: item.validade,
        observacao: item.observacao,
      })),
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Preencha todos os campos obrigatorios.");
      return;
    }

    setLoading(true);

    const response = await fetch("/api/solicitacoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    const result = await response.json();

    if (!response.ok) {
      setLoading(false);
      setError(result.error ?? "Nao foi possivel enviar a solicitacao.");
      return;
    }

    for (const evidence of evidences) {
      setEvidences((prev) =>
        prev.map((item) =>
          item.localId === evidence.localId ? { ...item, status: "enviando", errorMessage: undefined } : item
        )
      );

      try {
        await uploadEvidenceFile({ requestId: result.id, file: evidence.file });
        setEvidences((prev) =>
          prev.map((item) => (item.localId === evidence.localId ? { ...item, status: "enviado" } : item))
        );
      } catch (err) {
        setLoading(false);
        await fetch(`/api/solicitacoes/${result.id}`, { method: "DELETE" });
        setEvidences((prev) =>
          prev.map((item) =>
            item.localId === evidence.localId
              ? {
                  ...item,
                  status: "erro",
                  errorMessage: err instanceof Error ? err.message : "Erro ao enviar.",
                }
              : item
          )
        );
        setError(
          "Solicitacao criada, mas um anexo falhou. Voce pode tentar anexar novamente na tela de detalhe."
        );
        return;
      }
    }

    router.push(`/promotor/solicitacoes/${result.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="store">Loja *</Label>
          <Select id="store" value={storeId} onChange={(e) => setStoreId(e.target.value)} required>
            <option value="">Selecione...</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.nome} - {store.cidade}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cidade">Cidade</Label>
          <Input id="cidade" value={selectedStore?.cidade ?? ""} disabled />
        </div>

        <div className="space-y-2">
          <Label htmlFor="vendedor">Vendedor *</Label>
          <Input id="vendedor" value={vendedor} onChange={(e) => setVendedor(e.target.value)} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="nfd">NFD *</Label>
          <Input id="nfd" value={nfd} onChange={(e) => setNfd(e.target.value)} onBlur={checkDuplicate} required />
        </div>

        {duplicateWarning && (
          <p className="rounded-md border border-status-aguardandoCorrecao bg-status-aguardandoCorrecao/10 p-3 text-sm">
            Ja existe uma solicitacao em andamento com este NFD. Confira se nao e duplicidade antes de continuar.
          </p>
        )}

        <div className="space-y-2">
          <Label htmlFor="requestType">Tipo *</Label>
          <Select id="requestType" value={requestTypeId} onChange={(e) => setRequestTypeId(e.target.value)} required>
            <option value="">Selecione...</option>
            {requestTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.nome}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="observacoes">Observacoes *</Label>
          <textarea
            id="observacoes"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            required
            rows={4}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">Produtos *</h2>
          <Button type="button" variant="outline" size="sm" onClick={() => setItemModalOpen(true)}>
            + Adicionar produto
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nenhum produto adicionado ainda.
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.localId} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
                <div>
                  <p className="font-medium">{item.displayDescricao}</p>
                  <p className="text-muted-foreground">
                    Qtd: {item.quantidade}
                    {item.unidade ? ` ${item.unidade}` : ""}
                    {item.lote ? ` - Lote: ${item.lote}` : ""}
                    {item.validade ? ` - Validade: ${item.validade}` : ""}
                  </p>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(item.localId)}>
                  Remover
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">Evidencias</h2>
          <label className="inline-block cursor-pointer rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-secondary">
            + Anexar arquivos
            <input
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp,.mp4,.mov,.pdf,.xml"
              onChange={handleEvidenceChange}
              className="hidden"
            />
          </label>
        </div>

        {evidences.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nenhum arquivo selecionado ainda.
          </div>
        ) : (
          <ul className="space-y-2">
            {evidences.map((evidence) => (
              <li
                key={evidence.localId}
                className="flex items-center justify-between gap-3 rounded-md border border-border p-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{evidence.file.name}</p>
                  <p
                    className={
                      evidence.status === "erro"
                        ? "text-destructive"
                        : evidence.status === "enviado"
                          ? "text-status-aprovada"
                          : "text-muted-foreground"
                    }
                  >
                    {(evidence.file.size / 1024 / 1024).toFixed(2)} MB
                    {evidence.status === "pendente" && " - Pendente"}
                    {evidence.status === "enviando" && " - Enviando..."}
                    {evidence.status === "enviado" && " - Enviado"}
                    {evidence.status === "erro" && ` - ${evidence.errorMessage ?? "Erro"}`}
                  </p>
                </div>
                {evidence.status !== "enviando" && (
                  <button
                    type="button"
                    aria-label={`Remover ${evidence.file.name}`}
                    className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    onClick={() => removeEvidence(evidence.localId)}
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          Fotos, videos, PDF ou XML. Imagens sao comprimidas automaticamente no envio.
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {!hasValidEvidence && (
        <p className="text-sm text-muted-foreground">
          Anexe pelo menos uma evidencia valida para liberar o envio.
        </p>
      )}

      <Button type="submit" className="w-full" disabled={!canSubmit}>
        {loading ? "Enviando..." : "Enviar Solicitacao"}
      </Button>

      <ProductItemModal
        open={itemModalOpen}
        onClose={() => setItemModalOpen(false)}
        onSave={(item) => setItems((prev) => [...prev, item])}
      />
    </form>
  );
}
