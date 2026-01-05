import { z } from "zod";

export const packageSchema = z.object({
	recipientName: z.union([
		z.literal(""),
		z.string().trim().min(3, "Nome deve ter no mínimo 3 caracteres")
	]).optional(),
	description: z.union([
		z.literal(""),
		z.string().trim().min(3, "Descrição deve ter no mínimo 3 caracteres")
	]).optional(),
	courierName: z.union([
		z.literal(""),
		z.string().trim().min(3, "Nome deve ter no mínimo 3 caracteres")
	]).optional(),
	apartment: z.string().min(1, "Apartamento é obrigatório").trim(),
	arrivalDate: z.string().min(1, "Data de chegada é obrigatória"),
});

export const deliverySchema = z.object({
	receivedBy: z.union([
		z.literal(""),
		z.string().trim().min(3, "Nome deve ter no mínimo 3 caracteres")
	]).optional(),
});

export const cancelSchema = z.object({
	cancelReason: z.string().min(3, "Motivo deve ter no mínimo 3 caracteres").trim(),
});

export type PackageSchema = z.infer<typeof packageSchema>;
export type DeliverySchema = z.infer<typeof deliverySchema>;
export type CancelSchema = z.infer<typeof cancelSchema>;
