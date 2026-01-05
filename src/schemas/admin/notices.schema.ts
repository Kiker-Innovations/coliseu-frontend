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

export const noticeSchema = z.object({
  title: z
    .string({ required_error: "Título do aviso é obrigatório" })
    .min(3, "Título deve ter no mínimo 3 caracteres")
    .max(200, "Título deve ter no máximo 200 caracteres")
    .trim(),
  content: z
    .string({ required_error: "Conteúdo é obrigatório" })
    .min(10, "Conteúdo deve ter no mínimo 10 caracteres")
    .max(10000, "Conteúdo deve ter no máximo 10000 caracteres"),
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
    )
    .optional(),
  status: z.enum(["ATIVO", "INATIVO"]).default("ATIVO"),
});

export type NoticeSchema = z.infer<typeof noticeSchema>;

export { MAX_FILE_SIZE, ACCEPTED_FILE_TYPES };
