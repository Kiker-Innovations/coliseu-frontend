import { z } from "zod";

export const voteSchema = z.object({
	projectSuggestionId: z.string().uuid("ID da sugestão inválido"),
	voteCount: z.number().min(1, "Mínimo de 1 voto").max(3, "Máximo de 3 votos"),
});

export type VoteSchema = z.infer<typeof voteSchema>;
