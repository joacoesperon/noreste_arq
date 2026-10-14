import { z } from "zod";

const texto = (max = 500) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null));

export const tareaSchema = z.object({
  titulo: z.string().trim().min(1, "El título es obligatorio").max(300),
  descripcion: texto(5000),
  obra_id: z.uuid().nullable(),
  tipo: z.enum(["general", "entrega"]),
  responsable_id: z.uuid().nullable(),
  fecha: z.iso.date().nullable(),
});

export type TareaInput = z.input<typeof tareaSchema>;

export const envioRevisionSchema = z.object({
  checklist: z.record(z.string(), z.boolean()),
  horas_reales: z.number({ error: "Registrá las horas reales" }).positive("Registrá las horas reales").max(10000),
  evidencia: z.string().trim().min(1, "Adjuntá el link o archivo final").max(2000),
  comentario_cierre: z.string().trim().min(1, "Dejá un comentario con lo hecho, lo pendiente y las dudas").max(5000),
  revisor_id: z.uuid({ error: "Elegí quién revisa" }),
});

export type EnvioRevisionInput = z.input<typeof envioRevisionSchema>;
