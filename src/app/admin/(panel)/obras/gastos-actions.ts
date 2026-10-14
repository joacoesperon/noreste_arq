"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getStaff } from "@/lib/auth";
import { cotizacionDolar } from "@/lib/gastos/cotizacion";
import { createClient } from "@/lib/supabase/server";

type Resultado = { ok: true } | { ok: false; error: string };
const SIN_SESION = { ok: false, error: "Tu sesión venció." } as const;

const texto = (max = 500) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null));

const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida");
const moneda = z.enum(["ARS", "USD"]);

const gastoSchema = z.object({
  obra_id: z.uuid(),
  fecha,
  rubro: z.string().trim().min(1, "Indicá el rubro").max(100),
  detalle: texto(500),
  gremio_id: z.uuid().nullish().transform((v) => v ?? null),
  monto: z.number().positive("El monto tiene que ser mayor a cero"),
  moneda,
  cotizacion: z.number().positive().nullish().transform((v) => v ?? null),
  pagado: z.boolean(),
  sin_recibo: z.boolean(),
});

/** Pesos por dólar (blue, compra) en esa fecha, para completar el formulario. */
export async function cotizacionDelDia(dia: string): Promise<number | null> {
  if (!(await getStaff())) return null;
  return cotizacionDolar(dia);
}

export async function guardarGasto(id: string | null, payload: unknown): Promise<Resultado> {
  const staff = await getStaff();
  if (!staff) return SIN_SESION;
  const parsed = gastoSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const datos = { ...parsed.data, cotizacion: parsed.data.cotizacion ?? (await cotizacionDolar(parsed.data.fecha)) };
  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("obra_gastos").update(datos).eq("id", id)
    : await supabase.from("obra_gastos").insert({ ...datos, created_by: staff.id });
  if (error) {
    console.error("guardarGasto", error);
    return { ok: false, error: "No se pudo guardar el gasto." };
  }
  revalidatePath(`/admin/obras/${parsed.data.obra_id}`);
  return { ok: true };
}

export async function eliminarGasto(id: string): Promise<Resultado> {
  if (!(await getStaff())) return SIN_SESION;
  const supabase = await createClient();
  const { data, error } = await supabase.from("obra_gastos").delete().eq("id", id).select("obra_id").single();
  if (error) return { ok: false, error: "No se pudo eliminar." };
  revalidatePath(`/admin/obras/${data.obra_id}`);
  return { ok: true };
}

const gremioSchema = z.object({
  obra_id: z.uuid(),
  nombre: z.string().trim().min(1, "Indicá el nombre").max(200),
  rubro: texto(100),
  monto_acordado: z.number().nonnegative().nullish().transform((v) => v ?? null),
  moneda,
  notas: texto(1000),
});

export async function guardarGremio(id: string | null, payload: unknown): Promise<Resultado> {
  if (!(await getStaff())) return SIN_SESION;
  const parsed = gremioSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("obra_gremios").update(parsed.data).eq("id", id)
    : await supabase.from("obra_gremios").insert(parsed.data);
  if (error) return { ok: false, error: "No se pudo guardar." };
  revalidatePath(`/admin/obras/${parsed.data.obra_id}`);
  return { ok: true };
}

export async function eliminarGremio(id: string): Promise<Resultado> {
  if (!(await getStaff())) return SIN_SESION;
  const supabase = await createClient();
  const { data, error } = await supabase.from("obra_gremios").delete().eq("id", id).select("obra_id").single();
  if (error) return { ok: false, error: "No se pudo eliminar." };
  revalidatePath(`/admin/obras/${data.obra_id}`);
  return { ok: true };
}

const importarSchema = z.object({
  obra_id: z.uuid(),
  filas: z
    .array(
      z.object({
        fecha,
        rubro: z.string().trim().min(1).max(100),
        detalle: texto(500),
        monto: z.number().positive(),
        moneda,
        cotizacion: z.number().positive().nullish().transform((v) => v ?? null),
        pagado: z.boolean(),
      })
    )
    .min(1, "No hay filas para importar")
    .max(2000),
});

/** Importa los gastos de una planilla. Las cotizaciones que faltan se buscan por fecha. */
export async function importarGastos(payload: unknown): Promise<Resultado & { cantidad?: number }> {
  const staff = await getStaff();
  if (!staff) return SIN_SESION;
  const parsed = importarSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { obra_id, filas } = parsed.data;

  const fechas = [...new Set(filas.filter((f) => !f.cotizacion).map((f) => f.fecha))];
  const cotizaciones = new Map<string, number | null>();
  for (let i = 0; i < fechas.length; i += 8) {
    const lote = fechas.slice(i, i + 8);
    const valores = await Promise.all(lote.map(cotizacionDolar));
    lote.forEach((f, j) => cotizaciones.set(f, valores[j]));
  }

  const supabase = await createClient();
  const { error } = await supabase.from("obra_gastos").insert(
    filas.map((f) => ({ ...f, obra_id, cotizacion: f.cotizacion ?? cotizaciones.get(f.fecha) ?? null, created_by: staff.id }))
  );
  if (error) {
    console.error("importarGastos", error);
    return { ok: false, error: "No se pudieron importar los gastos." };
  }
  revalidatePath(`/admin/obras/${obra_id}`);
  return { ok: true, cantidad: filas.length };
}
