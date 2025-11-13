import { z } from "zod";

export const loginSchema = z.object({
	buildingId: z.string().min(1, "Prédio é obrigatório"),
	email: z.string().email("E-mail inválido").trim(),
	password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
	rememberMe: z.boolean().default(false),
});

export type LoginSchema = z.infer<typeof loginSchema>;
