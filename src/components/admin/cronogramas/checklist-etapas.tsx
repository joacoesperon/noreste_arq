"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { marcarItemEtapa } from "@/app/admin/(panel)/obras/cronogramas-actions";
import { avanceEtapa, itemsDe } from "@/lib/cronogramas/avance";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import type { EtapaGantt } from "./gantt";

/**
 * Lo que incluye cada etapa, para tildar a medida que se termina. El % de la etapa sale de
 * los ítems tildados (todos valen lo mismo). El estado vive en el padre para que el Gantt
 * se actualice en el momento.
 */
export function ChecklistEtapas({
  etapas,
  completados,
  onChange,
}: {
  etapas: EtapaGantt[];
  completados: Record<string, string[]>;
  onChange: (etapaId: string, items: string[]) => void;
}) {
  const [, startTransition] = useTransition();
  const conItems = etapas.filter((e) => e.id && itemsDe(e.detalle).length > 0);
  if (conItems.length === 0) return null;

  const marcar = (etapaId: string, item: string, hecho: boolean) => {
    const antes = completados[etapaId] ?? [];
    onChange(etapaId, hecho ? [...antes.filter((i) => i !== item), item] : antes.filter((i) => i !== item));
    startTransition(async () => {
      const res = await marcarItemEtapa({ etapaId, item, hecho });
      if (!res.ok) {
        toast.error(res.error);
        onChange(etapaId, antes);
      }
    });
  };

  return (
    <div className="flex flex-col gap-2 border-t pt-4">
      <p className="text-sm font-medium">Avance por etapa</p>
      {conItems.map((e) => {
        const id = e.id!;
        const hechos = completados[id] ?? [];
        const items = itemsDe(e.detalle);
        const pct = avanceEtapa(e.detalle, hechos) ?? 0;
        return (
          <details key={id} className="group rounded-md border px-3 py-2">
            <summary className="flex cursor-pointer list-none items-center gap-3 text-sm">
              <span className="min-w-0 flex-1 truncate">{e.nombre}</span>
              <Progress value={pct} className="h-1.5 w-24 sm:w-40" aria-label={`Avance de ${e.nombre}`} />
              <span className="w-24 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                {items.filter((i) => hechos.includes(i)).length}/{items.length} · {pct} %
              </span>
            </summary>
            <ul className="mt-3 flex flex-col gap-2 pb-1">
              {items.map((item, i) => (
                <li key={`${i}-${item}`} className="flex items-start gap-2 text-sm">
                  <Checkbox
                    id={`item-${id}-${i}`}
                    checked={hechos.includes(item)}
                    onCheckedChange={(v) => marcar(id, item, v === true)}
                    className="mt-0.5"
                  />
                  <label htmlFor={`item-${id}-${i}`} className={hechos.includes(item) ? "text-muted-foreground line-through" : undefined}>
                    {item}
                  </label>
                </li>
              ))}
            </ul>
          </details>
        );
      })}
    </div>
  );
}
