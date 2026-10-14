"use client";

import type { TareaResumen } from "@/lib/tareas/queries";
import { NuevaTarea } from "@/components/admin/tareas/nueva-tarea";
import { TareaCard } from "@/components/admin/tareas/tarea-card";

export function TareasObra({ obraId, tareas, hoy }: { obraId: string; tareas: TareaResumen[]; hoy: string }) {
  const abiertas = tareas.filter((t) => t.estado !== "completada");
  const completadas = tareas.filter((t) => t.estado === "completada");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {abiertas.length} {abiertas.length === 1 ? "tarea abierta" : "tareas abiertas"}
        </p>
        <NuevaTarea obraId={obraId} />
      </div>
      {abiertas.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {abiertas.map((t) => (
            <TareaCard key={t.id} tarea={t} hoy={hoy} mostrarObra={false} />
          ))}
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-muted-foreground">No hay tareas abiertas en esta obra.</p>
      )}
      {completadas.length > 0 && (
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-muted-foreground">Completadas</h3>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {completadas.map((t) => (
              <TareaCard key={t.id} tarea={t} hoy={hoy} mostrarObra={false} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
