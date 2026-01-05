import { z } from "zod";

export const fineCreateSchema = z.object({
	name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").trim(),
	description: z
		.string()
		.min(10, "Descrição deve ter no mínimo 10 caracteres")
		.trim(),
	value: z
		.number({ required_error: "Valor é obrigatório" })
		.positive("Valor deve ser positivo")
		.min(0.01, "Valor deve ser maior que zero"),
});

export type FineCreateSchema = z.infer<typeof fineCreateSchema>;

export const fineUpdateSchema = z.object({
	name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").trim().optional(),
	description: z
		.string()
		.min(10, "Descrição deve ter no mínimo 10 caracteres")
		.trim()
		.optional(),
	value: z
		.number({ required_error: "Valor é obrigatório" })
		.positive("Valor deve ser positivo")
		.min(0.01, "Valor deve ser maior que zero")
		.optional(),
});

export type FineUpdateSchema = z.infer<typeof fineUpdateSchema>;

export const infractionFineSchema = z.object({
	fineId: z.string().uuid("ID da multa inválido"),
	apartmentId: z.string().uuid("ID do apartamento inválido"),
	value: z
		.number({ required_error: "Valor é obrigatório" })
		.positive("Valor deve ser positivo")
		.min(0.01, "Valor deve ser maior que zero"),
	occurrenceDate: z
		.string({ required_error: "Data da ocorrência é obrigatória" })
		.datetime({ message: "Data da ocorrência inválida (ISO 8601)" }),
});

export type InfractionFineSchema = z.infer<typeof infractionFineSchema>;

export const infractionNotificationSchema = z.object({
	fineId: z.string().uuid("ID da multa/notificação inválido"),
	apartmentId: z.string().uuid("ID do apartamento inválido"),
	description: z
		.string()
		.min(10, "Descrição deve ter no mínimo 10 caracteres")
		.trim(),
	occurrenceDate: z
		.string({ required_error: "Data da ocorrência é obrigatória" })
		.datetime({ message: "Data da ocorrência inválida (ISO 8601)" }),
});

export type InfractionNotificationSchema = z.infer<
	typeof infractionNotificationSchema
>;

// Legacy schema for backward compatibility (temporary)
export const fineNotificationSchema = z.object({
	type: z.enum(["fine", "notification"]),
	title: z.string().min(3).trim(),
	description: z.string().min(10).trim(),
	attachmentFile: z.any().optional(),
	relatedToCommonArea: z.boolean().default(false),
	commonAreaId: z.number().optional().nullable(),
	useDefaultFineValue: z.boolean().default(true),
	customFineValue: z.number().optional().nullable(),
});

export type FineNotificationSchema = z.infer<typeof fineNotificationSchema>;
