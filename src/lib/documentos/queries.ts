import "server-only";
import { configHonorarios, type ConfigHonorarios } from "@/lib/honorarios/calculo";
import type { JSONContent } from "@tiptap/core";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";
import { plantillaBase } from "./plantillas-base";
import { datosEstudio, type DatosEstudio } from "./estudio";

type Tables = Database["public"]["Tables"];
export type Documento = Tables["documentos"]["Row"];
export type VersionResumen = Pick<Tables["documento_versiones"]["Row"], "id" | "numero" | "nota" | "created_by" | "created_at">;

export async function listDocumentos(obraId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documentos")
    .select("id, tipo, titulo, version_actual, updated_at")
    .eq("obra_id", obraId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getDocumento(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documentos")
    .select("*, versiones:documento_versiones(id, numero, nota, created_by, created_at)")
    .eq("id", id)
    .order("numero", { referencedTable: "documento_versiones", ascending: false })
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Plantilla del estudio si la guardó; si no, la base del código. */
export async function getPlantilla(clave: string): Promise<{ contenido: JSONContent; personalizada: boolean; updated_at: string | null }> {
  const supabase = await createClient();
  const { data } = await supabase.from("plantillas").select("contenido, updated_at").eq("clave", clave).maybeSingle();
  if (data) return { contenido: data.contenido as JSONContent, personalizada: true, updated_at: data.updated_at };
  return { contenido: plantillaBase(clave), personalizada: false, updated_at: null };
}

export async function listPlantillasPersonalizadas() {
  const supabase = await createClient();
  const { data } = await supabase.from("plantillas").select("clave, updated_at, updated_by");
  return data ?? [];
}

/** Tabla de honorarios del estudio (con la de la planilla donde falte). */
export async function getHonorarios(): Promise<ConfigHonorarios> {
  const supabase = await createClient();
  const { data } = await supabase.from("estudio_config").select("honorarios").maybeSingle();
  return configHonorarios(data?.honorarios);
}

/** Datos del estudio guardados (con los valores por defecto donde falten). */
export async function getEstudio(): Promise<DatosEstudio> {
  const supabase = await createClient();
  const { data } = await supabase.from("estudio_config").select("datos").maybeSingle();
  return datosEstudio(data?.datos);
}
