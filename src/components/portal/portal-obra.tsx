"use client";

import { useState } from "react";
import { ArrowLeft, Box, CalendarRange, CheckCircle2, Circle, ExternalLink, FileText, Image as ImageIcon, Wallet } from "lucide-react";
import type { ArchivoPortal, EtapaPortal, PagoPortal, Portal } from "@/lib/portal/datos";
import { avanceCronograma, avanceEtapa, itemsDe } from "@/lib/cronogramas/avance";
import { formatFechaLarga, formatMonto, type Moneda } from "@/lib/documentos/formato";
import { estadoLabel } from "@/lib/obras/constants";
import { formatM2 } from "@/lib/obras/superficies";
import { lunesDe } from "@/lib/tareas/semanas";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gantt } from "@/components/admin/cronogramas/gantt";
import { VisorIfc } from "@/components/visor/visor-ifc";

const TITULOS = { proyecto: "Cronograma de proyecto", obra: "Cronograma de obra" } as const;

const diaFormat = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", timeZone: "UTC" });
const dia = (f: string) => diaFormat.format(new Date(`${f}T00:00:00Z`));

/** Total por moneda: «$ 120.000 + US$ 300». */
function total(pagos: PagoPortal[]) {
  const porMoneda = new Map<string, number>();
  for (const p of pagos) porMoneda.set(p.moneda, (porMoneda.get(p.moneda) ?? 0) + p.monto);
  return [...porMoneda].map(([m, v]) => formatMonto(v, m as Moneda)).join(" + ");
}

