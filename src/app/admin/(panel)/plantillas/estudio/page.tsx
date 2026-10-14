import type { Metadata } from "next";
import { getEstudio } from "@/lib/documentos/queries";
import { DatosEstudioForm } from "@/components/admin/documentos/datos-estudio";

export const metadata: Metadata = { title: "Datos del estudio" };

export default async function DatosEstudioPage() {
  return <DatosEstudioForm inicial={await getEstudio()} />;
}
