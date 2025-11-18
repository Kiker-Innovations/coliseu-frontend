import { z } from "zod";

export const oneTimeExpenseSchema = z.object({
	name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").trim(),
	description: z.string().min(3, "Descrição deve ter no mínimo 3 caracteres").trim(),
	value: z
		.number()
		.min(0.01, "Valor deve ser maior que zero")
		.nonnegative("O valor deve ser positivo"),
	receiptImage: z
		.instanceof(FileList)
		.optional()
		.refine(
			(files) => {
				if (!files || files.length === 0) return true;
				return files[0].size <= 5 * 1024 * 1024; // 5MB
			},
			{
				message: "A imagem deve ter no máximo 5MB",
			},
		)
		.refine(
			(files) => {
				if (!files || files.length === 0) return true;
				const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
				return validTypes.includes(files[0].type);
			},
			{
				message: "Apenas imagens JPEG, PNG ou WebP são aceitas",
			},
		),
});

export type OneTimeExpenseSchema = z.infer<typeof oneTimeExpenseSchema>;
