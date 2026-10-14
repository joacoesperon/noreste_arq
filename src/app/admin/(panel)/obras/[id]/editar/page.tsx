import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getObra, listClientes, listStaffOptions } from "@/lib/obras/queries";
import { pasoValido, ULTIMO_PASO } from "@/lib/obras/asistente";
import { Asistente } from "../../_components/asistente";
import { ObraResumen } from "../../_components/obra-resumen";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paso?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const obra = await getObra(id).catch(() => null);
  return { title: obra ? `Editar · ${obra.titulo}` : "Obra" };
}

export default async function EditarObraPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { paso: pasoParam } = await searchParams;

  const [obra, clientes, staff] = await Promise.all([
    getObra(id).catch(() => null),
    listClientes(),
    listStaffOptions(),
  ]);
  if (!obra) notFound();

  let paso = pasoValido(pasoParam);
  // El resumen es solo parte de la carga inicial.
  if (paso === ULTIMO_PASO && !obra.borrador) paso = 1;

  return (
    <Asistente
      obra={obra}
      paso={paso}
      clientes={clientes}
      staff={staff}
      resumen={paso === ULTIMO_PASO ? <ObraResumen obra={obra} staff={staff} /> : undefined}
    />
  );
}
