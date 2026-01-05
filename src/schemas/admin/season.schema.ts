import { z } from "zod";

export const createSeasonSchema = z.object({
	reusedSuggestions: z.boolean().default(false),
});

export type CreateSeasonSchema = z.infer<typeof createSeasonSchema>;
