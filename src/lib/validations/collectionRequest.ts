import { z } from "zod";

export const collectionRequestItemInputSchema = z
  .object({
    productId: z.string().uuid().nullable(),
    descricaoManual: z.string().nullable(),
    quantidade: z.number().positive("Quantidade deve ser maior que zero"),
    unidade: z.string().nullable(),
    lote: z.string().nullable(),
    validade: z.string().nullable(),
    observacao: z.string().nullable(),
  })
  .refine(
    (item) => !!item.productId || !!(item.descricaoManual && item.descricaoManual.trim().length > 0),
    {
      message: "Cada produto precisa ser do cadastro ou ter uma descrição",
      path: ["descricaoManual"],
    }
  );

export const novaSolicitacaoSchema = z.object({
  storeId: z.string().uuid("Selecione uma loja"),
  vendedor: z.string().min(1, "Informe o vendedor"),
  nfd: z.string().min(1, "Informe o NFD"),
  requestTypeId: z.string().uuid("Selecione o tipo"),
  observacoes: z.string().min(1, "Informe as observações"),
  itens: z.array(collectionRequestItemInputSchema).min(1, "Adicione pelo menos um produto"),
});

export type CollectionRequestItemInput = z.infer<typeof collectionRequestItemInputSchema>;
export type NovaSolicitacaoInput = z.infer<typeof novaSolicitacaoSchema>;
