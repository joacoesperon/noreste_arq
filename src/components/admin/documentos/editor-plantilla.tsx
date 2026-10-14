"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import type { JSONContent } from "@tiptap/react";
import { ArrowLeft, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { guardarPlantilla, restaurarPlantilla } from "@/app/admin/(panel)/documentos/actions";
import { CONTEXTO_EJEMPLO, DATOS_EJEMPLO } from "@/lib/documentos/ejemplo";
import { resolverDocumento } from "@/lib/documentos/resolver";
import { tipoDocumento } from "@/lib/documentos/tipos";
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
import { EditorTexto } from "./editor-texto";
import { VistaDocumento } from "./vista-documento";

export function EditorPlantilla({
  clave,
  contenido: inicial,
  personalizada,
}: {
  clave: string;
  contenido: JSONContent;
  personalizada: boolean;
}) {
  const tipo = tipoDocumento(clave)!;
  const [contenido, setContenido] = useState(inicial);
  const [sucio, setSucio] = useState(false);
  const [pending, startTransition] = useTransition();

  const vista = useMemo(
    () => resolverDocumento({ titulo: tipo.nombre, tipo, contenido, datos: DATOS_EJEMPLO, contexto: CONTEXTO_EJEMPLO }),
    [tipo, contenido]
  );
  const datosDocumento = tipo.campos.filter((c) => c.tipo !== "items").map((c) => ({ key: `doc.${c.key}`, label: c.label }));

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/admin/plantillas" aria-label="Volver a plantillas">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="flex items-center gap-2 text-lg font-semibold">
            {tipo.nombre}
            {personalizada ? <Badge variant="secondary">del estudio</Badge> : <Badge variant="outline">provisoria</Badge>}
          </h1>
          <p className="text-xs text-muted-foreground">
            Los {"{{datos}}"} se reemplazan por los de cada obra. La vista previa usa una obra de ejemplo.
          </p>
        </div>
        {personalizada && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" disabled={pending}>
                <RotateCcw />
                Volver a la provisoria
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Descartar la plantilla del estudio?</AlertDialogTitle>
                <AlertDialogDescription>
                  Vuelve al texto provisorio del sistema. Los documentos ya creados no cambian.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    startTransition(async () => {
                      const res = await restaurarPlantilla(clave);
                      if (!res.ok) toast.error(res.error);
                      else toast.success("Plantilla restaurada");
                    })
                  }
                >
                  Restaurar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <Button
          size="sm"
          disabled={pending || !sucio}
          onClick={() =>
            startTransition(async () => {
              const res = await guardarPlantilla(clave, contenido);
              if (!res.ok) return void toast.error(res.error);
              setSucio(false);
              toast.success("Plantilla guardada");
            })
          }
        >
          <Save />
          Guardar plantilla
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <EditorTexto
          contenido={contenido}
          onChange={(c) => {
            setContenido(c);
            setSucio(true);
          }}
          datosDocumento={datosDocumento}
        />
        <div className="min-w-0 rounded-xl bg-muted/50 p-3 sm:p-6">
          <p className="mb-3 text-xs text-muted-foreground">Vista previa con una obra de ejemplo</p>
          <VistaDocumento documento={vista} membrete={CONTEXTO_EJEMPLO.membrete} />
        </div>
      </div>
    </div>
  );
}
