"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { toast } from "sonner";
import type { Cliente, ObraCompleta, StaffOption } from "@/lib/obras/queries";
import { PASOS, ULTIMO_PASO } from "@/lib/obras/asistente";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { finalizarCarga, guardarPaso } from "../actions";
import {
  PasoCliente,
  PasoEquipo,
  PasoGenerales,
  PasoServicios,
  PasoSuperficies,
  PasoUbicacion,
} from "./pasos";

/** A dónde ir después de guardar. */
export type Destino = "anterior" | "siguiente" | "salir";

export type PasoProps = {
  obra: ObraCompleta | null;
  pending: boolean;
  onGuardar: (payload: unknown, destino: Destino) => void;
  footer: (onGuardar: (destino: Destino) => void) => React.ReactNode;
};

type Props = {
  obra: ObraCompleta | null;
  paso: number;
  clientes: Cliente[];
  staff: StaffOption[];
  /** Resumen renderizado en el servidor para el último paso. */
  resumen?: React.ReactNode;
};

export function Asistente({ obra, paso, clientes, staff, resumen }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Una obra con la carga terminada se edita de a un paso y vuelve a la ficha.
  const edicion = obra !== null && !obra.borrador;
  const pasoMaximo = edicion ? ULTIMO_PASO - 1 : (obra?.asistente_paso ?? 1);
  const titulo = PASOS[paso - 1].titulo;

  const irA = (obraId: string, n: number) => router.push(`/admin/obras/${obraId}/editar?paso=${n}`);

  const onGuardar = (payload: unknown, destino: Destino) => {
    setError(null);
    startTransition(async () => {
      const res = await guardarPaso(obra?.id ?? null, paso, payload);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (edicion || destino === "salir") {
        toast.success("Cambios guardados");
        router.push(`/admin/obras/${res.obraId}`);
      } else {
        irA(res.obraId, destino === "anterior" ? paso - 1 : paso + 1);
      }
    });
  };

  const onFinalizar = () => {
    if (!obra) return;
    startTransition(async () => {
      const res = await finalizarCarga(obra.id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast.success("Obra cargada");
      router.push(`/admin/obras/${obra.id}`);
    });
  };

  const footer = (guardar: (destino: Destino) => void) => (
    <div className="flex flex-col gap-3">
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {edicion ? (
          <>
            <Button variant="ghost" asChild>
              <Link href={`/admin/obras/${obra!.id}`}>Cancelar</Link>
            </Button>
            <Button type="button" onClick={() => guardar("salir")} disabled={pending}>
              {pending ? "Guardando…" : "Guardar"}
            </Button>
          </>
        ) : (
          <>
            <Button type="button" variant="ghost" onClick={() => guardar("anterior")} disabled={pending || paso === 1}>
              Anterior
            </Button>
            <div className="flex gap-2">
              {obra && (
                <Button type="button" variant="outline" onClick={() => guardar("salir")} disabled={pending}>
                  Guardar y salir
                </Button>
              )}
              <Button type="button" onClick={() => guardar("siguiente")} disabled={pending}>
                {pending ? "Guardando…" : "Siguiente"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const props: PasoProps = { obra, pending, onGuardar, footer };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6 md:p-10">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">
          <Link href="/admin/obras" className="hover:text-foreground">
            Obras
          </Link>
          {obra && (
            <>
              {" / "}
              <Link href={`/admin/obras/${obra.id}`} className="hover:text-foreground">
                {obra.titulo}
              </Link>
            </>
          )}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {edicion ? `Editar ${titulo.toLowerCase()}` : obra ? "Carga de obra" : "Nueva obra"}
        </h1>
      </div>

      {!edicion && (
        <ol className="flex gap-1 overflow-x-auto pb-1">
          {PASOS.map((p) => {
            const habilitado = obra !== null && p.n <= pasoMaximo && p.n !== paso;
            const completo = p.n < pasoMaximo || (obra !== null && p.n < paso);
            return (
              <li key={p.n} className="shrink-0">
                <button
                  type="button"
                  disabled={!habilitado || pending}
                  onClick={() => obra && irA(obra.id, p.n)}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                    p.n === paso ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                    habilitado && "hover:bg-muted hover:text-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-5 items-center justify-center rounded-full border text-xs",
                      p.n === paso && "border-primary-foreground/40"
                    )}
                  >
                    {completo && p.n !== paso ? <Check className="size-3" /> : p.n}
                  </span>
                  <span className="hidden sm:inline">{p.titulo}</span>
                </button>
              </li>
            );
          })}
        </ol>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{titulo}</CardTitle>
          {!edicion && (
            <CardDescription>
              Paso {paso} de {ULTIMO_PASO}. Podés guardar y seguir después.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {paso === 1 && <PasoGenerales key="1" {...props} />}
          {paso === 2 && <PasoCliente key="2" {...props} clientes={clientes} />}
          {paso === 3 && <PasoUbicacion key="3" {...props} />}
          {paso === 4 && <PasoSuperficies key="4" {...props} />}
          {paso === 5 && <PasoServicios key="5" {...props} />}
          {paso === 6 && <PasoEquipo key="6" {...props} staff={staff} />}
          {paso === 7 && (
            <div className="flex flex-col gap-6">
              <p className="text-sm text-muted-foreground">
                Revisá los datos. Podés editar cualquier sección antes de finalizar.
              </p>
              {resumen}
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              <div className="flex justify-between gap-2">
                <Button variant="ghost" onClick={() => obra && irA(obra.id, 6)} disabled={pending}>
                  Anterior
                </Button>
                <Button onClick={onFinalizar} disabled={pending}>
                  <Check />
                  {pending ? "Guardando…" : "Finalizar carga"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
