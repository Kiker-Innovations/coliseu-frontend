import { z } from "zod";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export const registerSchema = z
	.object({
		buildingId: z.string().min(1, "Prédio é obrigatório"),
		apartmentId: z.string().min(1, "Apartamento é obrigatório"),
		name: z
			.string()
			.min(1, "Nome é obrigatório")
			.min(3, "Nome deve ter no mínimo 3 caracteres")
			.max(100, "Nome deve ter no máximo 100 caracteres")
			.trim(),
		email: z.string().min(1, "Email é obrigatório").email("Email inválido").trim(),
		password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres").trim(),
		confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória").trim(),
		phone: z
			.string()
			.min(1, "Telefone é obrigatório")
			.regex(/^\(\d{2}\)\s\d{5}-\d{4}$/, "Telefone inválido. Use o formato (11) 99999-9999")
			.trim(),
		document: z
			.string()
			.min(1, "CPF é obrigatório")
			.regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF inválido. Use o formato 000.000.000-00")
			.refine(
				(cpf) => {
					const cleanCpf = cpf.replace(/\D/g, "");
					if (cleanCpf.length !== 11) return false;
					if (/^(\d)\1{10}$/.test(cleanCpf)) return false;
					
					let sum = 0;
					for (let i = 0; i < 9; i++) {
						sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
					}
					let digit = 11 - (sum % 11);
					if (digit >= 10) digit = 0;
					if (digit !== parseInt(cleanCpf.charAt(9))) return false;
					
					sum = 0;
					for (let i = 0; i < 10; i++) {
						sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
					}
					digit = 11 - (sum % 11);
					if (digit >= 10) digit = 0;
					if (digit !== parseInt(cleanCpf.charAt(10))) return false;
					
					return true;
				},
				{ message: "CPF inválido" },
			),
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
