"use client";

import { useState, useTransition } from "react";
import { ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { eliminarIndiceCac, guardarIndiceCac } from "@/app/admin/(panel)/presupuestador/actions";
import { parseNumero } from "@/lib/documentos/formato";
import type { IndiceCac } from "@/lib/presupuestador/queries";
import { hoyAR } from "@/lib/tareas/semanas";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const mesFormat = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric", timeZone: "UTC" });
export const nombreMes = (mes: string) => mesFormat.format(new Date(`${mes.slice(0, 7)}-01T00:00:00Z`));

export function IndicesCac({ indices }: { indices: IndiceCac[] }) {
  const [mes, setMes] = useState(hoyAR().slice(0, 7));
  const [valor, setValor] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Índice del costo de la construcción de la Cámara Argentina de la Construcción. Se carga cada mes cuando se publica,
        y sirve para actualizar los presupuestos desde su mes base.{" "}
        <a href="https://www.camarco.org.ar/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline">
          Ver publicación de la CAC
          <ExternalLink className="size-3" />
        </a>
      </p>
      <Card className="flex-row flex-wrap items-end gap-3 p-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="cac-mes">Mes</Label>
          <Input id="cac-mes" type="month" value={mes} onChange={(e) => setMes(e.target.value)} className="w-44" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="cac-valor">Valor del índice</Label>
          <Input id="cac-valor" value={valor} onChange={(e) => setValor(e.target.value)} inputMode="decimal" placeholder="Ej.: 15.432,1" className="w-44" />
        </div>
        <Button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await guardarIndiceCac({ mes, valor: parseNumero(valor) ?? undefined });
              if (!res.ok) return void toast.error(res.error);
              toast.success("Índice guardado");
              setValor("");
            })
          }
        >
          Guardar
        </Button>
      </Card>
      {indices.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Todavía no se cargó ningún mes.</p>
      ) : (
        <Card className="py-0">
          <ul className="divide-y">
            {indices.map((i, k) => {
              const anterior = indices[k + 1];
              const variacion = anterior ? (i.valor / anterior.valor - 1) * 100 : null;
              return (
                <li key={i.mes} className="flex items-center justify-between gap-2 p-3 text-sm">
                  <span className="capitalize">{nombreMes(i.mes)}</span>
                  <span className="flex items-center gap-3">
                    <span className="tabular-nums">{i.valor.toLocaleString("es-AR")}</span>
                    {variacion !== null && (
                      <span className="w-16 text-right text-xs text-muted-foreground tabular-nums">
                        {variacion >= 0 ? "+" : ""}
                        {variacion.toLocaleString("es-AR", { maximumFractionDigits: 1 })}%
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Eliminar mes"
                      onClick={() =>
                        startTransition(async () => {
                          const res = await eliminarIndiceCac(i.mes);
                          if (!res.ok) toast.error(res.error);
                        })
                      }
                    >
                      <Trash2 />
                    </Button>
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
