"use client";

import { ClipboardCheck } from "lucide-react";
import type { TareaResumen } from "@/lib/tareas/queries";
import { checklistProgreso } from "@/lib/tareas/checklist";
import { formatDia } from "@/lib/tareas/semanas";
import { cn } from "@/lib/utils";
import { EstadoTareaBadge } from "./estado-tarea-badge";
import { useTareas } from "./tareas-context";

export function TareaCard({
  tarea,
  hoy,
  mostrarObra = true,
}: {
  tarea: TareaResumen;
  hoy: string;
  mostrarObra?: boolean;
}) {
  const { abrir, nombre } = useTareas();
  const vencida = tarea.estado !== "completada" && tarea.fecha !== null && tarea.fecha < hoy;
  const progreso = tarea.tipo === "entrega" ? checklistProgreso(tarea.checklist) : null;

  return (
    <button
      type="button"
      onClick={() => abrir(tarea.id)}
      className={cn(
        "flex w-full flex-col gap-2 rounded-lg border bg-card p-3 text-left text-sm shadow-xs transition-colors hover:bg-muted/50",
        tarea.estado === "completada" && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={cn("font-medium", tarea.estado === "completada" && "line-through")}>{tarea.titulo}</span>
        {tarea.tipo === "entrega" && (
          <ClipboardCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-label="Entrega de documentación" />
        )}
      </div>
      {mostrarObra && (
        <span className="text-xs text-muted-foreground">{tarea.obra?.titulo ?? "General del estudio"}</span>
      )}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        <EstadoTareaBadge estado={tarea.estado} />
        {tarea.fecha && (
          <span className={cn("text-muted-foreground", vencida && "font-medium text-destructive")}>
            {vencida ? "venció " : ""}
            {formatDia(tarea.fecha)}
          </span>
        )}
        <span className="text-muted-foreground">{nombre(tarea.responsable_id) ?? "sin asignar"}</span>
        {progreso && tarea.estado !== "completada" && tarea.estado !== "en_revision" && (
          <span className="text-muted-foreground">
            checklist {progreso.hechos}/{progreso.total}
          </span>
        )}
      </div>
    </button>
  );
}
