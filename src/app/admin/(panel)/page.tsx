import type { Metadata } from "next";
import Link from "next/link";
import { getStaff } from "@/lib/auth";
import { listStaffOptions } from "@/lib/obras/queries";
import { contarCompletadasDesde, listObrasOpciones, listTareasAbiertas, type TareaResumen } from "@/lib/tareas/queries";
import { columnaDe, formatDia, semanas, type Columna } from "@/lib/tareas/semanas";
import { estadoLabel } from "@/lib/obras/constants";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NuevaTarea } from "@/components/admin/tareas/nueva-tarea";
import { TareaCard } from "@/components/admin/tareas/tarea-card";
import { TareasProvider } from "@/components/admin/tareas/tareas-context";

export const metadata: Metadata = { title: "Tablero" };

type Props = { searchParams: Promise<{ ver?: string; tarea?: string }> };

const rangoFormat = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", timeZone: "UTC" });
const rango = (desde: string, hasta: string) =>
  `${rangoFormat.format(new Date(`${desde}T00:00:00Z`))} al ${rangoFormat.format(new Date(`${hasta}T00:00:00Z`))}`;

export default async function TableroPage({ searchParams }: Props) {
  const { ver, tarea } = await searchParams;
  const soloMias = ver !== "todas";

  const [staff, staffOptions, obras, abiertas] = await Promise.all([
    getStaff(),
    listStaffOptions(),
    listObrasOpciones(),
    listTareasAbiertas(),
  ]);
  const s = semanas();
  const completadas = await contarCompletadasDesde(s.actual.desde);
  const yo = staff!.id;

  const paraRevisar = abiertas.filter((t) => t.estado === "en_revision" && t.revisor_id === yo);
  const visibles = soloMias ? abiertas.filter((t) => t.responsable_id === yo) : abiertas;

  const columnas: Record<Columna, TareaResumen[]> = { actual: [], proxima: [], despues: [] };
  for (const t of visibles) columnas[columnaDe(t.fecha, s)].push(t);

  // Obras activas con su próxima fecha (la tarea abierta más cercana).
  const obrasActivas = obras
    .filter((o) => o.estado === "en_proyecto" || o.estado === "en_obra")
    .map((o) => {
      const tareas = abiertas.filter((t) => t.obra_id === o.id);
      const proxima = tareas.find((t) => t.fecha)?.fecha ?? null;
      return { ...o, abiertas: tareas.length, proxima };
    });

  const nombre = staff!.nombre.split(" ")[0];

  return (
    <TareasProvider yo={yo} staff={staffOptions} obras={obras} inicial={tarea && /^[0-9a-f-]{36}$/.test(tarea) ? tarea : null}>
      <div className="flex flex-col gap-8 p-6 md:p-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">Hola, {nombre}</h1>
            <p className="text-sm text-muted-foreground">
              Semana del {rango(s.actual.desde, s.actual.hasta)}
              {completadas > 0 && ` · ${completadas} ${completadas === 1 ? "tarea completada" : "tareas completadas"}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border p-0.5 text-sm">
              <Link
                href="/admin"
                className={cn("rounded-md px-3 py-1", soloMias ? "bg-muted font-medium" : "text-muted-foreground")}
              >
                Mis tareas
              </Link>
              <Link
                href="/admin?ver=todas"
                className={cn("rounded-md px-3 py-1", !soloMias ? "bg-muted font-medium" : "text-muted-foreground")}
              >
                Todo el estudio
              </Link>
            </div>
            <NuevaTarea />
          </div>
        </div>

        {paraRevisar.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="flex items-center gap-2 text-sm font-medium">
              Para revisar
              <Badge>{paraRevisar.length}</Badge>
            </h2>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {paraRevisar.map((t) => (
                <TareaCard key={t.id} tarea={t} hoy={s.hoy} />
              ))}
            </div>
          </section>
        )}

        <section className="grid gap-4 lg:grid-cols-3">
          <ColumnaTablero titulo="Esta semana" subtitulo={rango(s.actual.desde, s.actual.hasta)} tareas={columnas.actual} hoy={s.hoy} />
          <ColumnaTablero titulo="Próxima semana" subtitulo={rango(s.proxima.desde, s.proxima.hasta)} tareas={columnas.proxima} hoy={s.hoy} />
          <ColumnaTablero titulo="Más adelante" subtitulo="y sin fecha" tareas={columnas.despues} hoy={s.hoy} />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">Obras en curso</h2>
          {obrasActivas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay obras en proyecto ni en obra.{" "}
              <Link href="/admin/obras" className="underline">
                Ver obras
              </Link>
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {obrasActivas.map((o) => (
                <Link key={o.id} href={`/admin/obras/${o.id}?tab=tareas`} className="group">
                  <Card className="h-full gap-2 py-4 transition-colors group-hover:bg-muted/50">
                    <CardHeader className="px-4">
                      <CardTitle className="text-sm">{o.titulo}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap items-center gap-x-2 gap-y-1 px-4 text-xs text-muted-foreground">
                      <Badge variant="secondary">{estadoLabel(o.estado)}</Badge>
                      <span>
                        {o.abiertas} {o.abiertas === 1 ? "tarea abierta" : "tareas abiertas"}
                      </span>
                      {o.proxima && <span>· próxima: {formatDia(o.proxima)}</span>}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </TareasProvider>
  );
}

function ColumnaTablero({
  titulo,
  subtitulo,
  tareas,
  hoy,
}: {
  titulo: string;
  subtitulo: string;
  tareas: TareaResumen[];
  hoy: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-muted/40 p-3">
      <div className="flex items-baseline justify-between gap-2 px-1">
        <h2 className="text-sm font-medium">
          {titulo} <span className="text-muted-foreground">{tareas.length}</span>
        </h2>
        <span className="text-xs text-muted-foreground">{subtitulo}</span>
      </div>
      {tareas.length === 0 ? (
        <p className="px-1 py-6 text-center text-sm text-muted-foreground">Nada por acá.</p>
      ) : (
        tareas.map((t) => <TareaCard key={t.id} tarea={t} hoy={hoy} />)
      )}
    </div>
  );
}
