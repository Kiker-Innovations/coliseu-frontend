import { z } from "zod";

export const loginSchema = z.object({
	apartment: z
		.string()
		.min(1, "Número do apartamento é obrigatório")
		.max(4, "Número do apartamento deve ter no máximo 4 dígitos")
		.regex(/^\d+$/, "Número do apartamento deve conter apenas dígitos")
		.trim(),
	email: z.string().min(1, "Email é obrigatório").email("Email inválido").trim(),
	password: z.string().min(1, "Senha é obrigatória").trim(),
	rememberMe: z.boolean().optional(),
});

export type LoginSchema = z.infer<typeof loginSchema>;
