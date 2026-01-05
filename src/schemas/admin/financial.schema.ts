import { z } from "zod";

export const financialRegisterSchema = z.object({
  title: z
    .string()
    .min(3, "O título deve ter pelo menos 3 caracteres")
    .max(100, "O título deve ter no máximo 100 caracteres"),
  value: z
    .number()
    .min(0.01, "O valor deve ser maior que zero")
    .nonnegative("O valor deve ser positivo"),
});

export type FinancialRegisterSchema = z.infer<typeof financialRegisterSchema>;
