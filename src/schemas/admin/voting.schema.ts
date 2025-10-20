import { z } from "zod";

export const votingScheduleSchema = z.object({
	topicId: z.number().min(1, "Selecione um tópico"),
	startDate: z.string().min(1, "Data de início é obrigatória"),
	startTime: z.string().min(1, "Horário de início é obrigatório"),
	durationHours: z
		.number()
		.min(12, "Duração mínima de 12 horas")
		.max(720, "Duração máxima de 30 dias"),
});

export type VotingScheduleSchema = z.infer<typeof votingScheduleSchema>;

export const votingTopicSchema = z.object({
	title: z.string().min(5, "Título deve ter no mínimo 5 caracteres").trim(),
	description: z.string().min(10, "Descrição deve ter no mínimo 10 caracteres").trim(),
	options: z.array(z.string()).min(2, "Deve haver no mínimo 2 opções").default(["Sim", "Não"]),
});

export type VotingTopicSchema = z.infer<typeof votingTopicSchema>;
