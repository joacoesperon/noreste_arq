"use client";

import { useState, useTransition } from "react";
import { MapPin, MapPinOff, MessageCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { eliminarProveedor, guardarProveedor } from "@/app/admin/(panel)/presupuestador/actions";
import type { Proveedor } from "@/lib/presupuestador/queries";
import { distanciaKm } from "@/lib/presupuestador/geo";
import { linkWhatsapp, mensajePedidoLista } from "@/lib/presupuestador/whatsapp";
import { formatFechaCorta } from "@/lib/documentos/formato";
import { hoyAR } from "@/lib/tareas/semanas";
import { diasEntre } from "@/lib/cronogramas/fechas";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Referencia de la pregunta 14: radio de 25 km desde la Ciudad de Buenos Aires.
const CABA = { lat: -34.6037, lng: -58.3816 };

const CAMPOS = [
  ["nombre", "Nombre *"],
  ["contacto", "Contacto"],
  ["telefono", "Teléfono / WhatsApp"],
  ["email", "Correo"],
  ["web", "Sitio web"],
  ["direccion", "Dirección"],
  ["localidad", "Localidad"],
] as const;

type Form = Record<(typeof CAMPOS)[number][0] | "notas" | "web_dominio", string> & { activo: boolean; recordatorio: boolean };

function ProveedorDialog({ proveedor, onClose }: { proveedor: Proveedor | null; onClose: () => void }) {
  const [form, setForm] = useState<Form>({
    nombre: proveedor?.nombre ?? "",
    contacto: proveedor?.contacto ?? "",
    telefono: proveedor?.telefono ?? "",
    email: proveedor?.email ?? "",
    web: proveedor?.web ?? "",
    direccion: proveedor?.direccion ?? "",
    localidad: proveedor?.localidad ?? "",
    notas: proveedor?.notas ?? "",
    activo: proveedor?.activo ?? true,
    recordatorio: proveedor?.recordatorio ?? true,
    web_dominio: proveedor?.web_dominio ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{proveedor ? "Editar" : "Nuevo"} proveedor</DialogTitle>
          <DialogDescription>Con la dirección se ubica en el mapa para filtrar por distancia a cada obra.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              const res = await guardarProveedor(proveedor?.id ?? null, form);
              if (!res.ok) return setError(res.error);
              if (form.direccion || form.localidad) {
                if (res.ubicado) toast.success("Proveedor guardado y ubicado en el mapa");
                else toast.warning("Proveedor guardado, pero no se encontró la dirección en el mapa");
              } else toast.success("Proveedor guardado");
              onClose();
            });
          }}
        >
          {CAMPOS.map(([k, label]) => (
            <div key={k} className={`flex flex-col gap-2 ${k === "nombre" || k === "direccion" ? "sm:col-span-2" : ""}`}>
              <Label htmlFor={`prov-${k}`}>{label}</Label>
              <Input
                id={`prov-${k}`}
                value={form[k]}
                onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                required={k === "nombre"}
                autoFocus={k === "nombre"}
              />
            </div>
          ))}
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="prov-tienda">Tienda online para leer precios (opcional)</Label>
            <Input
              id="prov-tienda"
              value={form.web_dominio}
              onChange={(e) => setForm((f) => ({ ...f, web_dominio: e.target.value }))}
              placeholder="www.easy.com.ar"
            />
            <p className="text-xs text-muted-foreground">
              Funciona con tiendas que publican su catálogo (como Easy o Prestigio). Después, en cada material, «Buscar en la web».
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="prov-notas">Notas</Label>
            <Textarea id="prov-notas" value={form.notas} onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))} rows={2} />
          </div>
          <div className="flex items-center gap-2 sm:col-span-2">
            <Checkbox id="prov-activo" checked={form.activo} onCheckedChange={(v) => setForm((f) => ({ ...f, activo: v === true }))} />
            <Label htmlFor="prov-activo" className="font-normal">
              Activo
            </Label>
          </div>
          <div className="flex items-center gap-2 sm:col-span-2">
            <Checkbox id="prov-recordatorio" checked={form.recordatorio} onCheckedChange={(v) => setForm((f) => ({ ...f, recordatorio: v === true }))} />
            <Label htmlFor="prov-recordatorio" className="font-normal">
              Pedirle la lista de precios todos los meses (por correo, y aviso para WhatsApp)
            </Label>
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive sm:col-span-2">
              {error}
            </p>
          )}
          <DialogFooter className="sm:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function Proveedores({
  proveedores,
  ultimaLista,
  estudio,
}: {
  proveedores: Proveedor[];
  /** Fecha de la última lista importada por proveedor */
  ultimaLista: Record<string, string>;
  estudio: string;
}) {
  const hoy = hoyAR();
  const [editando, setEditando] = useState<Proveedor | null | "nuevo">(null);
  const [aBorrar, setABorrar] = useState<Proveedor | null>(null);
  const [, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">Corralones, ferreterías, casas de materiales y contratistas.</p>
        <Button onClick={() => setEditando("nuevo")}>
          <Plus />
          Nuevo proveedor
        </Button>
      </div>
      {proveedores.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Todavía no hay proveedores.</p>
      ) : (
        <Card className="py-0">
          <ul className="divide-y">
            {proveedores.map((p) => {
              const ubicado = p.lat !== null && p.lng !== null;
              return (
                <li key={p.id} className={`flex flex-wrap items-center justify-between gap-2 p-3 ${p.activo ? "" : "opacity-50"}`}>
                  <div className="flex min-w-0 items-start gap-3">
                    {ubicado ? (
                      <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <MapPinOff className="mt-0.5 size-4 shrink-0 text-amber-600" aria-label="Sin ubicar" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{p.nombre}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {[p.direccion, p.localidad].filter(Boolean).join(", ") || "Sin dirección"}
                        {ubicado && ` · ${Math.round(distanciaKm(CABA, { lat: p.lat!, lng: p.lng! }))} km del centro de CABA`}
                        {p.web_dominio && ` · tienda online: ${p.web_dominio}`}
                        {[p.telefono, p.email].filter(Boolean).length > 0 && ` · ${[p.telefono, p.email].filter(Boolean).join(" · ")}`}
                      </p>
                      <p className="text-xs">
                        {ultimaLista[p.id] ? (
                          <span className={diasEntre(ultimaLista[p.id], hoy) > 31 ? "text-amber-700" : "text-muted-foreground"}>
                            Última lista: {formatFechaCorta(ultimaLista[p.id])}
                            {diasEntre(ultimaLista[p.id], hoy) > 31 && " · conviene pedir una nueva"}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Sin listas de precios</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {linkWhatsapp(p.telefono, mensajePedidoLista(p.nombre, estudio)) && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={linkWhatsapp(p.telefono, mensajePedidoLista(p.nombre, estudio))!} target="_blank" rel="noreferrer">
                          <MessageCircle />
                          Pedir lista
                        </a>
                      </Button>
                    )}
                    <Button variant="ghost" size="icon-sm" onClick={() => setEditando(p)} aria-label="Editar">
                      <Pencil />
                    </Button>
                    <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => setABorrar(p)} aria-label="Eliminar">
                      <Trash2 />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {editando !== null && (
        <ProveedorDialog
          key={editando === "nuevo" ? "nuevo" : editando.id}
          proveedor={editando === "nuevo" ? null : editando}
          onClose={() => setEditando(null)}
        />
      )}
      <AlertDialog open={aBorrar !== null} onOpenChange={(v) => !v && setABorrar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar «{aBorrar?.nombre}»?</AlertDialogTitle>
            <AlertDialogDescription>Se borran también sus precios y listas importadas. No se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                const p = aBorrar;
                if (!p) return;
                startTransition(async () => {
                  const res = await eliminarProveedor(p.id);
                  if (!res.ok) toast.error(res.error);
                  else toast.success("Proveedor eliminado");
                });
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
