import { z } from "zod";

export const contestFineSchema = z.object({
	description: z.string().min(1, "Descrição é obrigatória").trim(),
	attachmentFile: z.any().optional(),
});

export type ContestFineSchema = z.infer<typeof contestFineSchema>;
