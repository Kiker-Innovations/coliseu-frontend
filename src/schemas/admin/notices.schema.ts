import { z } from "zod";

export const noticeSchema = z.object({
	title: z.string().min(3, "Título deve ter no mínimo 3 caracteres").trim(),
	description: z.string().min(10, "Descrição deve ter no mínimo 10 caracteres").trim(),
	attachmentFile: z.any().optional(),
});

export type NoticeSchema = z.infer<typeof noticeSchema>;
