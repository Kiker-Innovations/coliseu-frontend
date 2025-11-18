import { z } from "zod";

export const recurringExpenseSchema = z
	.object({
		name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").trim(),
		value: z
			.number()
			.min(0.01, "Valor deve ser maior que zero")
			.nonnegative("O valor deve ser positivo"),
		hasExpirationDate: z.boolean().default(false),
		expirationDate: z.string().optional(),
	})
	.refine(
		(data) => {
			if (data.hasExpirationDate && !data.expirationDate) {
				return false;
			}
			return true;
		},
		{
			message: "Data de validade é obrigatória quando habilitada",
			path: ["expirationDate"],
		},
	);

export type RecurringExpenseSchema = z.infer<typeof recurringExpenseSchema>;
