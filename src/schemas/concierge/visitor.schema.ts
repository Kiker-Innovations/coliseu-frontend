import { z } from "zod";

export const visitorSchema = z.object({
	name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").trim(),
	document: z
		.string()
		.regex(/^\d{11}$/, "Documento deve conter exatamente 11 dígitos")
		.optional()
		.or(z.literal("")),
	phone: z
		.string()
		.regex(/^[\d\s\(\)\-]+$/, "Telefone inválido")
		.optional()
		.or(z.literal("")),
	email: z
		.string()
		.email("Email inválido")
		.optional()
		.or(z.literal("")),
	vehicleType: z.string().optional().or(z.literal("")),
	vehiclePlate: z
		.string()
		.regex(/^[A-Z]{3}\d{4}$|^[A-Z]{3}\d[A-Z]\d{2}$/, "Placa inválida")
		.optional()
		.or(z.literal("")),
	// apartment removed - apartment is now linked to visit, not visitor
	types: z
		.array(z.enum(["convidado", "prestador_servico"]))
		.min(1, "Selecione pelo menos um tipo de visitante"),
	photo: z.instanceof(File, { message: "Foto é obrigatória" }),
	note: z.string().optional().or(z.literal("")),
});

export type VisitorSchema = z.infer<typeof visitorSchema>;

// Schema para edição (foto é opcional pois pode manter a original)
export const visitorEditSchema = visitorSchema.omit({ photo: true });

export type VisitorEditSchema = z.infer<typeof visitorEditSchema>;

