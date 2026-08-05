"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createUserSchema, updateUserSchema } from "@/lib/validations/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";

type UserRow = {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  role: "PROMOTOR" | "ADMIN";
  ativo: boolean;
  primeiro_acesso: boolean;
};

export function UserManager({ initialUsers }: { initialUsers: UserRow[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<{
    email: string;
    password: string;
  } | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>Novo usuário</Button>
      </div>

      {temporaryPassword && (
        <div className="rounded-md border border-border bg-secondary p-4 text-sm">
          <p className="font-medium">
            Usuário {temporaryPassword.email} criado. Repasse a senha
            provisória por um canal seguro — ela some ao recarregar a
            página:
          </p>
          <code className="mt-2 block w-fit rounded bg-background px-2 py-1">
            {temporaryPassword.password}
          </code>
        </div>
      )}

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-secondary">
            <tr>
              <th className="px-4 py-2 font-medium">Nome</th>
              <th className="px-4 py-2 font-medium">E-mail</th>
              <th className="px-4 py-2 font-medium">Perfil</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-border">
                <td className="px-4 py-2">{user.nome}</td>
                <td className="px-4 py-2">{user.email}</td>
                <td className="px-4 py-2">
                  {user.role === "ADMIN" ? "Admin" : "Promotor"}
                </td>
                <td className="px-4 py-2">
                  {user.ativo ? "Ativo" : "Inativo"}
                </td>
                <td className="px-4 py-2 text-right">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(user)}>
                    Editar
                  </Button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  Nenhum usuário cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <CreateUserDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(user, password) => {
          setUsers((prev) => [user, ...prev]);
          setTemporaryPassword({ email: user.email, password });
          setCreateOpen(false);
        }}
      />

      <EditUserDialog
        user={editing}
        onClose={() => setEditing(null)}
        onSaved={(updated) => {
          setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
          setEditing(null);
        }}
      />
    </div>
  );
}

function CreateUserDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (user: UserRow, password: string) => void;
}) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [role, setRole] = useState<"PROMOTOR" | "ADMIN">("PROMOTOR");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setNome("");
      setEmail("");
      setTelefone("");
      setRole("PROMOTOR");
      setError(null);
    }
  }, [open]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const parsed = createUserSchema.safeParse({ nome, email, telefone, role });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }

    setLoading(true);
    const response = await fetch("/api/admin/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(result.error ?? "Não foi possível criar o usuário.");
      return;
    }

    onCreated(
      {
        id: result.id,
        nome: parsed.data.nome,
        email: parsed.data.email,
        telefone: parsed.data.telefone || null,
        role: parsed.data.role,
        ativo: true,
        primeiro_acesso: true,
      },
      result.temporaryPassword
    );
  }

  return (
    <Dialog open={open} onClose={onClose} title="Novo usuário">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome</Label>
          <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="telefone">Telefone</Label>
          <Input id="telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Perfil</Label>
          <Select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as "PROMOTOR" | "ADMIN")}
          >
            <option value="PROMOTOR">Promotor</option>
            <option value="ADMIN">Admin</option>
          </Select>
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
            {loading ? "Criando..." : "Criar usuário"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function EditUserDialog({
  user,
  onClose,
  onSaved,
}: {
  user: UserRow | null;
  onClose: () => void;
  onSaved: (user: UserRow) => void;
}) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [role, setRole] = useState<"PROMOTOR" | "ADMIN">("PROMOTOR");
  const [ativo, setAtivo] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setNome(user.nome);
      setTelefone(user.telefone ?? "");
      setRole(user.role);
      setAtivo(user.ativo);
      setError(null);
    }
  }, [user]);

  if (!user) return null;

  // TypeScript não mantém o narrowing de "user" dentro de uma closure
  // assíncrona definida depois do guard acima — capturamos numa constante
  // local para o compilador ter certeza de que não é mais null.
  const currentUser = user;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const parsed = updateUserSchema.safeParse({ nome, telefone, role, ativo });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }

    setLoading(true);
    const response = await fetch(`/api/admin/usuarios/${currentUser.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(result.error ?? "Não foi possível salvar.");
      return;
    }

    onSaved({ ...currentUser, nome, telefone: telefone || null, role, ativo });
  }

  return (
    <Dialog open={!!user} onClose={onClose} title={`Editar ${user.email}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="edit-nome">Nome</Label>
          <Input id="edit-nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-telefone">Telefone</Label>
          <Input
            id="edit-telefone"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-role">Perfil</Label>
          <Select
            id="edit-role"
            value={role}
            onChange={(e) => setRole(e.target.value as "PROMOTOR" | "ADMIN")}
          >
            <option value="PROMOTOR">Promotor</option>
            <option value="ADMIN">Admin</option>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="edit-ativo"
            type="checkbox"
            checked={ativo}
            onChange={(e) => setAtivo(e.target.checked)}
          />
          <Label htmlFor="edit-ativo">Usuário ativo</Label>
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
