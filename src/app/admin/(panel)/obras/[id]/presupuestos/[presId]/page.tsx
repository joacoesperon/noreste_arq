import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPresupuesto, listIndicesCac, listMateriales, listPreciosVigentes, listProveedores } from "@/lib/presupuestador/queries";
import { EditorPresupuesto } from "@/components/admin/presupuestador/editor-presupuesto";
import { getEstudio } from "@/lib/documentos/queries";
import { membreteDe } from "@/lib/documentos/estudio";

type Props = { params: Promise<{ id: string; presId: string }> };

export const metadata: Metadata = { title: "Presupuesto de materiales" };

export default async function PresupuestoPage({ params }: Props) {
  const { id, presId } = await params;
  const supabase = await createClient();
  const [presupuesto, { data: obra }, materiales, precios, proveedores, estudio, indicesCac] = await Promise.all([
    getPresupuesto(presId).catch(() => null),
    supabase.from("obras").select("id, titulo, direccion, localidad, provincia, lat, lng").eq("id", id).maybeSingle(),
    listMateriales(true),
    listPreciosVigentes(),
    listProveedores(),
    getEstudio(),
    listIndicesCac(),
  ]);
  if (!presupuesto || !obra || presupuesto.obra_id !== obra.id) notFound();

  const { items, ...datos } = presupuesto;
  return (
    <EditorPresupuesto
      key={presupuesto.updated_at}
      presupuesto={datos}
      items={items}
      obra={{
        id: obra.id,
        titulo: obra.titulo,
        ubicacion: [obra.direccion, obra.localidad, obra.provincia].filter(Boolean).join(", "),
        lat: obra.lat,
        lng: obra.lng,
      }}
      materiales={materiales}
      precios={precios}
      proveedores={proveedores.filter((p) => p.activo)}
      membrete={membreteDe(estudio)}
      indicesCac={indicesCac}
    />
  );
}
