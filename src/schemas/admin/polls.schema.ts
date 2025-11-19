import { z } from "zod";

const pollOptionSchema = z.object({
	optionDescription: z.string().min(1, "Descrição da opção não pode estar vazia").trim(),
	optionVotes: z.number().int().default(0),
	optionPercente: z.number().default(0),
});

export const pollSchema = z.object({
	question: z.string().min(10, "Pergunta deve ter no mínimo 10 caracteres").trim(),
	options: z
		.array(pollOptionSchema)
		.min(2, "Deve haver no mínimo 2 opções")
		.max(5, "Deve haver no máximo 5 opções"),
	startDate: z.string().min(1, "Data de início é obrigatória"),
	endDate: z.string().min(1, "Data final é obrigatória"),
	status: z.enum(["ATIVO"]).default("ATIVO"),
}).refine((data) => {
	if (data.startDate && data.endDate) {
		const start = new Date(data.startDate);
		const end = new Date(data.endDate);
		return end > start;
	}
	return true;
}, {
	message: "Data final deve ser posterior à data de início",
	path: ["endDate"],
});

export type PollSchema = z.infer<typeof pollSchema>;
export type PollOptionSchema = z.infer<typeof pollOptionSchema>;
