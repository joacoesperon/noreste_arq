import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

type Tables = Database["public"]["Tables"];
export type Obra = Tables["obras"]["Row"];
export type Cliente = Tables["clientes"]["Row"];
export type Sector = Tables["obra_sectores"]["Row"];
export type Colaborador = Tables["obra_colaboradores"]["Row"];
export type Especialidad = Tables["obra_especialidades"]["Row"];

export type ObraCompleta = Obra & {
  cliente: Cliente | null;
  sectores: Sector[];
  colaboradores: Colaborador[];
  especialidades: Especialidad[];
};

export type ObraListado = Pick<
  Obra,
  | "id"
  | "titulo"
  | "tipologia"
  | "estado"
  | "localidad"
  | "borrador"
  | "asistente_paso"
  | "sup_cubierta"
  | "sup_semicubierta"
  | "sup_descubierta"
  | "updated_at"
> & {
  cliente: Pick<Cliente, "nombre"> | null;
  sectores: Pick<Sector, "sup_cubierta" | "sup_semicubierta" | "sup_descubierta">[];
};

export async function listObras(): Promise<ObraListado[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("obras")
    .select(
      "id, titulo, tipologia, estado, localidad, borrador, asistente_paso, sup_cubierta, sup_semicubierta, sup_descubierta, updated_at, cliente:clientes(nombre), sectores:obra_sectores(sup_cubierta, sup_semicubierta, sup_descubierta)"
    )
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getObra(id: string): Promise<ObraCompleta | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("obras")
    .select(
      "*, cliente:clientes(*), sectores:obra_sectores(*), colaboradores:obra_colaboradores(*), especialidades:obra_especialidades(*)"
    )
    .eq("id", id)
    .order("orden", { referencedTable: "obra_sectores" })
    .order("orden", { referencedTable: "obra_colaboradores" })
    .order("orden", { referencedTable: "obra_especialidades" })
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function listClientes(): Promise<Cliente[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("clientes").select("*").order("nombre");
  if (error) throw error;
  return data;
}

export type StaffOption = { id: string; nombre: string };

export async function listStaffOptions(): Promise<StaffOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("staff")
    .select("id, nombre")
    .eq("activo", true)
    .order("nombre");
  if (error) throw error;
  return data;
}
