import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

type Tables = Database["public"]["Tables"];
export type Material = Tables["materiales"]["Row"];
export type Proveedor = Tables["proveedores"]["Row"];
export type Presupuesto = Tables["presupuestos"]["Row"];
export type PresupuestoItem = Tables["presupuesto_items"]["Row"];
export type PrecioVigente = Pick<
  Tables["precios"]["Row"],
  "id" | "material_id" | "proveedor_id" | "precio" | "moneda" | "fecha" | "fuente" | "referencia" | "descripcion_proveedor"
>;

export async function listMateriales(soloActivos = false): Promise<Material[]> {
  const supabase = await createClient();
  let q = supabase.from("materiales").select("*").order("rubro").order("nombre");
  if (soloActivos) q = q.eq("activo", true);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function listProveedores(): Promise<Proveedor[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("proveedores").select("*").order("nombre");
  if (error) throw error;
  return data;
}

/** Último precio de cada material en cada proveedor. */
export async function listPreciosVigentes(): Promise<PrecioVigente[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("precios_vigentes")
    .select("id, material_id, proveedor_id, precio, moneda, fecha, fuente, referencia, descripcion_proveedor");
  if (error) throw error;
  return data as PrecioVigente[];
}

export async function listListasPrecios() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listas_precios")
    .select("id, archivo, fecha, moneda, items, created_at, proveedor:proveedores(nombre)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data;
}

export async function listEquivalencias(proveedorId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("material_equivalencias")
    .select("texto, material_id")
    .eq("proveedor_id", proveedorId);
  if (error) throw error;
  return data;
}

export async function listPresupuestos(obraId?: string) {
  const supabase = await createClient();
  let q = supabase
    .from("presupuestos")
    .select("id, obra_id, titulo, moneda, updated_at, obra:obras(titulo), items:presupuesto_items(count)")
    .order("updated_at", { ascending: false });
  if (obraId) q = q.eq("obra_id", obraId);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function getPresupuesto(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("presupuestos")
    .select("*, items:presupuesto_items(*)")
    .eq("id", id)
    .order("orden", { referencedTable: "presupuesto_items" })
    .maybeSingle();
  if (error) throw error;
  return data;
}

export type IndiceCac = { mes: string; valor: number };

/** Índice CAC cargado, del mes más reciente al más viejo. */
export async function listIndicesCac(): Promise<IndiceCac[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("indices_cac").select("mes, valor").order("mes", { ascending: false });
  if (error) throw error;
  return data;
}
