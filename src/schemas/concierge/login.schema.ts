import { z } from "zod";

export const loginSchema = z.object({
<<<<<<< HEAD
	buildingId: z.string().min(1, "Prédio é obrigatório"),
=======
	buildingId: z.string().min(1, "ID do condomínio é obrigatório").trim(),
>>>>>>> 48538fe (feat: implementa integraÃ§Ã£o completa de encomendas do concierge)
	email: z.string().email("E-mail inválido").trim(),
	password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
	rememberMe: z.boolean().default(false),
});

export type LoginSchema = z.infer<typeof loginSchema>;
