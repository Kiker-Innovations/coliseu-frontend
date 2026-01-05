import { z } from "zod";

export const loginSchema = z.object({
	buildingId: z.string().min(1, "Prédio é obrigatório"),
	email: z.string().min(1, "Email é obrigatório").email("Email inválido").trim(),
	password: z.string().min(1, "Senha é obrigatória").trim(),
	rememberMe: z.boolean().optional(),
});

export type LoginSchema = z.infer<typeof loginSchema>;
