import { z } from "zod";

export const contestFineSchema = z.object({
	description: z.string().min(20, "Descrição deve ter no mínimo 20 caracteres").trim(),
	attachmentFile: z.any().optional(),
});

export type ContestFineSchema = z.infer<typeof contestFineSchema>;
