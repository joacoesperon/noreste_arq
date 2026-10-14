"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { FilePlus2, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { crearDocumento } from "@/app/admin/(panel)/documentos/actions";
import { TIPOS_DOCUMENTO, tipoDocumento } from "@/lib/documentos/tipos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Doc = { id: string; tipo: string; titulo: string; version_actual: number; updated_at: string };

const fecha = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Argentina/Buenos_Aires" });
const GRUPOS = ["Propuestas y presupuestos", "Contratos", "Cronogramas"] as const;

export function DocumentosObra({ obraId, documentos }: { obraId: string; documentos: Doc[] }) {
  const [creando, setCreando] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const crear = (clave: string) => {
    setCreando(clave);
    startTransition(async () => {
      const res = await crearDocumento(obraId, clave);
      // Si sale bien, la acción redirige al editor.
      if (res && !res.ok) {
        toast.error(res.error);
        setCreando(null);
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          La ficha de la obra se combina con una plantilla: se revisa, se retoca y se descarga en PDF o Word.
        </p>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm">
              <FilePlus2 />
              Nuevo documento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Nuevo documento</DialogTitle>
              <DialogDescription>Se arma con los datos de la obra y la plantilla de cada tipo.</DialogDescription>
            </DialogHeader>
            {GRUPOS.map((g) => (
              <div key={g} className="flex flex-col gap-1">
                <p className="text-xs font-medium text-muted-foreground">{g}</p>
                {TIPOS_DOCUMENTO.filter((t) => t.grupo === g).map((t) => (
                  <Button
                    key={t.clave}
                    variant="ghost"
                    className="justify-start"
                    disabled={creando !== null}
                    onClick={() => crear(t.clave)}
                  >
                    {creando === t.clave ? <Loader2 className="animate-spin" /> : <FileText />}
                    {t.nombre}
                  </Button>
                ))}
              </div>
            ))}
          </DialogContent>
        </Dialog>
      </div>

      {documentos.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Todavía no hay documentos en esta obra.</p>
      ) : (
        <Card className="py-0">
          <ul className="divide-y">
            {documentos.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/admin/obras/${obraId}/documentos/${d.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 p-3 hover:bg-muted/50"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{d.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {tipoDocumento(d.tipo)?.nombre ?? d.tipo} · actualizado {fecha.format(new Date(d.updated_at))}
                      </p>
                    </div>
                  </div>
                  <Badge variant={d.version_actual > 0 ? "secondary" : "outline"}>
                    {d.version_actual > 0 ? `v${d.version_actual}` : "borrador"}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
