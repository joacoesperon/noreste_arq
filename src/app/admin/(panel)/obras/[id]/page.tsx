import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getStaff } from "@/lib/auth";
import { listArchivosObra } from "@/lib/archivos/queries";
import { proximoLunes, sumarDias } from "@/lib/cronogramas/fechas";
import { getCronogramas, type Cronograma } from "@/lib/cronogramas/queries";
import { listDocumentos } from "@/lib/documentos/queries";
import { listGastosObra } from "@/lib/gastos/queries";
import { createClient } from "@/lib/supabase/server";
import { listPresupuestos } from "@/lib/presupuestador/queries";
import type { TipoCronograma } from "@/lib/cronogramas/modelos";
import { proyectoDeTerceros } from "@/lib/obras/constants";
import { getObra, listStaffOptions } from "@/lib/obras/queries";
import { listObrasOpciones, listTareasObra } from "@/lib/tareas/queries";
import { hoyAR } from "@/lib/tareas/semanas";
import { PASOS } from "@/lib/obras/asistente";
import { formatM2, totalesSuperficie } from "@/lib/obras/superficies";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CronogramaCard } from "@/components/admin/cronogramas/cronograma-card";
import { DocumentosObra } from "@/components/admin/documentos/documentos-obra";
import { GastosObra } from "@/components/admin/gastos/gastos-obra";
import { PresupuestosObra } from "@/components/admin/presupuestador/presupuestos-obra";
import { TareasProvider } from "@/components/admin/tareas/tareas-context";
import { ArchivosObra } from "../_components/archivos-obra";
import { CompartirObra } from "../_components/compartir-obra";
import { EstadoBadge } from "../_components/estado-badge";
import { EliminarObra } from "../_components/eliminar-obra";
import { ObraResumen } from "../_components/obra-resumen";
import { TareasObra } from "../_components/tareas-obra";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> };

const TABS = ["datos", "documentos", "presupuestos", "gastos", "tareas", "cronogramas", "archivos"];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const obra = await getObra(id).catch(() => null);
  return { title: obra?.titulo ?? "Obra" };
}

