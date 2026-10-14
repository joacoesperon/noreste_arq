"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { Json } from "@/lib/database.types";
import { getStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getPlantilla } from "@/lib/documentos/queries";
import { tipoDocumento } from "@/lib/documentos/tipos";

type Resultado = { ok: true } | { ok: false; error: string };

const contenidoSchema = z.object({ type: z.literal("doc") }).passthrough();
const borradorSchema = z.object({
  titulo: z.string().trim().min(1, "El documento necesita un título").max(300),
  contenido: contenidoSchema,
  datos: z.record(z.string(), z.unknown()),
});

const SIN_SESION = { ok: false, error: "Tu sesión venció." } as const;

function revalidarDocumento(obraId: string, documentoId: string) {
  revalidatePath(`/admin/obras/${obraId}`);
  revalidatePath(`/admin/obras/${obraId}/documentos/${documentoId}`);
  revalidatePath("/admin/documentos");
}

export async function crearDocumento(obraId: string, clave: string) {
  const staff = await getStaff();
  if (!staff) return SIN_SESION;
  const tipo = tipoDocumento(clave);
  if (!tipo) return { ok: false as const, error: "Tipo de documento inválido." };

  const supabase = await createClient();
  const { data: obra } = await supabase.from("obras").select("titulo").eq("id", obraId).single();
  if (!obra) return { ok: false as const, error: "La obra no existe." };

  const plantilla = await getPlantilla(clave);
  const datos: Record<string, unknown> = { ...(tipo.inicial ?? {}) };
  // Índice CAC de referencia: el último mes cargado en el presupuestador.
  if (tipo.campos.some((c) => c.key === "indice_cac")) {
    const { data: cac } = await supabase.from("indices_cac").select("mes, valor").order("mes", { ascending: false }).limit(1).maybeSingle();
    if (cac) {
      datos.indice_cac = cac.valor.toLocaleString("es-AR");
      datos.fecha_cac = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${cac.mes}T00:00:00Z`));
    }
  }
  const { data, error } = await supabase
    .from("documentos")
    .insert({
      obra_id: obraId,
      tipo: clave,
      titulo: `${tipo.nombre} · ${obra.titulo}`,
      contenido: plantilla.contenido as Json,
      datos: datos as Json,
      created_by: staff.id,
    })
    .select("id")
    .single();
  if (error) {
    console.error("crearDocumento", error);
    return { ok: false as const, error: "No se pudo crear el documento." };
  }
  revalidatePath(`/admin/obras/${obraId}`);
  redirect(`/admin/obras/${obraId}/documentos/${data.id}`);
}

export async function guardarBorrador(id: string, payload: unknown): Promise<Resultado> {
  if (!(await getStaff())) return SIN_SESION;
  const parsed = borradorSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documentos")
    .update({ titulo: parsed.data.titulo, contenido: parsed.data.contenido as Json, datos: parsed.data.datos as Json })
    .eq("id", id)
    .select("obra_id")
    .single();
  if (error || !data) return { ok: false, error: "No se pudo guardar." };
  revalidarDocumento(data.obra_id, id);
  return { ok: true };
}

/** Congela el documento tal como se ve (bloques ya resueltos) como nueva versión. */
export async function crearVersion(
  id: string,
  payload: unknown,
  bloques: unknown,
  nota: string
): Promise<{ ok: true; numero: number } | { ok: false; error: string }> {
  if (!(await getStaff())) return SIN_SESION;
  const parsed = borradorSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  if (!Array.isArray(bloques)) return { ok: false, error: "Documento inválido." };

  const supabase = await createClient();
  const { error: tituloError } = await supabase.from("documentos").update({ titulo: parsed.data.titulo }).eq("id", id);
  const { data: numero, error } = await supabase.rpc("crear_version_documento", {
    p_documento_id: id,
    p_contenido: parsed.data.contenido as Json,
    p_datos: parsed.data.datos as Json,
    p_bloques: bloques as Json,
    p_nota: nota.trim() || undefined,
  });
  if (error || tituloError || numero === null) {
    console.error("crearVersion", error ?? tituloError);
    return { ok: false, error: "No se pudo guardar la versión." };
  }
  const { data: doc } = await supabase.from("documentos").select("obra_id").eq("id", id).single();
  if (doc) revalidarDocumento(doc.obra_id, id);
  return { ok: true, numero };
}

export async function obtenerVersion(versionId: string) {
  if (!(await getStaff())) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("documento_versiones")
    .select("numero, bloques, documento:documentos(titulo)")
    .eq("id", versionId)
    .single();
  return data;
}

export async function eliminarDocumento(id: string): Promise<Resultado> {
  if (!(await getStaff())) return SIN_SESION;
  const supabase = await createClient();
  const { data, error } = await supabase.from("documentos").delete().eq("id", id).select("obra_id").single();
  if (error || !data) return { ok: false, error: "No se pudo eliminar el documento." };
  revalidatePath(`/admin/obras/${data.obra_id}`);
  revalidatePath("/admin/documentos");
  redirect(`/admin/obras/${data.obra_id}?tab=documentos`);
}

/** Contenido actual de la plantilla, para «Actualizar desde la plantilla». */
export async function contenidoPlantilla(clave: string) {
  if (!(await getStaff())) return null;
  return (await getPlantilla(clave)).contenido;
}

export async function guardarPlantilla(clave: string, contenido: unknown): Promise<Resultado> {
  const staff = await getStaff();
  if (!staff) return SIN_SESION;
  if (!tipoDocumento(clave)) return { ok: false, error: "Plantilla inválida." };
  const parsed = contenidoSchema.safeParse(contenido);
  if (!parsed.success) return { ok: false, error: "Contenido inválido." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("plantillas")
    .upsert({ clave, contenido: parsed.data as Json, updated_by: staff.id }, { onConflict: "clave" });
  if (error) return { ok: false, error: "No se pudo guardar la plantilla." };
  revalidatePath("/admin/plantillas", "layout");
  return { ok: true };
}

/** Vuelve a la plantilla base del sistema. */
export async function restaurarPlantilla(clave: string): Promise<Resultado> {
  if (!(await getStaff())) return SIN_SESION;
  const supabase = await createClient();
  const { error } = await supabase.from("plantillas").delete().eq("clave", clave);
  if (error) return { ok: false, error: "No se pudo restaurar." };
  revalidatePath("/admin/plantillas", "layout");
  return { ok: true };
}

const estudioSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre del estudio es obligatorio").max(200),
  email: z.string().trim().max(200),
  instagram: z.string().trim().max(100),
  web: z.string().trim().max(200),
  ciudad: z.string().trim().max(200),
  domicilio: z.string().trim().max(300),
  firmantes: z
    .array(
      z.object({
        titulo: z.string().trim().max(20),
        nombre: z.string().trim().min(1, "Cada firmante necesita un nombre").max(200),
        dni: z.string().trim().max(30),
        matricula: z.string().trim().max(100),
      })
    )
    .min(1, "Tiene que haber al menos un firmante")
    .max(10),
  telefonos: z.array(z.object({ numero: z.string().trim().min(1).max(50), nombre: z.string().trim().max(100) })).max(6),
});

/** Datos del estudio para los documentos (con DNI de los firmantes: van en la base, no en el código). */
export async function guardarEstudio(payload: unknown): Promise<Resultado> {
  const staff = await getStaff();
  if (!staff) return SIN_SESION;
  const parsed = estudioSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase
    .from("estudio_config")
    .upsert({ id: true, datos: parsed.data as unknown as Json, updated_by: staff.id });
  if (error) return { ok: false, error: "No se pudieron guardar los datos." };
  revalidatePath("/admin", "layout");
  return { ok: true };
}

const tramoSchema = z.object({ hasta: z.number().positive().nullable(), porcentaje: z.number().min(0).max(100) });
const honorariosSchema = z.object({
  categorias: z
    .array(
      z.object({
        clave: z.enum(["reforma", "vivienda", "otros"]),
        tramos: z.array(tramoSchema).min(1, "Cada tipo de obra necesita al menos un tramo").max(20),
        proyecto: z.number().min(0).max(100),
      })
    )
    .length(3),
  anteproyecto: z.number().min(0).max(100),
  municipal: z.number().min(0).max(100),
  ejecutivo: z.number().min(0).max(100),
  factorEjecutiva: z.number().min(0).max(10),
  iva: z.number().min(0).max(100),
});

/** Tabla de honorarios. null = volver a la de la planilla del estudio. */
export async function guardarHonorarios(payload: unknown): Promise<Resultado> {
  const staff = await getStaff();
  if (!staff) return SIN_SESION;
  let valor: Json | null = null;
  if (payload !== null) {
    const parsed = honorariosSchema.safeParse(payload);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
    const p = parsed.data;
    if (Math.round(p.anteproyecto + p.municipal + p.ejecutivo) !== 100) {
      return { ok: false, error: "Anteproyecto, municipal y ejecutivo tienen que sumar 100 %." };
    }
    if (p.categorias.some((c) => c.tramos.filter((t) => t.hasta === null).length > 1)) {
      return { ok: false, error: "Solo puede haber un tramo «sin límite» por tipo de obra." };
    }
    valor = p as unknown as Json;
  }
  const supabase = await createClient();
  const { error } = await supabase.from("estudio_config").update({ honorarios: valor, updated_by: staff.id }).eq("id", true);
  if (error) return { ok: false, error: "No se pudo guardar." };
  revalidatePath("/admin", "layout");
  return { ok: true };
}
