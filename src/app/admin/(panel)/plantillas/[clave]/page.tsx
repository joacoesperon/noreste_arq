import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPlantilla } from "@/lib/documentos/queries";
import { tipoDocumento } from "@/lib/documentos/tipos";
import { EditorPlantilla } from "@/components/admin/documentos/editor-plantilla";

type Props = { params: Promise<{ clave: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { clave } = await params;
  return { title: `Plantilla · ${tipoDocumento(clave)?.nombre ?? clave}` };
}

export default async function PlantillaPage({ params }: Props) {
  const { clave } = await params;
  if (!tipoDocumento(clave)) notFound();
  const plantilla = await getPlantilla(clave);
  return <EditorPlantilla key={plantilla.updated_at ?? "base"} clave={clave} {...plantilla} />;
}
