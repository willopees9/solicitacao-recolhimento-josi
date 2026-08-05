"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { storeSchema } from "@/lib/validations/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog } from "@/components/ui/dialog";

type Store = {
  id: string;
  nome: string;
  cidade: string;
  endereco: string | null;
  ativo: boolean;
};

export function StoreManager({ initialStores }: { initialStores: Store[] }) {
  const [stores, setStores] = useState(initialStores);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Store | null>(null);

  async function toggleAtivo(store: Store) {
    const supabase = createClient();
    // Nunca exclusão física — só alterna o campo "ativo" (regra de
    // integridade da Etapa 3: não pode sumir referência usada em
    // solicitações antigas).
    const { error } = await supabase
      .from("stores")
      .update({ ativo: !store.ativo })
      .eq("id", store.id);

    if (!error) {
      setStores((prev) =>
        prev.map((s) => (s.id === store.id ? { ...s, ativo: !s.ativo } : s))
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
          Nova loja
        </Button>
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-secondary">
            <tr>
              <th className="px-4 py-2 font-medium">Nome</th>
              <th className="px-4 py-2 font-medium">Cidade</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {stores.map((store) => (
              <tr key={store.id} className="border-t border-border">
                <td className="px-4 py-2">{store.nome}</td>
                <td className="px-4 py-2">{store.cidade}</td>
                <td className="px-4 py-2">{store.ativo ? "Ativa" : "Inativa"}</td>
                <td className="px-4 py-2 text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditing(store);
                      setDialogOpen(true);
                    }}
                  >
                    Editar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => toggleAtivo(store)}>
                    {store.ativo ? "Desativar" : "Ativar"}
                  </Button>
                </td>
              </tr>
            ))}
            {stores.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                  Nenhuma loja cadastrada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <StoreFormDialog
        open={dialogOpen}
        store={editing}
        onClose={() => setDialogOpen(false)}
        onSaved={(saved) => {
          setStores((prev) => {
            const exists = prev.some((s) => s.id === saved.id);
            return exists ? prev.map((s) => (s.id === saved.id ? saved : s)) : [saved, ...prev];
          });
          setDialogOpen(false);
        }}
      />
    </div>
  );
}

function StoreFormDialog({
  open,
  store,
  onClose,
  onSaved,
}: {
  open: boolean;
  store: Store | null;
  onClose: () => void;
  onSaved: (store: Store) => void;
}) {
  const [nome, setNome] = useState("");
  const [cidade, setCidade] = useState("");
  const [endereco, setEndereco] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setNome(store?.nome ?? "");
    setCidade(store?.cidade ?? "");
    setEndereco(store?.endereco ?? "");
    setError(null);
  }, [store, open]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const parsed = storeSchema.safeParse({ nome, cidade, endereco });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    // A RLS (migração 0004) garante que só um Admin consegue de fato
    // gravar aqui — mesmo que alguém manipule esta chamada no navegador,
    // o Postgres recusa.
    const { data, error: dbError } = store
      ? await supabase
          .from("stores")
          .update({
            nome: parsed.data.nome,
            cidade: parsed.data.cidade,
            endereco: parsed.data.endereco || null,
          })
          .eq("id", store.id)
          .select()
          .single()
      : await supabase
          .from("stores")
          .insert({
            nome: parsed.data.nome,
            cidade: parsed.data.cidade,
            endereco: parsed.data.endereco || null,
          })
          .select()
          .single();

    setLoading(false);

    if (dbError || !data) {
      setError(
        dbError?.code === "23505"
          ? "Já existe uma loja com esse nome nessa cidade."
          : "Não foi possível salvar a loja."
      );
      return;
    }

    onSaved(data as Store);
  }

  return (
    <Dialog open={open} onClose={onClose} title={store ? "Editar loja" : "Nova loja"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="store-nome">Nome</Label>
          <Input id="store-nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="store-cidade">Cidade</Label>
          <Input
            id="store-cidade"
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="store-endereco">Endereço</Label>
          <Input
            id="store-endereco"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
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
