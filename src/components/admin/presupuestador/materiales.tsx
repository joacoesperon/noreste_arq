"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { ExternalLink, Globe, Loader2, Pencil, Plus, Search, Tag, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  buscarEnWeb,
  cargarPrecio,
  desvincularProductoWeb,
  eliminarMaterial,
  guardarMaterial,
  vincularProductoWeb,
  type ResultadoWeb,
} from "@/app/admin/(panel)/presupuestador/actions";
import { formatFechaCorta, formatMonto, parseNumero, type Moneda } from "@/lib/documentos/formato";
import { RUBROS, TIPOS_MATERIAL, UNIDADES } from "@/lib/presupuestador/constants";
import type { Material, PrecioVigente, Proveedor } from "@/lib/presupuestador/queries";
import type { ProductoWeb } from "@/lib/presupuestador/vtex";
import { hoyAR } from "@/lib/tareas/semanas";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

const TODOS = "__todos";

export type VinculoWeb = { id: string; material_id: string; proveedor_id: string; nombre: string; url: string | null; ultimo_error: string | null };

/** Producto de una tienda elegido para cargar su precio (y, si se quiere, vincularlo). */
type ElegidoWeb = { proveedor_id: string; producto: ProductoWeb };

/** Buscar el material en las tiendas online de los proveedores; el elegido completa el formulario de precio. */
function BuscarEnWeb({
  material,
  vinculos,
  proveedores,
  onUsar,
}: {
  material: Material;
  vinculos: VinculoWeb[];
  proveedores: Proveedor[];
  onUsar: (elegido: ElegidoWeb) => void;
}) {
  const [texto, setTexto] = useState(material.nombre);
  const [resultados, setResultados] = useState<ResultadoWeb[] | null>(null);
  const [pending, startTransition] = useTransition();
  const nombre = (id: string) => proveedores.find((p) => p.id === id)?.nombre ?? "—";

  return (
    <div className="flex flex-col gap-3 border-t pt-4">
      <p className="flex items-center gap-1.5 text-sm font-medium">
        <Globe className="size-4" />
        Precio de tiendas online
      </p>
      {vinculos.length > 0 && (
        <ul className="flex flex-col gap-1 text-sm">
          {vinculos.map((v) => (
            <li key={v.id} className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-2 py-1">
              <span className="min-w-0 truncate">
                <span className="font-medium">{nombre(v.proveedor_id)}:</span> {v.nombre}
                {v.ultimo_error && <span className="text-destructive"> · {v.ultimo_error}</span>}
              </span>
              <span className="flex shrink-0 gap-1">
                {v.url && (
                  <Button variant="ghost" size="icon-xs" asChild>
                    <a href={v.url} target="_blank" rel="noreferrer" aria-label="Ver en la tienda">
                      <ExternalLink />
                    </a>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Quitar vínculo"
                  onClick={() => startTransition(async () => {
                    const res = await desvincularProductoWeb(v.id);
                    if (!res.ok) toast.error(res.error);
                  })}
                >
                  <X />
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          startTransition(async () => setResultados(await buscarEnWeb(texto)));
        }}
      >
        <Input value={texto} onChange={(e) => setTexto(e.target.value)} aria-label="Buscar en tiendas" />
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Search />}
          Buscar en la web
        </Button>
      </form>
      {resultados?.map((r) => (
        <div key={r.proveedor_id} className="flex flex-col gap-1">
          <p className="text-xs font-medium text-muted-foreground">
            {r.proveedor}
            {r.error && <span className="text-destructive"> · {r.error}</span>}
            {!r.error && r.productos.length === 0 && " · sin resultados"}
          </p>
          <ul className="flex flex-col divide-y rounded-md border text-sm">
            {r.productos.map((prod) => (
              <li key={prod.producto_id} className="flex items-center justify-between gap-2 p-2">
                <span className="min-w-0">
                  <span className="block truncate">{prod.nombre}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatMonto(prod.precio, "ARS")}
                    {!prod.disponible && " · sin stock"}
                  </span>
                </span>
                <Button size="xs" variant="outline" disabled={pending} onClick={() => onUsar({ proveedor_id: r.proveedor_id, producto: prod })}>
                  <Tag />
                  Usar precio
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function normal(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

type FormMaterial = {
  codigo: string;
  nombre: string;
  unidad: string;
  rubro: string;
  tipo: "material" | "mano_de_obra";
  notas: string;
  activo: boolean;
};

const vacio: FormMaterial = { codigo: "", nombre: "", unidad: "u", rubro: RUBROS[0], tipo: "material", notas: "", activo: true };

function MaterialDialog({
  material,
  open,
  onOpenChange,
}: {
  material: Material | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [form, setForm] = useState<FormMaterial>(
    material
      ? {
          codigo: material.codigo ?? "",
          nombre: material.nombre,
          unidad: material.unidad,
          rubro: material.rubro,
          tipo: material.tipo as FormMaterial["tipo"],
          notas: material.notas ?? "",
          activo: material.activo,
        }
      : vacio
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const set = <K extends keyof FormMaterial>(k: K, v: FormMaterial[K]) => setForm((f) => ({ ...f, [k]: v }));
  const rubros = form.rubro && !(RUBROS as readonly string[]).includes(form.rubro) ? [form.rubro, ...RUBROS] : RUBROS;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{material ? "Editar" : "Nuevo"} material</DialogTitle>
          <DialogDescription>El código sirve para asociar las cantidades exportadas de Revit.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              const res = await guardarMaterial(material?.id ?? null, form);
              if (!res.ok) return setError(res.error);
              toast.success("Material guardado");
              onOpenChange(false);
            });
          }}
        >
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="mat-nombre">Nombre *</Label>
            <Input id="mat-nombre" value={form.nombre} onChange={(e) => set("nombre", e.target.value)} placeholder="Cemento portland x 50 kg" required autoFocus />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="mat-codigo">Código</Label>
            <Input id="mat-codigo" value={form.codigo} onChange={(e) => set("codigo", e.target.value)} placeholder="ALB-001" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="mat-tipo">Tipo</Label>
            <Select value={form.tipo} onValueChange={(v) => set("tipo", v as FormMaterial["tipo"])}>
              <SelectTrigger id="mat-tipo" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_MATERIAL.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="mat-rubro">Rubro</Label>
            <Select value={form.rubro} onValueChange={(v) => set("rubro", v)}>
              <SelectTrigger id="mat-rubro" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {rubros.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="mat-unidad">Unidad</Label>
            <Input id="mat-unidad" value={form.unidad} onChange={(e) => set("unidad", e.target.value)} list="unidades" required />
            <datalist id="unidades">
              {UNIDADES.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="mat-notas">Notas</Label>
            <Textarea id="mat-notas" value={form.notas} onChange={(e) => set("notas", e.target.value)} rows={2} />
          </div>
          <div className="flex items-center gap-2 sm:col-span-2">
            <Checkbox id="mat-activo" checked={form.activo} onCheckedChange={(v) => set("activo", v === true)} />
            <Label htmlFor="mat-activo" className="font-normal">
              Activo (aparece al armar presupuestos)
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

function PreciosDialog({
  material,
  precios,
  proveedores,
  vinculos,
  onOpenChange,
}: {
  material: Material;
  precios: PrecioVigente[];
  proveedores: Proveedor[];
  vinculos: VinculoWeb[];
  onOpenChange: (v: boolean) => void;
}) {
  const [proveedor, setProveedor] = useState("");
  const [precio, setPrecio] = useState("");
  const [moneda, setMoneda] = useState<Moneda>("ARS");
  const [fecha, setFecha] = useState(hoyAR());
  const [referencia, setReferencia] = useState("");
  const [web, setWeb] = useState<ElegidoWeb | null>(null);
  const [semanal, setSemanal] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const form = useRef<HTMLFormElement>(null);
  const nombre = (id: string) => proveedores.find((p) => p.id === id)?.nombre ?? "—";
  // Con «actualizar cada semana» el precio es el de la tienda: se vuelve a leer al guardar.
  const vincular = !!web && semanal;

  const usarWeb = (elegido: ElegidoWeb) => {
    setWeb(elegido);
    setSemanal(true);
    setProveedor(elegido.proveedor_id);
    setPrecio(String(elegido.producto.precio).replace(".", ","));
    setMoneda("ARS");
    setFecha(hoyAR());
    setReferencia(elegido.producto.url ?? "");
    setError(null);
    form.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const soltarWeb = () => {
    setWeb(null);
    setReferencia("");
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{material.nombre}</DialogTitle>
          <DialogDescription>Último precio de cada proveedor, con su fecha y fuente.</DialogDescription>
        </DialogHeader>
        {precios.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay precios para este material.</p>
        ) : (
          <ul className="flex flex-col divide-y rounded-md border text-sm">
            {[...precios]
              .sort((a, b) => a.precio - b.precio)
              .map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 p-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{nombre(p.proveedor_id)}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatFechaCorta(p.fecha)} · {p.fuente === "web" ? "web" : p.fuente === "lista" ? "lista" : "a mano"}
                      {p.descripcion_proveedor && ` · «${p.descripcion_proveedor}»`}
                    </p>
                  </div>
                  <span className="shrink-0 tabular-nums">
                    {formatMonto(p.precio, p.moneda as Moneda)} / {material.unidad}
                  </span>
                </li>
              ))}
          </ul>
        )}

        {proveedores.some((p) => p.web_plataforma) && (
          <BuscarEnWeb material={material} vinculos={vinculos} proveedores={proveedores} onUsar={usarWeb} />
        )}

        <form
          ref={form}
          className="grid gap-3 border-t pt-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const n = parseNumero(precio);
            startTransition(async () => {
              const res =
                web && semanal
                  ? await vincularProductoWeb({ material_id: material.id, proveedor_id: web.proveedor_id, producto_id: web.producto.producto_id })
                  : await cargarPrecio({
                      material_id: material.id,
                      proveedor_id: proveedor || undefined,
                      precio: n ?? undefined,
                      moneda,
                      fecha,
                      referencia,
                    });
              if (!res.ok) return setError(res.error);
              toast.success(vincular ? "Precio cargado: se actualiza solo cada semana" : "Precio cargado");
              onOpenChange(false);
            });
          }}
        >
          <p className="text-sm font-medium sm:col-span-2">{web ? "Cargar el precio de la tienda" : "Cargar un precio a mano"}</p>
          {web && (
            <div className="flex flex-col gap-2 rounded-md bg-muted/50 p-2 text-sm sm:col-span-2">
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate">
                  <Globe className="mr-1 inline size-3.5" />
                  {web.producto.nombre}
                </span>
                <Button type="button" variant="ghost" size="icon-xs" onClick={soltarWeb} aria-label="Cargar a mano">
                  <X />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="precio-semanal" checked={semanal} onCheckedChange={(v) => setSemanal(v === true)} />
                <Label htmlFor="precio-semanal" className="font-normal">
                  Actualizar este precio solo cada semana desde la tienda
                </Label>
              </div>
            </div>
          )}
          <Select value={proveedor} onValueChange={setProveedor} disabled={vincular}>
            <SelectTrigger className="w-full sm:col-span-2" aria-label="Proveedor">
              <SelectValue placeholder={proveedores.length ? "Proveedor" : "Primero cargá un proveedor"} />
            </SelectTrigger>
            <SelectContent>
              {proveedores.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            placeholder={`Precio por ${material.unidad}`}
            inputMode="decimal"
            aria-label="Precio"
            disabled={vincular}
          />
          <Select value={moneda} onValueChange={(v) => setMoneda(v as Moneda)} disabled={vincular}>
            <SelectTrigger className="w-full" aria-label="Moneda">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ARS">Pesos</SelectItem>
              <SelectItem value="USD">Dólares</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} aria-label="Fecha" disabled={vincular} />
          <Input
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
            placeholder="Referencia (opcional)"
            aria-label="Referencia"
            disabled={vincular}
          />
          {error && (
            <p role="alert" className="text-sm text-destructive sm:col-span-2">
              {error}
            </p>
          )}
          <Button type="submit" disabled={pending} className="sm:col-span-2">
            {pending ? "Guardando…" : "Cargar precio"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function Materiales({
  materiales,
  precios,
  proveedores,
  vinculos,
}: {
  materiales: Material[];
  precios: PrecioVigente[];
  proveedores: Proveedor[];
  vinculos: VinculoWeb[];
}) {
  const [busqueda, setBusqueda] = useState("");
  const [rubro, setRubro] = useState(TODOS);
  const [editando, setEditando] = useState<Material | null | "nuevo">(null);
  const [conPrecios, setConPrecios] = useState<Material | null>(null);
  const [aBorrar, setABorrar] = useState<Material | null>(null);
  const [, startTransition] = useTransition();

  const preciosDe = useMemo(() => {
    const m = new Map<string, PrecioVigente[]>();
    for (const p of precios) m.set(p.material_id, [...(m.get(p.material_id) ?? []), p]);
    return m;
  }, [precios]);

  const filtrados = materiales.filter((m) => {
    if (rubro !== TODOS && m.rubro !== rubro) return false;
    const q = normal(busqueda.trim());
    return !q || normal(`${m.nombre} ${m.codigo ?? ""}`).includes(q);
  });

  const mejor = (m: Material) => {
    const ps = preciosDe.get(m.id) ?? [];
    const ars = ps.filter((p) => p.moneda === "ARS").sort((a, b) => a.precio - b.precio)[0];
    return ars ?? ps.sort((a, b) => a.precio - b.precio)[0];
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por nombre o código" className="pl-8" aria-label="Buscar materiales" />
        </div>
        <Select value={rubro} onValueChange={setRubro}>
          <SelectTrigger className="w-full sm:w-56" aria-label="Rubro">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos los rubros</SelectItem>
            {RUBROS.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setEditando("nuevo")}>
          <Plus />
          Nuevo material
        </Button>
      </div>

      {materiales.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          El catálogo está vacío. Cargá materiales y mano de obra a mano, o importá una lista de precios y creá los
          materiales desde ahí.
        </p>
      ) : (
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Material</TableHead>
                <TableHead className="hidden md:table-cell">Rubro</TableHead>
                <TableHead className="hidden sm:table-cell">Unidad</TableHead>
                <TableHead className="text-right">Mejor precio</TableHead>
                <TableHead className="pr-4" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map((m) => {
                const p = mejor(m);
                const n = preciosDe.get(m.id)?.length ?? 0;
                return (
                  <TableRow key={m.id} className={m.activo ? "" : "opacity-50"}>
                    <TableCell className="pl-4">
                      <div className="flex flex-col">
                        <span className="font-medium">{m.nombre}</span>
                        <span className="text-xs text-muted-foreground">
                          {[m.codigo, m.tipo === "mano_de_obra" ? "mano de obra" : null, m.activo ? null : "inactivo"]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{m.rubro}</TableCell>
                    <TableCell className="hidden sm:table-cell">{m.unidad}</TableCell>
                    <TableCell className="text-right">
                      <button type="button" onClick={() => setConPrecios(m)} className="hover:underline">
                        {p ? (
                          <span className="tabular-nums">{formatMonto(p.precio, p.moneda as Moneda)}</span>
                        ) : (
                          <span className="text-muted-foreground">sin precio</span>
                        )}
                        {n > 1 && <Badge variant="secondary" className="ml-2">{n}</Badge>}
                      </button>
                    </TableCell>
                    <TableCell className="pr-4 text-right whitespace-nowrap">
                      <Button variant="ghost" size="icon-sm" onClick={() => setConPrecios(m)} aria-label="Precios">
                        <Tag />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => setEditando(m)} aria-label="Editar">
                        <Pencil />
                      </Button>
                      <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => setABorrar(m)} aria-label="Eliminar">
                        <Trash2 />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtrados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    Ningún material coincide con la búsqueda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {editando !== null && (
        <MaterialDialog
          key={editando === "nuevo" ? "nuevo" : editando.id}
          material={editando === "nuevo" ? null : editando}
          open
          onOpenChange={(v) => !v && setEditando(null)}
        />
      )}
      {conPrecios && (
        <PreciosDialog
          material={conPrecios}
          precios={preciosDe.get(conPrecios.id) ?? []}
          proveedores={proveedores}
          vinculos={vinculos.filter((v) => v.material_id === conPrecios.id)}
          onOpenChange={(v) => !v && setConPrecios(null)}
        />
      )}
      <AlertDialog open={aBorrar !== null} onOpenChange={(v) => !v && setABorrar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar «{aBorrar?.nombre}»?</AlertDialogTitle>
            <AlertDialogDescription>
              Se borran sus precios. Los presupuestos que lo usan conservan la descripción y el precio. Si solo querés
              ocultarlo, editalo y desmarcá «Activo».
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                const m = aBorrar;
                if (!m) return;
                startTransition(async () => {
                  const res = await eliminarMaterial(m.id);
                  if (!res.ok) toast.error(res.error);
                  else toast.success("Material eliminado");
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
