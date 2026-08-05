"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { requestTypeSchema } from "@/lib/validations/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog } from "@/components/ui/dialog";

type RequestType = {
  id: string;
  nome: string;
  ativo: boolean;
};

export function RequestTypeManager({
  initialTypes,
}: {
  initialTypes: RequestType[];
}) {
  const [types, setTypes] = useState(initialTypes);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RequestType | null>(null);

  async function toggleAtivo(type: RequestType) {
    const supabase = createClient();
    const { error } = await supabase
      .from("request_types")
      .update({ ativo: !type.ativo })
      .eq("id", type.id);

    if (!error) {
      setTypes((prev) =>
        prev.map((t) => (t.id === type.id ? { ...t, ativo: !t.ativo } : t))
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
          Novo tipo
        </Button>
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-secondary">
            <tr>
              <th className="px-4 py-2 font-medium">Nome</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {types.map((type) => (
              <tr key={type.id} className="border-t border-border">
                <td className="px-4 py-2">{type.nome}</td>
                <td className="px-4 py-2">{type.ativo ? "Ativo" : "Inativo"}</td>
                <td className="px-4 py-2 text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditing(type);
                      setDialogOpen(true);
                    }}
                  >
                    Editar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => toggleAtivo(type)}>
                    {type.ativo ? "Desativar" : "Ativar"}
                  </Button>
                </td>
              </tr>
            ))}
            {types.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                  Nenhum tipo cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <RequestTypeFormDialog
        open={dialogOpen}
        type={editing}
        onClose={() => setDialogOpen(false)}
        onSaved={(saved) => {
          setTypes((prev) => {
            const exists = prev.some((t) => t.id === saved.id);
            return exists ? prev.map((t) => (t.id === saved.id ? saved : t)) : [saved, ...prev];
          });
          setDialogOpen(false);
        }}
      />
    </div>
  );
}

function RequestTypeFormDialog({
  open,
  type,
  onClose,
  onSaved,
}: {
  open: boolean;
  type: RequestType | null;
  onClose: () => void;
  onSaved: (type: RequestType) => void;
}) {
  const [nome, setNome] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setNome(type?.nome ?? "");
    setError(null);
  }, [type, open]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const parsed = requestTypeSchema.safeParse({ nome });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data, error: dbError } = type
      ? await supabase
          .from("request_types")
          .update({ nome: parsed.data.nome })
          .eq("id", type.id)
          .select()
          .single()
      : await supabase
          .from("request_types")
          .insert({ nome: parsed.data.nome })
          .select()
          .single();

    setLoading(false);

    if (dbError || !data) {
      setError(
        dbError?.code === "23505"
          ? "Já existe um tipo com esse nome."
          : "Não foi possível salvar o tipo."
      );
      return;
    }

    onSaved(data as RequestType);
  }

  return (
    <Dialog open={open} onClose={onClose} title={type ? "Editar tipo" : "Novo tipo"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="type-nome">Nome</Label>
          <Input id="type-nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
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