export default async function ObraPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { tab } = await searchParams;
  const supabase = await createClient();
  const [obra, staff, yo, tareas, archivos, obrasOpciones, cronogramas, documentos, presupuestos, gastos, { data: links }] = await Promise.all([
    getObra(id).catch(() => null),
    listStaffOptions(),
    getStaff(),
    listTareasObra(id).catch(() => []),
    listArchivosObra(id).catch(() => []),
    listObrasOpciones(),
    getCronogramas(id).catch((): Partial<Record<TipoCronograma, Cronograma>> => ({})),
    listDocumentos(id).catch(() => []),
    listPresupuestos(id).catch(() => []),
    listGastosObra(id).catch(() => ({ gastos: [], gremios: [] })),
    supabase.from("obra_links").select("id, token, expires_at").eq("obra_id", id).order("created_at"),
  ]);
  if (!obra) notFound();

  const total = totalesSuperficie(obra, obra.sectores).total;
  const abiertas = tareas.filter((t) => t.estado !== "completada").length;
  const hoy = hoyAR();
  // Datos para el modelo de cronograma. La obra arranca después del proyecto si no tiene fecha propia.
  const finProyecto = cronogramas.proyecto?.etapas.reduce<string | null>((m, e) => (!m || e.fin > m ? e.fin : m), null);
  const modeloProyecto = {
    inicio: obra.proyecto_inicio ?? proximoLunes(hoy),
    m2: total,
    tipologia: obra.tipologia,
    duracionMeses: obra.proyecto_duracion_meses,
  };
  const modeloObra = {
    inicio: obra.obra_inicio ?? (finProyecto ? proximoLunes(sumarDias(finProyecto, 1)) : proximoLunes(hoy)),
    m2: total,
    tipologia: obra.tipologia,
    duracionMeses: obra.obra_duracion_meses,
  };
  const subtitulo = [obra.tipologia, total > 0 ? formatM2(total) : null, obra.localidad].filter(Boolean);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6 md:p-10">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">
          <Link href="/admin/obras" className="hover:text-foreground">
            Obras
          </Link>
          {" / "}
          {obra.titulo}
        </p>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">{obra.titulo}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {subtitulo.length > 0 && <span>{subtitulo.join(" · ")}</span>}
              <EstadoBadge estado={obra.estado} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CompartirObra obraId={obra.id} links={links ?? []} />
            <EliminarObra obraId={obra.id} titulo={obra.titulo} />
          </div>
        </div>
      </div>

      {obra.borrador && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed p-4">
          <div>
            <p className="text-sm font-medium">La carga de esta obra no está terminada</p>
            <p className="text-sm text-muted-foreground">
              Quedó en el paso {obra.asistente_paso}: {PASOS[obra.asistente_paso - 1]?.titulo.toLowerCase()}.
            </p>
          </div>
          <Button asChild size="sm">
            <Link href={`/admin/obras/${obra.id}/editar?paso=${obra.asistente_paso}`}>
              Continuar carga
              <ArrowRight />
            </Link>
          </Button>
        </div>
      )}

      <TareasProvider yo={yo!.id} staff={staff} obras={obrasOpciones}>
        <Tabs defaultValue={tab && TABS.includes(tab) ? tab : "datos"}>
          <TabsList className="max-w-full overflow-x-auto">
            <TabsTrigger value="datos">Datos</TabsTrigger>
            <TabsTrigger value="documentos">Documentos{documentos.length > 0 && ` · ${documentos.length}`}</TabsTrigger>
            <TabsTrigger value="presupuestos">Presupuestos{presupuestos.length > 0 && ` · ${presupuestos.length}`}</TabsTrigger>
            <TabsTrigger value="gastos">Gastos{gastos.gastos.length > 0 && ` · ${gastos.gastos.length}`}</TabsTrigger>
            <TabsTrigger value="tareas">Tareas{abiertas > 0 && ` · ${abiertas}`}</TabsTrigger>
            <TabsTrigger value="cronogramas">Cronogramas</TabsTrigger>
            <TabsTrigger value="archivos">Archivos{archivos.length > 0 && ` · ${archivos.length}`}</TabsTrigger>
          </TabsList>
          <TabsContent value="datos" className="mt-4">
            <ObraResumen obra={obra} staff={staff} />
          </TabsContent>
          <TabsContent value="documentos" className="mt-4">
            <DocumentosObra obraId={obra.id} documentos={documentos} />
          </TabsContent>
          <TabsContent value="presupuestos" className="mt-4">
            <PresupuestosObra obraId={obra.id} presupuestos={presupuestos} />
          </TabsContent>
          <TabsContent value="gastos" className="mt-4">
            <GastosObra obraId={obra.id} titulo={obra.titulo} gastos={gastos.gastos} gremios={gastos.gremios} />
          </TabsContent>
          <TabsContent value="tareas" className="mt-4">
            <TareasObra obraId={obra.id} tareas={tareas} hoy={hoy} />
          </TabsContent>
          <TabsContent value="cronogramas" className="mt-4 flex flex-col gap-4">
            {(!proyectoDeTerceros(obra.servicios) || cronogramas.proyecto) && (
              <CronogramaCard
                key={`proyecto-${cronogramas.proyecto?.updated_at ?? "nuevo"}`}
                obraId={obra.id}
                tipo="proyecto"
                etapas={cronogramas.proyecto?.etapas ?? []}
                modelo={modeloProyecto}
                hoy={hoy}
              />
            )}
            <CronogramaCard
              key={`obra-${cronogramas.obra?.updated_at ?? "nuevo"}`}
              obraId={obra.id}
              tipo="obra"
              etapas={cronogramas.obra?.etapas ?? []}
              modelo={modeloObra}
              hoy={hoy}
            />
          </TabsContent>
          <TabsContent value="archivos" className="mt-4">
            <ArchivosObra obraId={obra.id} archivos={archivos} staff={staff} />
          </TabsContent>
        </Tabs>
      </TareasProvider>
    </div>
  );
}
