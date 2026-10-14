import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { JSONContent } from "@tiptap/react";
import { getObra, listStaffOptions } from "@/lib/obras/queries";
import { getCronogramas } from "@/lib/cronogramas/queries";
import { contextoObra } from "@/lib/documentos/contexto";
import { getDocumento, getEstudio, getHonorarios } from "@/lib/documentos/queries";
import { tipoDocumento } from "@/lib/documentos/tipos";
import { EditorDocumento } from "@/components/admin/documentos/editor-documento";

type Props = { params: Promise<{ id: string; docId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { docId } = await params;
  const doc = await getDocumento(docId).catch(() => null);
  return { title: doc?.titulo ?? "Documento" };
}

export default async function DocumentoPage({ params }: Props) {
  const { id, docId } = await params;
  const [documento, obra, cronogramas, staff, estudio, honorarios] = await Promise.all([
    getDocumento(docId).catch(() => null),
    getObra(id).catch(() => null),
    getCronogramas(id).catch(() => ({})),
    listStaffOptions(),
    getEstudio(),
    getHonorarios(),
  ]);
  if (!documento || !obra || documento.obra_id !== obra.id || !tipoDocumento(documento.tipo)) notFound();

  const nombre = (sid: string | null) => staff.find((s) => s.id === sid)?.nombre ?? null;

  return (
    <EditorDocumento
      key={`${documento.id}-${documento.version_actual}`}
      documento={{
        id: documento.id,
        tipo: documento.tipo,
        titulo: documento.titulo,
        contenido: documento.contenido as JSONContent,
        datos: (documento.datos ?? {}) as Record<string, unknown>,
        version_actual: documento.version_actual,
      }}
      obra={{ id: obra.id, titulo: obra.titulo }}
      contexto={contextoObra(obra, cronogramas, estudio, honorarios)}
      versiones={documento.versiones.map((v) => ({ ...v, autor: nombre(v.created_by) }))}
    />
  );
}
