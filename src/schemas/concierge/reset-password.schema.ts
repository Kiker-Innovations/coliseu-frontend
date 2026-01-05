import { z } from "zod";

export const resetPasswordSchema = z.object({
	email: z.string().email("E-mail inválido").trim(),
});

export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;
