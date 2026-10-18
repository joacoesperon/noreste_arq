"use client";

import { useState, useTransition } from "react";
import { Copy, Link2, Share2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { crearLinkObra, revocarLinkObra } from "../portal-actions";

export type LinkObra = { id: string; token: string; expires_at: string | null };

const venceFormat = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "America/Argentina/Buenos_Aires",
});

const linkDe = (token: string) => `${window.location.origin}/cliente/${token}`;

async function copiar(texto: string) {
  await navigator.clipboard.writeText(texto);
  toast.success("Link copiado");
}

/** Link del portal del cliente: resumen, cronograma, pagos previstos, modelo 3D y planos (solo lectura). */
export function CompartirObra({ obraId, links }: { obraId: string; links: LinkObra[] }) {
  const [dias, setDias] = useState("0");
  const [nuevo, setNuevo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog onOpenChange={() => setNuevo(null)}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Share2 />
          Compartir con el cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Compartir la obra con el cliente</DialogTitle>
          <DialogDescription>
            Quien tenga el link ve el resumen de la obra, el cronograma con su avance, los pagos previstos de las
            próximas 8 semanas, el modelo 3D y los planos (Archivos → Modelos 3D y Planos). No puede modificar nada ni
            ver el resto del panel. Si revocás el link, deja de funcionar en el momento.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Select value={dias} onValueChange={setDias}>
            <SelectTrigger className="w-full sm:w-40" aria-label="Vigencia">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Sin vencimiento</SelectItem>
              <SelectItem value="7">Vence en 7 días</SelectItem>
              <SelectItem value="30">Vence en 30 días</SelectItem>
              <SelectItem value="90">Vence en 90 días</SelectItem>
              <SelectItem value="365">Vence en 1 año</SelectItem>
            </SelectContent>
          </Select>
          <Button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await crearLinkObra(obraId, Number(dias));
                if ("error" in res) return void toast.error(res.error);
                const url = linkDe(res.token);
                setNuevo(url);
                await copiar(url).catch(() => undefined);
              })
            }
          >
            <Link2 />
            Crear link
          </Button>
        </div>

        {nuevo && (
          <div className="flex gap-2">
            <Input value={nuevo} readOnly onFocus={(e) => e.target.select()} aria-label="Link creado" />
            <Button variant="outline" size="icon" onClick={() => copiar(nuevo)} aria-label="Copiar link">
              <Copy />
            </Button>
          </div>
        )}

        {links.length > 0 && (
          <div className="flex flex-col gap-2 border-t pt-4">
            <p className="text-sm font-medium">Links activos</p>
            <ul className="flex flex-col divide-y text-sm">
              {links.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-2 py-2">
                  <span className="text-muted-foreground">
                    {l.expires_at ? `vence el ${venceFormat.format(new Date(l.expires_at))}` : "sin vencimiento"}
                  </span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => copiar(linkDe(l.token))} aria-label="Copiar link">
                      <Copy />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          const res = await revocarLinkObra(l.id);
                          if (!res.ok) toast.error(res.error);
                          else toast.success("Link revocado");
                        })
                      }
                      aria-label="Revocar link"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
