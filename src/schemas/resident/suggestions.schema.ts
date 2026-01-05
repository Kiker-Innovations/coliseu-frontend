import { z } from "zod";

export const suggestionSchema = z.object({
  title: z
    .string({ required_error: "Título é obrigatório" })
    .min(10, "Título deve ter no mínimo 10 caracteres")
    .max(100, "Título deve ter no máximo 100 caracteres")
    .trim(),
  description: z
    .string({ required_error: "Descrição é obrigatória" })
    .min(10, "Descrição deve ter no mínimo 10 caracteres")
    .max(1000, "Descrição deve ter no máximo 1000 caracteres")
    .trim(),
});

export type SuggestionSchema = z.infer<typeof suggestionSchema>;
