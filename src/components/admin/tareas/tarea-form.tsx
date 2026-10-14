"use client";

import { useState } from "react";
import { TIPOS_TAREA } from "@/lib/tareas/constants";
import type { TareaInput } from "@/lib/tareas/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTareas } from "./tareas-context";

const NINGUNA = "__ninguna";

export function TareaForm({
  inicial,
  submitLabel,
  pending,
  error,
  onSubmit,
  tipoBloqueado,
}: {
  inicial: TareaInput;
  submitLabel: string;
  pending: boolean;
  error: string | null;
  onSubmit: (datos: TareaInput) => void;
  tipoBloqueado?: boolean;
}) {
  const { staff, obras } = useTareas();
  const [datos, setDatos] = useState<TareaInput>(inicial);
  const set = <K extends keyof TareaInput>(k: K, v: TareaInput[K]) => setDatos((d) => ({ ...d, [k]: v }));

  // La obra actual de la tarea puede estar terminada (fuera de la lista de opciones).
  const opcionesObra =
    datos.obra_id && !obras.some((o) => o.id === datos.obra_id) ? [{ id: datos.obra_id, titulo: "Obra actual" }, ...obras] : obras;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(datos);
      }}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="tarea-titulo">Qué hay que hacer *</Label>
        <Input id="tarea-titulo" value={datos.titulo} onChange={(e) => set("titulo", e.target.value)} required autoFocus />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="tarea-obra">Obra</Label>
          <Select value={datos.obra_id ?? NINGUNA} onValueChange={(v) => set("obra_id", v === NINGUNA ? null : v)}>
            <SelectTrigger id="tarea-obra" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NINGUNA}>General del estudio</SelectItem>
              {opcionesObra.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.titulo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="tarea-tipo">Tipo</Label>
          <Select value={datos.tipo} onValueChange={(v) => set("tipo", v as TareaInput["tipo"])} disabled={tipoBloqueado}>
            <SelectTrigger id="tarea-tipo" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_TAREA.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="tarea-responsable">Quién</Label>
          <Select
            value={datos.responsable_id ?? NINGUNA}
            onValueChange={(v) => set("responsable_id", v === NINGUNA ? null : v)}
          >
            <SelectTrigger id="tarea-responsable" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NINGUNA}>Sin asignar</SelectItem>
              {staff.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="tarea-fecha">Para cuándo</Label>
          <Input
            id="tarea-fecha"
            type="date"
            value={datos.fecha ?? ""}
            onChange={(e) => set("fecha", e.target.value || null)}
          />
        </div>
      </div>
      {datos.tipo === "entrega" && (
        <p className="rounded-md bg-muted/60 p-3 text-xs text-muted-foreground">
          Las entregas de documentación se cierran con el checklist y la aprobación de otra persona.
        </p>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="tarea-descripcion">Consigna / detalle</Label>
        <Textarea
          id="tarea-descripcion"
          value={datos.descripcion ?? ""}
          onChange={(e) => set("descripcion", e.target.value)}
          rows={3}
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="self-end">
        {pending ? "Guardando…" : submitLabel}
      </Button>
    </form>
  );
}
