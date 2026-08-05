"use client";

import { useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog } from "@/components/ui/dialog";

type ProductMatch = {
  id: string;
  codigo: string;
  descricao: string;
  unidade: string | null;
} | null;

export type DraftItem = {
  localId: string;
  productId: string | null;
  descricaoManual: string | null;
  displayDescricao: string;
  quantidade: number;
  unidade: string | null;
  lote: string | null;
  validade: string | null;
  observacao: string | null;
};

export function ProductItemModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (item: DraftItem) => void;
}) {
  const [mode, setMode] = useState<"codigo" | "livre">("codigo");
  const [codigo, setCodigo] = useState("");
  const [foundProduct, setFoundProduct] = useState<ProductMatch>(null);
  const [searching, setSearching] = useState(false);
  const [codigoNotFound, setCodigoNotFound] = useState(false);
  const [descricaoManual, setDescricaoManual] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [unidade, setUnidade] = useState("");
  const [lote, setLote] = useState("");
  const [validade, setValidade] = useState("");
  const [observacao, setObservacao] = useState("");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setMode("codigo");
    setCodigo("");
    setFoundProduct(null);
    setCodigoNotFound(false);
    setDescricaoManual("");
    setQuantidade("1");
    setUnidade("");
    setLote("");
    setValidade("");
    setObservacao("");
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleBuscarCodigo() {
    if (!codigo) return;
    setSearching(true);
    setCodigoNotFound(false);
    setFoundProduct(null);

    try {
      const response = await fetch(`/api/produtos/buscar?codigo=${encodeURIComponent(codigo)}`);
      const result = await response.json();
      if (response.ok && result.product) {
        setFoundProduct(result.product);
        setUnidade((prev) => prev || result.product.unidade || "");
      } else {
        setCodigoNotFound(true);
      }
    } catch {
      setCodigoNotFound(true);
    } finally {
      setSearching(false);
    }
  }

  // Não é um <form> de propósito — este modal é renderizado dentro do
  // <form> da tela de Nova Solicitação. Um <form> aninhado dentro de
  // outro faz o evento de "enviar formulário" borbulhar e disparar
  // também o envio do formulário de fora (era exatamente isso que estava
  // fazendo a tela "sumir e voltar" ao clicar em Adicionar). Por isso o
  // botão abaixo usa onClick direto, e o Enter é interceptado e
  // bloqueado em vez de deixar o navegador decidir o que fazer com ele.
  function handleAdd() {
    setError(null);

    const quantidadeNumber = Number(quantidade);
    if (!quantidadeNumber || quantidadeNumber <= 0) {
      setError("Informe uma quantidade maior que zero.");
      return;
    }

    if (mode === "codigo") {
      if (!foundProduct) {
        setError("Busque um produto pelo código antes de adicionar.");
        return;
      }
      onSave({
        localId: crypto.randomUUID(),
        productId: foundProduct.id,
        descricaoManual: null,
        displayDescricao: `${foundProduct.codigo} — ${foundProduct.descricao}`,
        quantidade: quantidadeNumber,
        unidade: unidade || null,
        lote: lote || null,
        validade: validade || null,
        observacao: observacao || null,
      });
    } else {
      if (!descricaoManual.trim()) {
        setError("Informe a descrição do produto.");
        return;
      }
      onSave({
        localId: crypto.randomUUID(),
        productId: null,
        descricaoManual: descricaoManual.trim(),
        displayDescricao: descricaoManual.trim(),
        quantidade: quantidadeNumber,
        unidade: unidade || null,
        lote: lote || null,
        validade: validade || null,
        observacao: observacao || null,
      });
    }

    handleClose();
  }

  // Impede que a tecla Enter, digitada em qualquer campo do modal, suba e
  // seja interpretada pelo formulário de fora (que trataria isso como um
  // pedido de envio da solicitação inteira).
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} title="Adicionar produto">
      <div className="space-y-4" onKeyDown={handleKeyDown}>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" checked={mode === "codigo"} onChange={() => setMode("codigo")} />
            Buscar por código
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" checked={mode === "livre"} onChange={() => setMode("livre")} />
            Produto não cadastrado
          </label>
        </div>

        {mode === "codigo" ? (
          <div className="space-y-2">
            <Label htmlFor="codigo">Código *</Label>
            <div className="flex gap-2">
              <Input
                id="codigo"
                value={codigo}
                onChange={(e) => {
                  setCodigo(e.target.value);
                  setFoundProduct(null);
                  setCodigoNotFound(false);
                }}
                onBlur={handleBuscarCodigo}
              />
              <Button type="button" variant="outline" onClick={handleBuscarCodigo} disabled={searching}>
                {searching ? "..." : "Buscar"}
              </Button>
            </div>
            {foundProduct && (
              <p className="text-sm text-status-aprovada">
                {foundProduct.codigo} — {foundProduct.descricao}
              </p>
            )}
            {codigoNotFound && (
              <p className="text-sm text-destructive">
                Código não encontrado. Use a opção &quot;Produto não
                cadastrado&quot; ao lado.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="descricaoManual">Descrição *</Label>
            <Input
              id="descricaoManual"
              value={descricaoManual}
              onChange={(e) => setDescricaoManual(e.target.value)}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quantidade">Quantidade *</Label>
            <Input
              id="quantidade"
              type="number"
              min="0.01"
              step="0.01"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unidade">Unidade</Label>
            <Input id="unidade" value={unidade} onChange={(e) => setUnidade(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="lote">Lote</Label>
            <Input id="lote" value={lote} onChange={(e) => setLote(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="validade">Validade</Label>
            <Input
              id="validade"
              type="date"
              value={validade}
              onChange={(e) => setValidade(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="observacaoItem">Observação</Label>
          <Input id="observacaoItem" value={observacao} onChange={(e) => setObservacao(e.target.value)} />
        </div>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleAdd}>
            Adicionar
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
