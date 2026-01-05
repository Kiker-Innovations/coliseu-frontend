import { z } from "zod";

export const fineNotificationSchema = z
	.object({
		type: z.enum(["fine", "notification"], {
			required_error: "Tipo é obrigatório",
		}),
		title: z.string().min(3, "Título deve ter no mínimo 3 caracteres").trim(),
		description: z.string().min(10, "Descrição deve ter no mínimo 10 caracteres").trim(),
		attachmentFile: z.any().optional(),
		relatedToCommonArea: z.boolean().default(false),
		commonAreaId: z.number().optional().nullable(),
		useDefaultFineValue: z.boolean().default(true),
		customFineValue: z.number().optional().nullable(),
	})
	.refine(
		(data) => {
			if (data.type === "fine" && data.relatedToCommonArea && !data.commonAreaId) {
				return false;
			}
			return true;
		},
		{
			message: "Área comum é obrigatória quando relacionada",
			path: ["commonAreaId"],
		},
	)
	.refine(
		(data) => {
			if (
				data.type === "fine" &&
				data.relatedToCommonArea &&
				!data.useDefaultFineValue &&
				(!data.customFineValue || data.customFineValue <= 0)
			) {
				return false;
			}
			return true;
		},
		{
			message: "Valor customizado é obrigatório quando não usar valor padrão",
			path: ["customFineValue"],
		},
	);

export type FineNotificationSchema = z.infer<typeof fineNotificationSchema>;
