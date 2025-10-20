import { z } from "zod";

export const financialRegisterSchema = z.object({
	condominiumFund: z
		.number()
		.min(0, "O valor do caixa não pode ser negativo")
		.nonnegative("O valor deve ser positivo"),
	referenceMonth: z
		.string()
		.min(1, "Mês de referência é obrigatório")
		.regex(/^\d{4}-\d{2}$/, "Formato inválido (AAAA-MM)"),
});

export type FinancialRegisterSchema = z.infer<typeof financialRegisterSchema>;
