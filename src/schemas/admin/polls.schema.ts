import { z } from "zod";

export const pollSchema = z.object({
	question: z.string().min(10, "Pergunta deve ter no mínimo 10 caracteres").trim(),
	options: z
		.array(z.string().min(1, "Opção não pode estar vazia"))
		.min(2, "Deve haver no mínimo 2 opções")
		.max(5, "Deve haver no máximo 5 opções"),
	startDate: z.string().min(1, "Data de início é obrigatória"),
	startTime: z.string().min(1, "Horário de início é obrigatório"),
	durationHours: z
		.number()
		.min(12, "Duração mínima é de 12 horas")
		.int("Duração deve ser um número inteiro"),
});

export type PollSchema = z.infer<typeof pollSchema>;
