import { z } from "zod";

export const conciergeSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("E-mail inválido"),
  shift: z.enum(["MANHA", "TARDE", "NOITE"], {
    required_error: "Turno é obrigatório",
    invalid_type_error: "Turno inválido",
  }),
  phone: z.string().min(1, "Telefone é obrigatório"),
  passwordHash: z
    .string()
    .optional(),
  status: z.enum(["ATIVO", "INATIVO", "DE_FERIAS"], {
    invalid_type_error: "Status inválido",
  }).optional(),
});

export type ConciergeSchema = z.infer<typeof conciergeSchema>;


