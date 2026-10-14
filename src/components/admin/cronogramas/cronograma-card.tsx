"use client";

import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, CalendarRange, Diamond, Pencil, Plus, Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { eliminarCronograma, guardarCronograma } from "@/app/admin/(panel)/obras/cronogramas-actions";
import { diasEntre, finDe, semanasDe, sumarDias } from "@/lib/cronogramas/fechas";
import { generarCronograma, type DatosModelo, type TipoCronograma } from "@/lib/cronogramas/modelos";
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
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Gantt, type EtapaGantt } from "./gantt";

type Fila = { key: string; id?: string; nombre: string; inicio: string; semanas: string; clave: boolean; detalle: string };

let claveFila = 0;
const nuevaClave = () => `f${++claveFila}`;

const aFila = (e: EtapaGantt): Fila => ({
  key: e.id ?? nuevaClave(),
  id: e.id,
  nombre: e.nombre,
  inicio: e.inicio,
  semanas: String(semanasDe(e.inicio, e.fin)).replace(".", ","),
  clave: e.clave,
  detalle: e.detalle ?? "",
});

const numero = (v: string) => {
  const n = Number(v.trim().replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : NaN;
};

const diaFormat = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const fmt = (f: string) => diaFormat.format(new Date(`${f}T00:00:00Z`));

const TITULOS: Record<TipoCronograma, string> = { proyecto: "Cronograma de proyecto", obra: "Cronograma de obra" };

export function CronogramaCard({
  obraId,
  tipo,
  etapas,
  modelo,
  hoy,
}: {
  obraId: string;
  tipo: TipoCronograma;
  etapas: EtapaGantt[];
  /** Datos de la obra para generar el modelo inicial. */
  modelo: DatosModelo;
  hoy: string;
}) {
  const [editando, setEditando] = useState(false);
  const [filas, setFilas] = useState<Fila[]>([]);
  const [inicioGeneral, setInicioGeneral] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const existe = etapas.length > 0;
  const desde = existe ? etapas.reduce((m, e) => (e.inicio < m ? e.inicio : m), etapas[0].inicio) : null;
  const hasta = existe ? etapas.reduce((m, e) => (e.fin > m ? e.fin : m), etapas[0].fin) : null;

  const abrirEditor = (base: EtapaGantt[]) => {
    const f = base.map(aFila);
    setFilas(f);
    setInicioGeneral(f.reduce((m, x) => (x.inicio < m ? x.inicio : m), f[0]?.inicio ?? modelo.inicio));
    setError(null);
    setEditando(true);
  };

  const set = (key: string, campo: keyof Omit<Fila, "key" | "id">, valor: string | boolean) =>
    setFilas((prev) => prev.map((f) => (f.key === key ? { ...f, [campo]: valor } : f)));

  const mover = (i: number, dir: -1 | 1) =>
    setFilas((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const copia = [...prev];
      [copia[i], copia[j]] = [copia[j], copia[i]];
      return copia;
    });

  /** Corre todas las etapas manteniendo las distancias entre ellas. */
  const correrTodo = (nuevoInicio: string) => {
    if (!nuevoInicio || filas.length === 0) return;
    const actual = filas.reduce((m, f) => (f.inicio < m ? f.inicio : m), filas[0].inicio);
    const delta = diasEntre(actual, nuevoInicio);
    setFilas((prev) => prev.map((f) => ({ ...f, inicio: sumarDias(f.inicio, delta) })));
    setInicioGeneral(nuevoInicio);
  };

  const agregar = () => {
    const ultima = filas.at(-1);
    const inicio = ultima ? sumarDias(finDe(ultima.inicio, numero(ultima.semanas) || 0), 1) : modelo.inicio;
    setFilas((prev) => [...prev, { key: nuevaClave(), nombre: "", inicio, semanas: "2", clave: false, detalle: "" }]);
  };

  const guardar = () => {
    setError(null);
    const invalida = filas.find((f) => !f.inicio || Number.isNaN(numero(f.semanas)));
    if (invalida) return setError(`Revisá las fechas y semanas de «${invalida.nombre || "etapa sin nombre"}».`);
    const payload = filas.map((f) => ({
      id: f.id,
      nombre: f.nombre,
      inicio: f.inicio,
      fin: finDe(f.inicio, numero(f.semanas)),
      clave: f.clave,
      detalle: f.detalle,
    }));
    startTransition(async () => {
      const res = await guardarCronograma(obraId, tipo, payload);
      if (!res.ok) return setError(res.error);
      toast.success("Cronograma guardado");
      setEditando(false);
    });
  };

  const vista: EtapaGantt[] = editando
    ? filas
        .filter((f) => f.inicio && !Number.isNaN(numero(f.semanas)))
        .map((f) => ({ id: f.key, nombre: f.nombre || "—", inicio: f.inicio, fin: finDe(f.inicio, numero(f.semanas)), clave: f.clave }))
    : etapas;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{TITULOS[tipo]}</CardTitle>
        <CardDescription>
          {existe && desde && hasta
            ? `${fmt(desde)} → ${fmt(hasta)} · ${Math.round(diasEntre(desde, hasta) / 30.4)} meses`
            : "Todavía no hay cronograma."}
        </CardDescription>
        {!editando && (
          <CardAction className="flex gap-1">
            {existe ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => abrirEditor(etapas)}>
                  <Pencil />
                  Editar
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" aria-label="Eliminar cronograma">
                      <Trash2 />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar el {TITULOS[tipo].toLowerCase()}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        También se borran las tareas abiertas de sus fechas clave. No se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        onClick={() =>
                          startTransition(async () => {
                            const res = await eliminarCronograma(obraId, tipo);
                            if (!res.ok) toast.error(res.error);
                            else toast.success("Cronograma eliminado");
                          })
                        }
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            ) : (
              <Button size="sm" onClick={() => abrirEditor(generarCronograma(tipo, modelo))}>
                <Wand2 />
                Generar desde el modelo
              </Button>
            )}
          </CardAction>
        )}
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        {!existe && !editando && (
          <p className="text-sm text-muted-foreground">
            El modelo arma las etapas acordadas con duraciones según la tipología, los m² y los plazos de la obra. Después
            se ajustan a mano.
          </p>
        )}

        {vista.length > 0 && <Gantt etapas={vista} hoy={hoy} />}

        {editando && (
          <div className="flex flex-col gap-4 border-t pt-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor={`${tipo}-inicio`}>Correr todo para que empiece el</Label>
                <Input
                  id={`${tipo}-inicio`}
                  type="date"
                  value={inicioGeneral}
                  onChange={(e) => correrTodo(e.target.value)}
                  className="w-44"
                />
              </div>
              <p className="pb-2 text-xs text-muted-foreground">
                <Diamond className="mr-1 inline size-3 fill-amber-500 text-amber-500" />
                Fecha clave: aparece como tarea en el tablero. 0 semanas = hito.
              </p>
            </div>

            <div className="hidden grid-cols-[4rem_1fr_9.5rem_5.5rem_6.5rem_2rem] gap-2 text-xs text-muted-foreground md:grid">
              <span />
              <span>Etapa</span>
              <span>Inicio</span>
              <span>Semanas</span>
              <span>Fin</span>
              <span />
            </div>
            {filas.map((f, i) => {
              const sem = numero(f.semanas);
              const fin = f.inicio && !Number.isNaN(sem) ? finDe(f.inicio, sem) : null;
              return (
                <div
                  key={f.key}
                  className="grid grid-cols-[4rem_1fr_2rem] items-center gap-2 border-b pb-3 md:grid-cols-[4rem_1fr_9.5rem_5.5rem_6.5rem_2rem] md:border-0 md:pb-0"
                >
                  <div className="flex items-center gap-1">
                    <div className="flex flex-col">
                      <button type="button" onClick={() => mover(i, -1)} disabled={i === 0} aria-label="Subir" className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                        <ArrowUp className="size-3.5" />
                      </button>
                      <button type="button" onClick={() => mover(i, 1)} disabled={i === filas.length - 1} aria-label="Bajar" className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                        <ArrowDown className="size-3.5" />
                      </button>
                    </div>
                    <Checkbox
                      checked={f.clave}
                      onCheckedChange={(v) => set(f.key, "clave", v === true)}
                      aria-label="Fecha clave"
                      title="Fecha clave"
                    />
                  </div>
                  <Input value={f.nombre} onChange={(e) => set(f.key, "nombre", e.target.value)} placeholder="Etapa" aria-label="Etapa" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="md:order-last"
                    onClick={() => setFilas((prev) => prev.filter((x) => x.key !== f.key))}
                    aria-label="Quitar etapa"
                  >
                    <Trash2 />
                  </Button>
                  <div className="col-span-3 grid grid-cols-[1fr_5.5rem_6.5rem] items-center gap-2 md:col-span-1 md:contents">
                    <Input type="date" value={f.inicio} onChange={(e) => set(f.key, "inicio", e.target.value)} aria-label="Inicio" />
                    <Input inputMode="decimal" value={f.semanas} onChange={(e) => set(f.key, "semanas", e.target.value)} aria-label="Semanas" />
                    <span className="text-xs text-muted-foreground">{fin ? fmt(fin) : "—"}</span>
                  </div>
                  <details className="col-span-3 md:col-span-6 md:pl-[4.5rem]">
                    <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                      Qué incluye{f.detalle.trim() ? ` (${f.detalle.split("\n").filter((l) => l.trim()).length})` : ""}
                    </summary>
                    <Textarea
                      value={f.detalle}
                      onChange={(e) => set(f.key, "detalle", e.target.value)}
                      rows={4}
                      placeholder="Un ítem por línea. Sale en la propuesta (bloque «Etapas»)."
                      className="mt-1 text-sm"
                      aria-label="Qué incluye"
                    />
                  </details>
                </div>
              );
            })}
            <Button type="button" variant="outline" size="sm" className="self-start" onClick={agregar}>
              <Plus />
              Agregar etapa
            </Button>

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditando(false)} disabled={pending}>
                Cancelar
              </Button>
              <Button onClick={guardar} disabled={pending}>
                <CalendarRange />
                {pending ? "Guardando…" : "Guardar cronograma"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
