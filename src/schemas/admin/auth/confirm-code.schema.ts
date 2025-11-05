import { z } from "zod";

export const confirmCodeSchema = z.object({
	email: z.string().min(1, "Email é obrigatório").email("Email inválido").trim(),
	code: z
		.string()
		.min(1, "Código é obrigatório")
		.length(6, "Código deve ter exatamente 6 caracteres")
		.regex(/^[A-Z0-9]+$/, "Código deve conter apenas letras maiúsculas e números")
		.trim(),
});

export type ConfirmCodeSchema = z.infer<typeof confirmCodeSchema>;
