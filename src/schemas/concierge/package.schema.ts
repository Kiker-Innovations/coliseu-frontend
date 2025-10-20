import { z } from "zod";

export const packageSchema = z.object({
	recipientName: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").trim(),
	description: z.string().min(3, "Descrição deve ter no mínimo 3 caracteres").trim(),
	apartment: z.string().min(1, "Apartamento é obrigatório").trim(),
	arrivalDate: z.string().min(1, "Data de chegada é obrigatória"),
});

export const deliverySchema = z.object({
	receivedBy: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").trim(),
});

export type PackageSchema = z.infer<typeof packageSchema>;
export type DeliverySchema = z.infer<typeof deliverySchema>;
