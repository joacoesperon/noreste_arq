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
  const { data, error } = await supabase
    .from("documentos")
    .insert({
      obra_id: obraId,
      tipo: clave,
      titulo: `${tipo.nombre} · ${obra.titulo}`,
      contenido: plantilla.contenido as Json,
      datos: (tipo.inicial ?? {}) as Json,
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
