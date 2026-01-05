import { z } from "zod";

export const updatePasswordSchema = z
	.object({
		email: z.string().min(1, "Email é obrigatório").email("Email inválido").trim(),
		code: z
			.string()
			.min(1, "Código é obrigatório")
			.length(6, "Código deve ter exatamente 6 caracteres")
			.regex(/^[0-9]+$/, "Código deve conter apenas números")
			.trim(),
		newPassword: z.string().min(6, "A nova senha deve ter no mínimo 6 caracteres").trim(),
		confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória").trim(),
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: "As senhas não coincidem",
		path: ["confirmPassword"],
	});

export type UpdatePasswordSchema = z.infer<typeof updatePasswordSchema>;
