import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getEstudio } from "@/lib/documentos/queries";
import { listProveedores } from "@/lib/presupuestador/queries";
import { Proveedores } from "@/components/admin/presupuestador/proveedores";

export const metadata: Metadata = { title: "Proveedores" };

export default async function ProveedoresPage() {
  const supabase = await createClient();
  const [proveedores, estudio, { data: listas }] = await Promise.all([
    listProveedores(),
    getEstudio(),
    supabase.from("listas_precios").select("proveedor_id, fecha"),
  ]);
  // Fecha de la última lista importada de cada proveedor
  const ultimaLista: Record<string, string> = {};
  for (const l of listas ?? []) if (!ultimaLista[l.proveedor_id] || l.fecha > ultimaLista[l.proveedor_id]) ultimaLista[l.proveedor_id] = l.fecha;

  return <Proveedores proveedores={proveedores} ultimaLista={ultimaLista} estudio={estudio.nombre} />;
}
