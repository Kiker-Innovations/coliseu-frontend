import { z } from "zod";

const MAX_FILE_SIZE = 300 * 1024 * 1024; // 300MB

const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/jpeg",
  "image/jpg",
  "image/png",
];

export const documentSchema = z.object({
  name: z
    .string({ required_error: "Nome do documento é obrigatório" })
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(200, "Nome deve ter no máximo 200 caracteres"),
  description: z
    .string({ required_error: "Descrição é obrigatória" })
    .min(10, "Descrição deve ter no mínimo 10 caracteres")
    .max(1000, "Descrição deve ter no máximo 1000 caracteres"),
  file: z
    .custom<FileList>()
    .refine((files) => files && files.length === 1, "Arquivo é obrigatório")
    .refine(
      (files) => (files?.[0]?.size ? files[0].size <= MAX_FILE_SIZE : false),
      "Tamanho máximo do arquivo é 300MB"
    )
    .refine(
      (files) =>
        files?.[0]?.type ? ACCEPTED_FILE_TYPES.includes(files[0].type) : false,
      "Tipo de arquivo inválido. Aceitos: PDF, DOC, DOCX, PPT, PPTX, JPEG, PNG"
    ),
});

export const documentUpdateSchema = z.object({
  name: z
    .string()
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(200, "Nome deve ter no máximo 200 caracteres")
    .optional(),
  description: z
    .string()
    .min(10, "Descrição deve ter no mínimo 10 caracteres")
    .max(1000, "Descrição deve ter no máximo 1000 caracteres")
    .optional(),
});

export type DocumentSchema = z.infer<typeof documentSchema>;
export type DocumentUpdateSchema = z.infer<typeof documentUpdateSchema>;

export { MAX_FILE_SIZE, ACCEPTED_FILE_TYPES };
