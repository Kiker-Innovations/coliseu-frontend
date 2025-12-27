import { z } from "zod";

export const condominiumBasicInfoSchema = z.object({
	totalApartments: z
		.number()
		.min(1, "Deve haver pelo menos 1 apartamento")
		.int("Deve ser um número inteiro"),
});

export type CondominiumBasicInfoSchema = z.infer<typeof condominiumBasicInfoSchema>;

export const commonAreaSchema = z.object({
	name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").trim(),
	quantity: z.number().min(1, "Quantidade deve ser pelo menos 1").int("Deve ser um número inteiro"),
	description: z.string().optional(),
	value: z.number().min(0, "Valor não pode ser negativo").optional(),
	fineValue: z.number().min(0, "Valor da multa não pode ser negativo").optional(),
});

export type CommonAreaSchema = z.infer<typeof commonAreaSchema>;

export const amenitySchema = z.object({
	name: z.string().min(1, "Nome é obrigatório").trim(),
	quantity: z.number().min(1, "Quantidade deve ser pelo menos 1").int("Deve ser um número inteiro").optional(),
	description: z.string().optional(),
	type: z.enum(["COMODIDADE", "AREA_COMUM"]).optional(),
	value: z.number().min(0, "Valor não pode ser negativo").optional(),
	fineValue: z.number().min(0, "Valor da multa não pode ser negativo").optional(),
	maxResidents: z.number().min(1, "Máximo de residents deve ser pelo menos 1").int("Deve ser um número inteiro").optional(),
	bookingType: z.enum(["DIARIO", "POR_HORAS"]).optional(),
	maxHours: z.number().min(1, "Máximo de horas deve ser pelo menos 1").int("Deve ser um número inteiro").optional(),
	status: z.enum(["ATIVO", "INATIVO"]).default("ATIVO"),
});

export type AmenitySchema = z.infer<typeof amenitySchema>;