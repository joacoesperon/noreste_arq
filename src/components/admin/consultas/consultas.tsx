"use client";

import { useState, useTransition } from "react";
import { Inbox, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { eliminarConsulta, marcarConsulta } from "@/app/admin/(panel)/consultas/actions";
import type { ConsultaWeb } from "@/lib/consultas/queries";
import { A_DEFINIR, PREGUNTAS } from "@/lib/consultas/preguntas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const fechaFormat = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Argentina/Buenos_Aires",
});

function ConsultaCard({ consulta }: { consulta: ConsultaWeb }) {
  const [pending, startTransition] = useTransition();

  return (
    <Card className={consulta.atendida ? "opacity-60" : undefined}>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          {consulta.nombre ?? "Sin nombre"}
          {!consulta.atendida && <Badge>Nueva</Badge>}
        </CardTitle>
        <CardDescription>{fechaFormat.format(new Date(consulta.created_at))}</CardDescription>
        <CardAction className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id={`atendida-${consulta.id}`}
              checked={consulta.atendida}
              disabled={pending}
              onCheckedChange={(v) =>
                startTransition(async () => {
                  const res = await marcarConsulta(consulta.id, v === true);
                  if (!res.ok) toast.error(res.error);
                })
              }
            />
            <Label htmlFor={`atendida-${consulta.id}`} className="font-normal">
              Atendida
            </Label>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-destructive hover:text-destructive"
            aria-label="Eliminar consulta"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await eliminarConsulta(consulta.id);
                if (!res.ok) toast.error(res.error);
              })
            }
          >
            <Trash2 />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          {PREGUNTAS.map((p) => (
            <div key={p.campo} className="flex flex-col">
              <dt className="text-xs text-muted-foreground">{p.rotulo}</dt>
              <dd>{consulta[p.campo] ?? <span className="text-muted-foreground">{A_DEFINIR}</span>}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

export function Consultas({ consultas }: { consultas: ConsultaWeb[] }) {
  const [verAtendidas, setVerAtendidas] = useState(false);
  const visibles = verAtendidas ? consultas : consultas.filter((c) => !c.atendida);
  const atendidas = consultas.length - consultas.filter((c) => !c.atendida).length;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6 md:p-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Consultas</h1>
          <p className="text-sm text-muted-foreground">
            Lo que respondió cada visitante en «Cotizá tu proyecto» de la web. La charla sigue por WhatsApp con Josefina.
          </p>
        </div>
        {atendidas > 0 && (
          <div className="flex items-center gap-2">
            <Checkbox id="ver-atendidas" checked={verAtendidas} onCheckedChange={(v) => setVerAtendidas(v === true)} />
            <Label htmlFor="ver-atendidas" className="font-normal">
              Ver atendidas ({atendidas})
            </Label>
          </div>
        )}
      </div>

      {visibles.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-16 text-center">
          <Inbox className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {consultas.length === 0 ? "Todavía no llegó ninguna consulta desde la web." : "No hay consultas sin atender."}
          </p>
        </Card>
      ) : (
        visibles.map((c) => <ConsultaCard key={c.id} consulta={c} />)
      )}
    </div>
  );
}
