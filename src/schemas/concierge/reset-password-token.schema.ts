import { z } from "zod";

export const resetPasswordTokenSchema = z.object({
	token: z.string().min(1, "Token é obrigatório"),
	password: z
		.string({ required_error: "Senha é obrigatória" })
		.min(8, "Senha deve ter no mínimo 8 caracteres")
		.refine((val) => /[A-Z]/.test(val), "Senha deve conter pelo menos uma letra maiúscula")
		.refine((val) => /[a-z]/.test(val), "Senha deve conter pelo menos uma letra minúscula")
		.refine(
			(val) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val),
			"Senha deve conter pelo menos um caractere especial",
		),
});

export type ResetPasswordTokenSchema = z.infer<typeof resetPasswordTokenSchema>;
