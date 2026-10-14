"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { enviarARevision, guardarChecklist } from "@/app/admin/(panel)/tareas/actions";
import { CHECKLIST_ENTREGA, ITEMS_CHECKLIST, REGLA_DE_ORO } from "@/lib/tareas/checklist";
import type { TareaDetalle } from "@/lib/tareas/queries";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTareas } from "./tareas-context";

/** Autoverificación del dibujante y envío a revisión (pregunta 18 del PDF). */
export function ChecklistEntrega({
  tarea,
  open,
  onOpenChange,
  onEnviada,
}: {
  tarea: TareaDetalle;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEnviada: () => void;
}) {
  const { staff, yo } = useTareas();
  const [checks, setChecks] = useState<Record<string, boolean>>(
    (tarea.checklist as Record<string, boolean> | null) ?? {}
  );
  const [horas, setHoras] = useState(tarea.horas_reales ? String(tarea.horas_reales).replace(".", ",") : "");
  const [evidencia, setEvidencia] = useState(tarea.evidencia ?? "");
  const [comentario, setComentario] = useState(tarea.comentario_cierre ?? "");
  const responsable = tarea.responsable_id ?? yo;
  const revisores = staff.filter((s) => s.id !== responsable && s.id !== yo);
  const [revisor, setRevisor] = useState(
    tarea.revisor_id && revisores.some((r) => r.id === tarea.revisor_id) ? tarea.revisor_id : ""
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const hechos = ITEMS_CHECKLIST.filter((i) => checks[i.id]).length;
  const completo = hechos === ITEMS_CHECKLIST.length;

  const guardarAvance = () =>
    startTransition(async () => {
      const res = await guardarChecklist(tarea.id, checks);
      if (!res.ok) return setError(res.error);
      toast.success("Avance del checklist guardado");
      onOpenChange(false);
    });

  const enviar = () => {
    setError(null);
    const horasNum = Number(horas.trim().replace(",", "."));
    startTransition(async () => {
      const res = await enviarARevision(tarea.id, {
        checklist: checks,
        horas_reales: horas.trim() ? horasNum : undefined,
        evidencia,
        comentario_cierre: comentario,
        revisor_id: revisor || undefined,
      });
      if (!res.ok) return setError(res.error);
      toast.success("Entrega enviada a revisión");
      onOpenChange(false);
      onEnviada();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90svh] flex-col gap-0 p-0 sm:max-w-2xl">
        <DialogHeader className="border-b p-6 pb-4">
          <DialogTitle>Checklist de entrega</DialogTitle>
          <DialogDescription>{REGLA_DE_ORO}</DialogDescription>
          <div className="flex items-center gap-3 pt-2">
            <Progress value={(hechos / ITEMS_CHECKLIST.length) * 100} className="flex-1" />
            <span className="text-xs text-muted-foreground">
              {hechos}/{ITEMS_CHECKLIST.length}
            </span>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-6 overflow-y-auto p-6">
          {CHECKLIST_ENTREGA.map((seccion) => (
            <fieldset key={seccion.titulo} className="flex flex-col gap-3">
              <legend className="mb-2 text-sm font-medium">{seccion.titulo}</legend>
              {seccion.items.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <Checkbox
                    id={`check-${item.id}`}
                    checked={checks[item.id] === true}
                    onCheckedChange={(v) => setChecks((c) => ({ ...c, [item.id]: v === true }))}
                    className="mt-0.5"
                  />
                  <Label htmlFor={`check-${item.id}`} className="text-sm leading-snug font-normal">
                    {item.texto}
                  </Label>
                </div>
              ))}
            </fieldset>
          ))}

          <fieldset className="flex flex-col gap-4 border-t pt-6">
            <legend className="mb-2 text-sm font-medium">Registro de la entrega</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="evidencia">Link o archivo final *</Label>
                <Input
                  id="evidencia"
                  value={evidencia}
                  onChange={(e) => setEvidencia(e.target.value)}
                  placeholder="https://… o nombre del archivo en la obra"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="horas">Horas reales *</Label>
                <Input id="horas" inputMode="decimal" value={horas} onChange={(e) => setHoras(e.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="comentario-cierre">Qué se hizo, qué quedó pendiente y dudas abiertas *</Label>
              <Textarea
                id="comentario-cierre"
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="revisor">Quién revisa *</Label>
              <Select value={revisor} onValueChange={setRevisor}>
                <SelectTrigger id="revisor" className="w-full sm:w-64">
                  <SelectValue placeholder="Elegí a otra persona" />
                </SelectTrigger>
                <SelectContent>
                  {revisores.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </fieldset>
        </div>

        <DialogFooter className="flex-col gap-3 border-t p-6 pt-4 sm:flex-col">
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={guardarAvance} disabled={pending}>
              Guardar avance
            </Button>
            <Button onClick={enviar} disabled={pending || !completo}>
              {pending ? "Enviando…" : "Enviar a revisión"}
            </Button>
          </div>
          {!completo && (
            <p className="text-right text-xs text-muted-foreground">
              Para enviar, tienen que estar tildados todos los puntos.
            </p>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
