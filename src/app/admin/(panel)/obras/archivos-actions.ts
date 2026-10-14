"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { BUCKET_ARCHIVOS, CATEGORIAS_ARCHIVO } from "@/lib/archivos/constants";

type Resultado = { ok: true } | { ok: false; error: string };

const registroSchema = z.object({
  obra_id: z.uuid(),
  categoria: z.enum(CATEGORIAS_ARCHIVO),
  nombre: z.string().trim().min(1).max(300),
  storage_path: z.string().min(1).max(500),
  tamano: z.number().int().nonnegative().nullable(),
  mime: z.string().max(200).nullable(),
});

/** Registra en la base un archivo ya subido a Storage desde el navegador. */
export async function registrarArchivo(payload: unknown): Promise<Resultado> {
  const staff = await getStaff();
  if (!staff) return { ok: false, error: "Tu sesión venció." };
  const parsed = registroSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: "Datos del archivo inválidos." };
  // La ruta tiene que estar dentro de la carpeta de la obra.
  if (!parsed.data.storage_path.startsWith(`${parsed.data.obra_id}/`)) {
    return { ok: false, error: "Ruta inválida." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("archivos").insert({ ...parsed.data, subido_por: staff.id });
  if (error) {
    console.error("registrarArchivo", error);
    await supabase.storage.from(BUCKET_ARCHIVOS).remove([parsed.data.storage_path]);
    return { ok: false, error: "No se pudo registrar el archivo." };
  }
  revalidatePath(`/admin/obras/${parsed.data.obra_id}`);
  return { ok: true };
}

/** Link firmado de corta duración para descargar o ver un archivo. */
export async function urlArchivo(id: string): Promise<{ url: string } | { error: string }> {
  if (!(await getStaff())) return { error: "Tu sesión venció." };
  const supabase = await createClient();
  const { data: archivo } = await supabase.from("archivos").select("storage_path").eq("id", id).single();
  if (!archivo) return { error: "El archivo no existe." };

  const { data, error } = await supabase.storage.from(BUCKET_ARCHIVOS).createSignedUrl(archivo.storage_path, 60);
  if (error || !data) return { error: "No se pudo generar el link." };
  return { url: data.signedUrl };
}

export async function eliminarArchivo(id: string): Promise<Resultado> {
  if (!(await getStaff())) return { ok: false, error: "Tu sesión venció." };
  const supabase = await createClient();
  const { data: archivo } = await supabase.from("archivos").select("obra_id, storage_path").eq("id", id).single();
  if (!archivo) return { ok: false, error: "El archivo no existe." };

  const { error: storageError } = await supabase.storage.from(BUCKET_ARCHIVOS).remove([archivo.storage_path]);
  if (storageError) return { ok: false, error: "No se pudo borrar el archivo." };
  await supabase.from("archivos").delete().eq("id", id);

  revalidatePath(`/admin/obras/${archivo.obra_id}`);
  return { ok: true };
}

/** Días de vigencia; 0 = sin vencimiento. */
const DIAS_LINK = [0, 7, 30, 90] as const;

/** Crea un link público al visor 3D de un modelo IFC. */
export async function crearLinkVisor(
  archivoId: string,
  dias: number
): Promise<{ token: string } | { error: string }> {
  const staff = await getStaff();
  if (!staff) return { error: "Tu sesión venció." };
  if (!(DIAS_LINK as readonly number[]).includes(dias)) return { error: "Duración inválida." };

  const supabase = await createClient();
  const { data: archivo } = await supabase.from("archivos").select("obra_id").eq("id", archivoId).single();
  if (!archivo) return { error: "El archivo no existe." };

  const { data, error } = await supabase
    .from("visor_links")
    .insert({
      archivo_id: archivoId,
      expires_at: dias > 0 ? new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString() : null,
      created_by: staff.id,
    })
    .select("token")
    .single();
  if (error) return { error: "No se pudo crear el link." };

  revalidatePath(`/admin/obras/${archivo.obra_id}/visor/${archivoId}`);
  return { token: data.token };
}

export async function revocarLinkVisor(id: string): Promise<Resultado> {
  if (!(await getStaff())) return { ok: false, error: "Tu sesión venció." };
  const supabase = await createClient();
  const { error } = await supabase.from("visor_links").delete().eq("id", id);
  if (error) return { ok: false, error: "No se pudo revocar el link." };
  revalidatePath("/admin/obras", "layout");
  return { ok: true };
}