function Dato({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

// Resumen ---------------------------------------------------------------------------

function Resumen({ portal }: { portal: Portal }) {
  const { obra, cronogramas, pagos, hoy } = portal;
  const todas = [...(cronogramas.proyecto ?? []), ...(cronogramas.obra ?? [])];
  // El avance que importa es el de la obra; si todavía no hay, el del proyecto.
  const principal = cronogramas.obra?.length ? cronogramas.obra : (cronogramas.proyecto ?? []);
  const avance = avanceCronograma(principal);
  const enCurso = todas.filter((e) => e.inicio <= hoy && e.fin >= hoy);
  const proximas = todas
    .filter((e) => e.clave && e.fin >= hoy)
    .sort((a, b) => (a.fin < b.fin ? -1 : 1))
    .slice(0, 4);
  const estaSemana = pagos.filter((p) => lunesDe(p.fecha) === lunesDe(hoy));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>La obra</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Dato label="Estado">
              <Badge variant="secondary">{estadoLabel(obra.estado)}</Badge>
            </Dato>
            {obra.tipologia && <Dato label="Tipología">{obra.tipologia}</Dato>}
            {obra.localidad && <Dato label="Ubicación">{obra.localidad}</Dato>}
            {obra.m2 > 0 && <Dato label="Superficie">{formatM2(obra.m2)}</Dato>}
            {obra.cliente && <Dato label="Cliente">{obra.cliente}</Dato>}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Avance</CardTitle>
          <CardDescription>
            {avance === null ? "El estudio todavía no cargó el avance." : `${avance} % de lo previsto ya está hecho.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {avance !== null && <Progress value={avance} aria-label="Avance general" />}
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">En curso</p>
            {enCurso.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ninguna etapa en curso hoy.</p>
            ) : (
              enCurso.map((e) => {
                const a = avanceEtapa(e.detalle, e.completados);
                return (
                  <p key={e.id} className="text-sm">
                    {e.nombre} <span className="text-muted-foreground">· hasta el {dia(e.fin)}{a !== null && ` · ${a} %`}</span>
                  </p>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Próximas fechas clave</CardTitle>
        </CardHeader>
        <CardContent>
          {proximas.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay fechas clave por delante.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {proximas.map((e) => (
                <li key={e.id} className="flex justify-between gap-3">
                  <span>{e.nombre}</span>
                  <span className="shrink-0 text-muted-foreground">{formatFechaLarga(e.fin)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pagos de esta semana</CardTitle>
        </CardHeader>
        <CardContent>
          {estaSemana.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay pagos previstos esta semana.</p>
          ) : (
            <p className="text-2xl font-semibold tabular-nums">{total(estaSemana)}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Cronograma ------------------------------------------------------------------------

function EtapaItems({ etapa }: { etapa: EtapaPortal }) {
  const items = itemsDe(etapa.detalle);
  const a = avanceEtapa(etapa.detalle, etapa.completados);
  if (items.length === 0) return null;
  return (
    <details className="rounded-md border px-3 py-2">
      <summary className="flex cursor-pointer list-none items-center gap-3 text-sm">
        <span className="min-w-0 flex-1 truncate">{etapa.nombre}</span>
        <Progress value={a ?? 0} className="h-1.5 w-24 sm:w-40" aria-label={`Avance de ${etapa.nombre}`} />
        <span className="w-12 shrink-0 text-right text-xs text-muted-foreground tabular-nums">{a} %</span>
      </summary>
      <ul className="mt-3 flex flex-col gap-2 pb-1">
        {items.map((item, i) => {
          const hecho = etapa.completados.includes(item);
          return (
            <li key={`${i}-${item}`} className="flex items-start gap-2 text-sm">
              {hecho ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-label="Hecho" />
              ) : (
                <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-label="Pendiente" />
              )}
              <span className={hecho ? "text-muted-foreground" : undefined}>{item}</span>
            </li>
          );
        })}
      </ul>
    </details>
  );
}

function Cronogramas({ portal }: { portal: Portal }) {
  const tipos = (["proyecto", "obra"] as const).filter((t) => portal.cronogramas[t]?.length);
  if (tipos.length === 0) return <Vacio texto="El estudio todavía no cargó el cronograma." />;
  return (
    <div className="flex flex-col gap-4">
      {tipos.map((t) => {
        const etapas = portal.cronogramas[t]!;
        const avance = avanceCronograma(etapas);
        return (
          <Card key={t}>
            <CardHeader>
              <CardTitle>{TITULOS[t]}</CardTitle>
              {avance !== null && <CardDescription>{avance} % hecho</CardDescription>}
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Gantt etapas={etapas} hoy={portal.hoy} />
              <div className="flex flex-col gap-2">
                {etapas.map((e) => (
                  <EtapaItems key={e.id} etapa={e} />
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Pagos -----------------------------------------------------------------------------

function Pagos({ portal }: { portal: Portal }) {
  const semanas = new Map<string, PagoPortal[]>();
  for (const p of portal.pagos) semanas.set(lunesDe(p.fecha), [...(semanas.get(lunesDe(p.fecha)) ?? []), p]);
  if (semanas.size === 0) return <Vacio texto="No hay pagos previstos para las próximas semanas." />;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">Pagos previstos de las próximas semanas. Pueden ajustarse a medida que avanza la obra.</p>
      {[...semanas].map(([lunes, pagos]) => (
        <Card key={lunes}>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-baseline justify-between gap-2">
              <span>Semana del {dia(lunes)}</span>
              <span className="tabular-nums">{total(pagos)}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col divide-y text-sm">
              {pagos.map((p) => (
                <li key={p.id} className="flex items-baseline justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p>{p.rubro}</p>
                    <p className="text-xs text-muted-foreground">
                      {dia(p.fecha)}
                      {p.detalle && ` · ${p.detalle}`}
                    </p>
                  </div>
                  <span className="shrink-0 tabular-nums">{formatMonto(p.monto, p.moneda as Moneda)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Modelo y planos -------------------------------------------------------------------

function ModeloYPlanos({ portal }: { portal: Portal }) {
  const { modelos, planos } = portal;
  const [modeloId, setModeloId] = useState(modelos[0]?.id ?? "");
  const [plano, setPlano] = useState<ArchivoPortal | null>(null);
  const modelo = modelos.find((m) => m.id === modeloId) ?? modelos[0];

  if (!modelo && planos.length === 0) return <Vacio texto="El estudio todavía no compartió el modelo ni los planos." />;

  return (
    <div className="flex flex-col gap-3">
      {modelos.length > 1 && (
        <Select value={modelo?.id} onValueChange={setModeloId}>
          <SelectTrigger className="w-full sm:w-80" aria-label="Modelo">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {modelos.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <div className="flex flex-col gap-3 lg:h-[75svh] lg:flex-row">
        {modelo && (
          <div className="h-[60svh] min-w-0 flex-1 lg:h-full">
            <VisorIfc key={modelo.url} url={modelo.url} nombre={modelo.nombre} />
          </div>
        )}
        {planos.length > 0 && (
          <aside
            className={cn(
              "flex flex-col overflow-hidden rounded-lg border bg-background",
              !modelo ? "min-h-[70svh] flex-1" : plano ? "h-[75svh] lg:h-full lg:w-[55%]" : "lg:w-80"
            )}
          >
            {plano ? (
              <>
                <div className="flex items-center gap-1 border-b p-2">
                  <Button variant="ghost" size="sm" onClick={() => setPlano(null)}>
                    <ArrowLeft />
                    Planos
                  </Button>
                  <span className="min-w-0 flex-1 truncate text-sm">{plano.nombre}</span>
                  <Button variant="ghost" size="icon-sm" asChild>
                    <a href={plano.url} target="_blank" rel="noreferrer" aria-label="Abrir en otra pestaña">
                      <ExternalLink />
                    </a>
                  </Button>
                </div>
                {plano.tipo === "pdf" ? (
                  <iframe src={plano.url} title={plano.nombre} className="min-h-0 w-full flex-1" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element -- link firmado de Storage, sin optimizar
                  <img src={plano.url} alt={plano.nombre} className="min-h-0 w-full flex-1 object-contain" />
                )}
              </>
            ) : (
              <>
                <p className="border-b p-3 text-sm font-medium">Planos</p>
                <ul className="flex flex-col overflow-y-auto">
                  {planos.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => setPlano(p)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                      >
                        {p.tipo === "pdf" ? (
                          <FileText className="size-4 shrink-0 text-muted-foreground" />
                        ) : (
                          <ImageIcon className="size-4 shrink-0 text-muted-foreground" />
                        )}
                        <span className="truncate">{p.nombre}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}

function Vacio({ texto }: { texto: string }) {
  return <p className="rounded-lg border p-6 text-center text-sm text-muted-foreground">{texto}</p>;
}

/** Portal del cliente: todo de solo lectura. */
export function PortalObra({ portal }: { portal: Portal }) {
  return (
    <Tabs defaultValue="resumen">
      <TabsList className="max-w-full overflow-x-auto">
        <TabsTrigger value="resumen">Resumen</TabsTrigger>
        <TabsTrigger value="cronograma">
          <CalendarRange />
          Cronograma
        </TabsTrigger>
        <TabsTrigger value="pagos">
          <Wallet />
          Pagos
        </TabsTrigger>
        <TabsTrigger value="modelo">
          <Box />
          Modelo y planos
        </TabsTrigger>
      </TabsList>
      <TabsContent value="resumen" className="mt-4">
        <Resumen portal={portal} />
      </TabsContent>
      <TabsContent value="cronograma" className="mt-4">
        <Cronogramas portal={portal} />
      </TabsContent>
      <TabsContent value="pagos" className="mt-4">
        <Pagos portal={portal} />
      </TabsContent>
      <TabsContent value="modelo" className="mt-4">
        <ModeloYPlanos portal={portal} />
      </TabsContent>
    </Tabs>
  );
}
