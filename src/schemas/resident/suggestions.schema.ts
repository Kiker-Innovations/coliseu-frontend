import { z } from "zod";

export const suggestionSchema = z.object({
	title: z
		.string()
		.min(1, "Título é obrigatório")
		.max(100, "Título deve ter no máximo 100 caracteres")
		.trim(),
	description: z
		.string()
		.min(1, "Descrição é obrigatória")
		.max(500, "Descrição deve ter no máximo 500 caracteres")
		.trim(),
});

export type SuggestionSchema = z.infer<typeof suggestionSchema>;
