"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { productSchema } from "@/lib/validations/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog } from "@/components/ui/dialog";

type Product = {
  id: string;
  codigo: string;
  descricao: string;
  unidade: string | null;
  ativo: boolean;
};

export function ProductManager({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  async function toggleAtivo(product: Product) {
    const supabase = createClient();
    const { error } = await supabase
      .from("products")
      .update({ ativo: !product.ativo })
      .eq("id", product.id);

    if (!error) {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, ativo: !p.ativo } : p))
      );
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          Novo produto
        </Button>
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-secondary">
            <tr>
              <th className="px-4 py-2 font-medium">Código</th>
              <th className="px-4 py-2 font-medium">Descrição</th>
              <th className="px-4 py-2 font-medium">Unidade</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-t border-border">
                <td className="px-4 py-2 font-mono">{product.codigo}</td>
                <td className="px-4 py-2">{product.descricao}</td>
                <td className="px-4 py-2">{product.unidade ?? "—"}</td>
                <td className="px-4 py-2">{product.ativo ? "Ativo" : "Inativo"}</td>
                <td className="px-4 py-2 text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditing(product);
                      setDialogOpen(true);
                    }}
                  >
                    Editar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => toggleAtivo(product)}>
                    {product.ativo ? "Desativar" : "Ativar"}
                  </Button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  Nenhum produto cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ProductFormDialog
        open={dialogOpen}
        product={editing}
        onClose={() => setDialogOpen(false)}
        onSaved={(saved) => {
          setProducts((prev) => {
            const exists = prev.some((p) => p.id === saved.id);
            return exists ? prev.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...prev];
          });
          setDialogOpen(false);
        }}
      />
    </div>
  );
}

function ProductFormDialog({
  open,
  product,
  onClose,
  onSaved,
}: {
  open: boolean;
  product: Product | null;
  onClose: () => void;
  onSaved: (product: Product) => void;
}) {
  const [codigo, setCodigo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [unidade, setUnidade] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCodigo(product?.codigo ?? "");
    setDescricao(product?.descricao ?? "");
    setUnidade(product?.unidade ?? "");
    setError(null);
  }, [product, open]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const parsed = productSchema.safeParse({ codigo, descricao, unidade });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data, error: dbError } = product
      ? await supabase
          .from("products")
          .update({
            codigo: parsed.data.codigo,
            descricao: parsed.data.descricao,
            unidade: parsed.data.unidade || null,
          })
          .eq("id", product.id)
          .select()
          .single()
      : await supabase
          .from("products")
          .insert({
            codigo: parsed.data.codigo,
            descricao: parsed.data.descricao,
            unidade: parsed.data.unidade || null,
          })
          .select()
          .single();

    setLoading(false);

    if (dbError || !data) {
      setError(
        dbError?.code === "23505"
          ? "Já existe um produto com esse código."
          : "Não foi possível salvar o produto."
      );
      return;
    }

    onSaved(data as Product);
  }

  return (
    <Dialog open={open} onClose={onClose} title={product ? "Editar produto" : "Novo produto"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="product-codigo">Código</Label>
          <Input
            id="product-codigo"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground">
            É por este código que o Promotor vai buscar o produto — deixe
            curto e fácil de digitar.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-descricao">Descrição</Label>
          <Input
            id="product-descricao"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-unidade">Unidade</Label>
          <Input
            id="product-unidade"
            value={unidade}
            onChange={(e) => setUnidade(e.target.value)}
            placeholder="UN, CX, KG..."
          />
        </div>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
