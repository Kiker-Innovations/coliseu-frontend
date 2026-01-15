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
	description: z.string().optional(),
	value: z.number().min(0, "Valor não pode ser negativo").optional(),
	fineValue: z.number().min(0, "Valor da multa por atraso não pode ser negativo").optional(),
	nonComplianceFine: z
		.number()
		.min(0, "Valor da multa por descumprimento não pode ser negativo")
		.optional(),
});

export type CommonAreaSchema = z.infer<typeof commonAreaSchema>;

export const amenitySchema = z.object({
	name: z.string().min(1, "Nome é obrigatório").trim(),
	description: z.string().optional(),
	type: z.enum(["COMODIDADE", "AREA_COMUM"]).optional(),
	value: z.number().min(0, "Valor não pode ser negativo").optional(),
	fineValue: z.preprocess((val) => {
		if (val === "" || val === null || val === undefined || isNaN(Number(val))) {
			return undefined;
		}
		const num = Number(val);
		return isNaN(num) ? undefined : num;
	}, z.number().min(0, "Valor da multa por atraso não pode ser negativo").optional()),
	nonComplianceFine: z.preprocess((val) => {
		if (val === "" || val === null || val === undefined || isNaN(Number(val))) {
			return undefined;
		}
		const num = Number(val);
		return isNaN(num) ? undefined : num;
	}, z.number().min(0, "Valor da multa por descumprimento não pode ser negativo").optional()),
	maxResidents: z
		.number()
		.min(1, "Máximo de residents deve ser pelo menos 1")
		.int("Deve ser um número inteiro")
		.optional(),
	maxHours: z
		.number()
		.min(1, "Limite de horas deve ser pelo menos 1")
		.max(24, "Limite de horas não pode ser maior que 24")
		.optional(),
	usageRules: z.string().optional(),
	bookingType: z.enum(["DIARIO", "POR_HORAS"]).optional(),
	status: z.enum(["ATIVO", "INATIVO"]).default("ATIVO"),
})
.refine(
	(data) => {
		// Se bookingType é POR_HORAS, maxHours é obrigatório
		if (data.bookingType === "POR_HORAS" && (!data.maxHours || data.maxHours < 1)) {
			return false;
		}
		return true;
	},
	{
		message: "Quantidade máxima de horas é obrigatória quando o tipo de reserva é por horas",
		path: ["maxHours"],
	},
);

export type AmenitySchema = z.infer<typeof amenitySchema>;
