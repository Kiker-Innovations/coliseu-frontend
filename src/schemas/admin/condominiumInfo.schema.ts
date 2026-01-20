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
	description: z.preprocess(
		(val) => (val === "" ? undefined : val),
		z.string().optional(),
	),
	type: z.preprocess(
		(val) => (val === "" ? undefined : val),
		z.enum(["COMODIDADE", "AREA_COMUM"]).optional(),
	),
	value: z.preprocess(
		(val) => {
			if (val === "" || val === null || val === undefined || isNaN(Number(val))) {
				return undefined;
			}
			const num = Number(val);
			return isNaN(num) ? undefined : num;
		},
		z.number().min(0, "Valor não pode ser negativo").optional(),
	),
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
	maxResidents: z.preprocess(
		(val) => {
			if (val === "" || val === null || val === undefined || isNaN(Number(val))) {
				return undefined;
			}
			const num = Number(val);
			return isNaN(num) ? undefined : num;
		},
		z
			.number()
			.min(1, "Máximo de residents deve ser pelo menos 1")
			.int("Deve ser um número inteiro")
			.optional(),
	),
	maxHours: z.preprocess(
		(val) => {
			if (val === "" || val === null || val === undefined || isNaN(Number(val))) {
				return undefined;
			}
			const num = Number(val);
			return isNaN(num) ? undefined : num;
		},
		z.number().max(24, "Limite de horas não pode ser maior que 24").optional(),
	),
	usageRules: z.preprocess(
		(val) => (val === "" ? undefined : val),
		z.string().optional(),
	),
	bookingType: z.preprocess(
		(val) => (val === "" ? undefined : val),
		z.enum(["DIARIO", "POR_HORAS"]).optional(),
	),
	openingTime: z.preprocess(
		(val) => (val === "" ? undefined : val),
		z
			.string()
			.regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, "Horário de abertura deve estar no formato HH:mm (ex: 08:00)")
			.optional(),
	),
	closingTime: z.preprocess(
		(val) => (val === "" ? undefined : val),
		z
			.string()
			.regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, "Horário de fechamento deve estar no formato HH:mm (ex: 22:00)")
			.optional(),
	),
	items: z
		.array(
			z.object({
				name: z.string().min(1, "Nome do item é obrigatório"),
				quantity: z.number().int().min(1, "Quantidade deve ser pelo menos 1"),
			})
		)
		.optional(),
	status: z.enum(["ATIVO", "INATIVO"]).default("ATIVO"),
})
.refine(
	(data) => {
		// Se openingTime ou closingTime for fornecido, ambos devem ser fornecidos
		if (
			(data.openingTime && !data.closingTime) ||
			(!data.openingTime && data.closingTime)
		) {
			return false;
		}
		return true;
	},
	{
		message: "Horário de abertura e fechamento devem ser fornecidos juntos",
		path: ["openingTime"],
	},
)
.refine(
	(data) => {
		// Se ambos forem fornecidos, closingTime deve ser maior que openingTime
		if (data.openingTime && data.closingTime) {
			const [openingHour, openingMinute] = data.openingTime.split(":").map(Number);
			const [closingHour, closingMinute] = data.closingTime.split(":").map(Number);
			const openingMinutes = openingHour * 60 + openingMinute;
			const closingMinutes = closingHour * 60 + closingMinute;
			
			if (closingMinutes <= openingMinutes) {
				return false;
			}
		}
		return true;
	},
	{
		message: "Horário de fechamento deve ser maior que horário de abertura",
		path: ["closingTime"],
	},
);

export type AmenitySchema = z.infer<typeof amenitySchema>;
