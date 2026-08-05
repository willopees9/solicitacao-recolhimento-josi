import { z } from "zod";

export const createUserSchema = z.object({
  nome: z.string().min(2, "Informe o nome"),
  email: z.string().min(1, "Informe o e-mail").email("E-mail inválido"),
  telefone: z.string().optional().or(z.literal("")),
  role: z.enum(["PROMOTOR", "ADMIN"]),
});

export const updateUserSchema = z.object({
  nome: z.string().min(2, "Informe o nome"),
  telefone: z.string().optional().or(z.literal("")),
  role: z.enum(["PROMOTOR", "ADMIN"]),
  ativo: z.boolean(),
});

export const storeSchema = z.object({
  nome: z.string().min(1, "Informe o nome da loja"),
  cidade: z.string().min(1, "Informe a cidade"),
  endereco: z.string().optional().or(z.literal("")),
});

export const productSchema = z.object({
  codigo: z.string().min(1, "Informe o código"),
  descricao: z.string().min(1, "Informe a descrição"),
  unidade: z.string().optional().or(z.literal("")),
});

export const requestTypeSchema = z.object({
  nome: z.string().min(1, "Informe o nome do tipo"),
});

export const reviewDecisionSchema = z
  .object({
    decision: z.enum(["APROVAR", "SOLICITAR_CORRECAO", "REJEITAR"]),
    note: z.string().optional().or(z.literal("")),
  })
  .refine(
    (data) =>
      data.decision === "APROVAR" || (data.note && data.note.trim().length > 0),
    {
      message: "Informe uma observacao ou motivo.",
      path: ["note"],
    }
  );

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type StoreInput = z.infer<typeof storeSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type RequestTypeInput = z.infer<typeof requestTypeSchema>;
export type ReviewDecisionInput = z.infer<typeof reviewDecisionSchema>;
