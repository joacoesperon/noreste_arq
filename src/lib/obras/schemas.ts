import { z } from "zod";
import { ESTADOS } from "./constants";

/** Texto opcional: "" y espacios se guardan como null. */
const texto = (max = 500) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null));

const m2 = z.number().nonnegative("No puede ser negativa").max(10_000_000).nullable();
const meses = z.number().positive("Tiene que ser mayor a 0").max(600).nullable();
const fecha = z.iso.date().nullable();

export const generalesSchema = z.object({
  titulo: z.string().trim().min(1, "El título es obligatorio").max(200),
  tipologia: texto(200),
  estado: z.enum(ESTADOS.map((e) => e.value) as [string, ...string[]]),
  notas: texto(5000),
});

export const clienteDatosSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre del cliente es obligatorio").max(200),
  dni_cuit: texto(50),
  domicilio: texto(300),
  email: z
    .union([z.email("Correo inválido"), z.literal("")])
    .nullish()
    .transform((v) => (v ? v : null)),
  telefono: texto(50),
  notas: texto(2000),
});

export const clienteSchema = z.object({
  /** null: cliente nuevo (si hay datos) o sin cliente (si datos es null). */
  cliente_id: z.uuid().nullable(),
  datos: clienteDatosSchema.nullable(),
});

export const ubicacionSchema = z.object({
  direccion: texto(300),
  localidad: texto(200),
  provincia: texto(200),
});

export const superficiesSchema = z
  .object({
    usa_sectores: z.boolean(),
    sup_cubierta: m2,
    sup_semicubierta: m2,
    sup_descubierta: m2,
    sectores: z.array(
      z.object({
        nombre: z.string().trim().min(1, "Cada sector necesita un nombre").max(200),
        sup_cubierta: m2,
        sup_semicubierta: m2,
        sup_descubierta: m2,
      })
    ),
  })
  .refine((v) => !v.usa_sectores || v.sectores.length > 0, {
    message: "Agregá al menos un sector o desactivá la división en sectores",
    path: ["sectores"],
  });

export const serviciosSchema = z.object({
  servicios: z.array(z.string().trim().min(1).max(200)),
  proyecto_inicio: fecha,
  proyecto_duracion_meses: meses,
  obra_inicio: fecha,
  obra_duracion_meses: meses,
});

export const equipoSchema = z.object({
  colaboradores: z.array(
    z
      .object({
        staff_id: z.uuid().nullable(),
        nombre: texto(200),
        rol: texto(200),
        contacto: texto(300),
      })
      .refine((c) => c.staff_id || c.nombre, { message: "Elegí una persona del estudio o escribí un nombre" })
  ),
  especialidades: z.array(
    z.object({
      especialidad: z.string().trim().min(1, "Indicá la especialidad").max(200),
      responsable: texto(200),
      contacto: texto(300),
    })
  ),
});

export type GeneralesInput = z.input<typeof generalesSchema>;
export type ClienteInput = z.input<typeof clienteSchema>;
export type ClienteDatosInput = z.input<typeof clienteDatosSchema>;
export type UbicacionInput = z.input<typeof ubicacionSchema>;
export type SuperficiesInput = z.input<typeof superficiesSchema>;
export type ServiciosInput = z.input<typeof serviciosSchema>;
export type EquipoInput = z.input<typeof equipoSchema>;
