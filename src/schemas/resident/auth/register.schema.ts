import { z } from "zod";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export const registerSchema = z
	.object({
		name: z
			.string()
			.min(1, "Nome é obrigatório")
			.min(3, "Nome deve ter no mínimo 3 caracteres")
			.max(100, "Nome deve ter no máximo 100 caracteres")
			.trim(),
		apartmentNumber: z
			.string()
			.min(1, "Número do apartamento é obrigatório")
			.max(4, "Número do apartamento deve ter no máximo 4 dígitos")
			.regex(/^\d+$/, "Número do apartamento deve conter apenas dígitos")
			.trim(),
		email: z.string().min(1, "Email é obrigatório").email("Email inválido").trim(),
		password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres").trim(),
		confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória").trim(),
		phone: z
			.string()
			.min(1, "Telefone é obrigatório")
			.regex(/^\(\d{2}\)\s\d{5}-\d{4}$/, "Telefone inválido. Use o formato (11) 99999-9999")
			.trim(),
		photo: z
			.instanceof(FileList)
			.refine((files) => files.length > 0, "Foto de verificação é obrigatória")
			.refine((files) => files[0]?.size <= MAX_FILE_SIZE, "A foto deve ter no máximo 5MB")
			.refine(
				(files) => ACCEPTED_IMAGE_TYPES.includes(files[0]?.type),
				"Formato de imagem inválido. Use JPEG, PNG ou WEBP",
			),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "As senhas não coincidem",
		path: ["confirmPassword"],
	});

export type RegisterSchema = z.infer<typeof registerSchema>;
