import { z } from "zod";

export const resetPasswordSchema = z.object({
	email: z.string().min(1, "Email é obrigatório").email("Email inválido").trim(),
});

export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;
