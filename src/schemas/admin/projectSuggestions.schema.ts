import { z } from "zod";

export const startVotingSchema = z
	.object({
		votingStartDate: z.string().min(1, "Data de início é obrigatória"),
		votingEndDate: z.string().min(1, "Data de término é obrigatória"),
	})
	.refine(
		(data) => {
			const start = new Date(data.votingStartDate);
			const end = new Date(data.votingEndDate);
			return end > start;
		},
		{
			message: "Data de término deve ser posterior à data de início",
			path: ["votingEndDate"],
		},
	);

export type StartVotingSchema = z.infer<typeof startVotingSchema>;

export const createProjectsSchema = z.object({
	top: z.number().min(1, "Mínimo de 1 projeto").max(10, "Máximo de 10 projetos").default(3),
});

export type CreateProjectsSchema = z.infer<typeof createProjectsSchema>;
