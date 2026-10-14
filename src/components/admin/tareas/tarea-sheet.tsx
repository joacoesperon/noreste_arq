"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, ClipboardCheck, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  aprobarEntrega,
  cambiarEstado,
  cargarTarea,
  comentarTarea,
  devolverEntrega,
  eliminarTarea,
  actualizarTarea,
} from "@/app/admin/(panel)/tareas/actions";
import { checklistProgreso } from "@/lib/tareas/checklist";
import type { TareaDetalle } from "@/lib/tareas/queries";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ChecklistEntrega } from "./checklist-entrega";
import { EstadoTareaBadge } from "./estado-tarea-badge";
import { TareaForm } from "./tarea-form";
import { useTareas } from "./tareas-context";

const fechaHora = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Argentina/Buenos_Aires",
});

const EVENTOS: Record<string, string> = {
  creada: "creó la tarea",
  estado: "cambió el estado",
  enviada_revision: "envió la entrega a revisión",
  aprobada: "aprobó la entrega",
  devuelta: "devolvió la entrega para corregir",
  comentario: "comentó",
};

export function TareaSheet({ tareaId, onClose }: { tareaId: string | null; onClose: () => void }) {
  const { yo, nombre } = useTareas();
  const [tarea, setTarea] = useState<TareaDetalle | null>(null);
  const [cargando, setCargando] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [comentario, setComentario] = useState("");
  const [motivo, setMotivo] = useState("");
  const [devolviendo, setDevolviendo] = useState(false);

  const recargar = useCallback(async (id: string) => {
    const t = await cargarTarea(id);
    setTarea(t);
    return t;
  }, []);

  useEffect(() => {
    if (!tareaId) return;
    let vigente = true;
    setCargando(true);
    setError(null);
    setDevolviendo(false);
    setComentario("");
    cargarTarea(tareaId).then((t) => {
      if (!vigente) return;
      setTarea(t);
      setCargando(false);
    });
    return () => {
      vigente = false;
    };
  }, [tareaId]);

  const accion = (fn: () => Promise<{ ok: boolean; error?: string }>, exito?: string, cerrar = false) => {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) {
        setError(res.error ?? "Error");
        return;
      }
      if (exito) toast.success(exito);
      if (cerrar) onClose();
      else if (tarea) await recargar(tarea.id);
    });
  };

  const esResponsable = tarea ? (tarea.responsable_id ?? tarea.created_by) === yo : false;
  const progreso = tarea ? checklistProgreso(tarea.checklist) : null;

  return (
    <Sheet open={tareaId !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-lg">
        {cargando || !tarea ? (
          <div className="flex flex-col gap-3 p-6">
            <SheetHeader className="p-0">
              <SheetTitle>{cargando ? "Cargando…" : "Tarea no encontrada"}</SheetTitle>
            </SheetHeader>
            {cargando && (
              <>
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-24 w-full" />
              </>
            )}
          </div>
        ) : (
          <>
            <SheetHeader className="gap-2 border-b">
              <div className="flex flex-wrap items-center gap-2">
                <EstadoTareaBadge estado={tarea.estado} />
                {tarea.tipo === "entrega" && (
                  <Badge variant="outline">
                    <ClipboardCheck />
                    Entrega de documentación
                  </Badge>
                )}
              </div>
              <SheetTitle className="text-lg">{tarea.titulo}</SheetTitle>
              <SheetDescription>
                {tarea.obra ? (
                  <Link href={`/admin/obras/${tarea.obra.id}?tab=tareas`} className="hover:underline" onClick={onClose}>
                    {tarea.obra.titulo}
                  </Link>
                ) : (
                  "General del estudio"
                )}
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-6 p-4">
              {/* Estado y cierre */}
              <section className="flex flex-col gap-3">
                {tarea.tipo === "general" && (
                  <div className="flex flex-wrap gap-2">
                    {(["pendiente", "en_curso", "completada"] as const).map((e) => (
                      <Button
                        key={e}
                        size="sm"
                        variant={tarea.estado === e ? "default" : "outline"}
                        disabled={pending || tarea.estado === e}
                        onClick={() => accion(() => cambiarEstado(tarea.id, e), e === "completada" ? "Tarea completada" : undefined)}
                      >
                        {e === "pendiente" ? "Pendiente" : e === "en_curso" ? "En curso" : "Completada"}
                      </Button>
                    ))}
                  </div>
                )}

                {tarea.tipo === "entrega" && (tarea.estado === "pendiente" || tarea.estado === "en_curso") && (
                  <div className="flex flex-col gap-3 rounded-lg border p-3">
                    <div className="flex flex-wrap gap-2">
                      {(["pendiente", "en_curso"] as const).map((e) => (
                        <Button
                          key={e}
                          size="sm"
                          variant={tarea.estado === e ? "default" : "outline"}
                          disabled={pending || tarea.estado === e}
                          onClick={() => accion(() => cambiarEstado(tarea.id, e))}
                        >
                          {e === "pendiente" ? "Pendiente" : "En curso"}
                        </Button>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Checklist {progreso?.hechos}/{progreso?.total}. Para cerrar la entrega completá el checklist y
                      enviala a revisión.
                    </p>
                    <Button size="sm" className="self-start" onClick={() => setChecklistOpen(true)}>
                      <ClipboardCheck />
                      Checklist y envío a revisión
                    </Button>
                  </div>
                )}

                {tarea.tipo === "entrega" && tarea.estado === "en_revision" && (
                  <div className="flex flex-col gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/40">
                    <p className="text-sm">
                      En revisión por <span className="font-medium">{nombre(tarea.revisor_id) ?? "—"}</span>
                    </p>
                    <DatosCierre tarea={tarea} />
                    {esResponsable ? (
                      <p className="text-xs text-muted-foreground">La aprueba otra persona del estudio.</p>
                    ) : devolviendo ? (
                      <div className="flex flex-col gap-2">
                        <Textarea
                          value={motivo}
                          onChange={(e) => setMotivo(e.target.value)}
                          placeholder="Qué hay que corregir"
                          rows={3}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => setDevolviendo(false)}>
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={pending}
                            onClick={() =>
                              accion(async () => {
                                const r = await devolverEntrega(tarea.id, motivo);
                                if (r.ok) {
                                  setMotivo("");
                                  setDevolviendo(false);
                                }
                                return r;
                              }, "Entrega devuelta")
                            }
                          >
                            Devolver
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          disabled={pending}
                          onClick={() => accion(() => aprobarEntrega(tarea.id), "Entrega aprobada")}
                        >
                          <CheckCircle2 />
                          Aprobar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setDevolviendo(true)}>
                          <RotateCcw />
                          Devolver para corregir
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {tarea.estado === "completada" && (
                  <div className="flex flex-col gap-3 rounded-lg border border-emerald-300 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-950/40">
                    <p className="text-sm">
                      {tarea.tipo === "entrega" ? "Aprobada" : "Completada"} por{" "}
                      <span className="font-medium">
                        {nombre(tarea.tipo === "entrega" ? tarea.aprobada_por : tarea.completada_por) ?? "—"}
                      </span>
                      {tarea.completada_at && <> · {fechaHora.format(new Date(tarea.completada_at))}</>}
                    </p>
                    {tarea.tipo === "entrega" && <DatosCierre tarea={tarea} />}
                    {tarea.tipo === "entrega" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="self-start"
                        disabled={pending}
                        onClick={() => accion(() => cambiarEstado(tarea.id, "en_curso"), "Entrega reabierta")}
                      >
                        <RotateCcw />
                        Reabrir
                      </Button>
                    )}
                  </div>
                )}

                {error && (
                  <p role="alert" className="text-sm text-destructive">
                    {error}
                  </p>
                )}
              </section>

              <Separator />

              {/* Datos */}
              <section className="flex flex-col gap-3">
                <h3 className="text-sm font-medium">Datos</h3>
                <TareaForm
                  key={tarea.updated_at}
                  inicial={{
                    titulo: tarea.titulo,
                    descripcion: tarea.descripcion ?? "",
                    obra_id: tarea.obra_id,
                    tipo: tarea.tipo as "general" | "entrega",
                    responsable_id: tarea.responsable_id,
                    fecha: tarea.fecha,
                  }}
                  submitLabel="Guardar cambios"
                  pending={pending}
                  error={null}
                  tipoBloqueado={tarea.estado === "en_revision" || tarea.estado === "completada"}
                  onSubmit={(datos) => accion(() => actualizarTarea(tarea.id, datos), "Tarea actualizada")}
                />
              </section>

              <Separator />

              {/* Historial */}
              <section className="flex flex-col gap-3">
                <h3 className="text-sm font-medium">Historial</h3>
                <div className="flex gap-2">
                  <Textarea
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    placeholder="Agregar un comentario"
                    rows={2}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="self-end"
                    disabled={pending || !comentario.trim()}
                    onClick={() =>
                      accion(async () => {
                        const r = await comentarTarea(tarea.id, comentario);
                        if (r.ok) setComentario("");
                        return r;
                      })
                    }
                  >
                    Comentar
                  </Button>
                </div>
                <ol className="flex flex-col gap-3">
                  {tarea.eventos.map((ev) => (
                    <li key={ev.id} className="flex flex-col gap-0.5 text-sm">
                      <span>
                        <span className="font-medium">{nombre(ev.actor_id) ?? "Alguien"}</span>{" "}
                        <span className="text-muted-foreground">{EVENTOS[ev.tipo] ?? ev.tipo}</span>
                        <span className="text-xs text-muted-foreground"> · {fechaHora.format(new Date(ev.created_at))}</span>
                      </span>
                      {ev.detalle && <span className="whitespace-pre-line text-muted-foreground">{ev.detalle}</span>}
                    </li>
                  ))}
                </ol>
              </section>

              <Separator />

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="self-start text-destructive hover:text-destructive">
                    <Trash2 />
                    Eliminar tarea
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar la tarea?</AlertDialogTitle>
                    <AlertDialogDescription>Se borra con su historial. No se puede deshacer.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={() => accion(() => eliminarTarea(tarea.id), "Tarea eliminada", true)}
                    >
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {tarea.tipo === "entrega" && checklistOpen && (
              <ChecklistEntrega
                tarea={tarea}
                open={checklistOpen}
                onOpenChange={setChecklistOpen}
                onEnviada={() => recargar(tarea.id)}
              />
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function DatosCierre({ tarea }: { tarea: TareaDetalle }) {
  const esLink = tarea.evidencia?.startsWith("http");
  return (
    <dl className="grid gap-2 text-sm">
      <div>
        <dt className="text-xs text-muted-foreground">Entrega</dt>
        <dd className="break-all">
          {esLink ? (
            <a href={tarea.evidencia!} target="_blank" rel="noreferrer" className="underline">
              {tarea.evidencia}
            </a>
          ) : (
            (tarea.evidencia ?? "—")
          )}
        </dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Horas reales</dt>
        <dd>{tarea.horas_reales?.toLocaleString("es-AR") ?? "—"}</dd>
      </div>
      {tarea.comentario_cierre && (
        <div>
          <dt className="text-xs text-muted-foreground">Comentario</dt>
          <dd className="whitespace-pre-line">{tarea.comentario_cierre}</dd>
        </div>
      )}
    </dl>
  );
}
