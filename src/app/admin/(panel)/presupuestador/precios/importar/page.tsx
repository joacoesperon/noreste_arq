import type { Metadata } from "next";
import { listMateriales, listProveedores } from "@/lib/presupuestador/queries";
import { ImportarLista } from "@/components/admin/presupuestador/importar-lista";

export const metadata: Metadata = { title: "Importar lista de precios" };
// Leer una lista larga con IA puede llevar un par de minutos.
export const maxDuration = 300;

export default async function ImportarListaPage() {
  const [proveedores, materiales] = await Promise.all([listProveedores(), listMateriales()]);
  return <ImportarLista proveedores={proveedores.filter((p) => p.activo)} materiales={materiales} />;
}
