import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { listMateriales, listPreciosVigentes, listProveedores } from "@/lib/presupuestador/queries";
import { Materiales } from "@/components/admin/presupuestador/materiales";

export const metadata: Metadata = { title: "Materiales" };

export default async function MaterialesPage() {
  const supabase = await createClient();
  const [materiales, precios, proveedores, { data: vinculos }] = await Promise.all([
    listMateriales(),
    listPreciosVigentes(),
    listProveedores(),
    supabase.from("material_productos_web").select("id, material_id, proveedor_id, nombre, url, ultimo_error"),
  ]);
  return <Materiales materiales={materiales} precios={precios} proveedores={proveedores} vinculos={vinculos ?? []} />;
}
