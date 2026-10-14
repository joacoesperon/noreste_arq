"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, FileUp, Link2, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { equivalenciasProveedor, importarLista } from "@/app/admin/(panel)/presupuestador/actions";
import { formatMonto, parseNumero, type Moneda } from "@/lib/documentos/formato";
import { RUBROS } from "@/lib/presupuestador/constants";
import { leerTabla } from "@/lib/presupuestador/leer-tabla";
import type { Material, Proveedor } from "@/lib/presupuestador/queries";
import { normalizar } from "@/lib/presupuestador/texto";
import { hoyAR } from "@/lib/tareas/semanas";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adivinarMapeo, MapeoColumnas } from "./mapeo-columnas";

type Estado = "asociada" | "nueva" | "ignorar";
type Fila = {
  texto: string;
  codigo: string;
  unidad: string;
  precio: number | null;
  material_id: string | null;
  /** Cómo se asoció sola (para mostrarlo) */
  auto: "equivalencia" | "codigo" | "nombre" | null;
  estado: Estado;
};

const ROLES = [
  { key: "descripcion", label: "Descripción", obligatorio: true },
  { key: "precio", label: "Precio", obligatorio: true },
  { key: "codigo", label: "Código" },
  { key: "unidad", label: "Unidad" },
  { key: "iva", label: "IVA (%)" },
];

export function ImportarLista({ proveedores, materiales }: { proveedores: Proveedor[]; materiales: Material[] }) {
  const router = useRouter();
  const [proveedor, setProveedor] = useState("");
  const [fecha, setFecha] = useState(hoyAR());
  const [moneda, setMoneda] = useState<Moneda>("ARS");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [tabla, setTabla] = useState<string[][] | null>(null);
  const [mapeo, setMapeo] = useState<Record<string, number>>({});
  const [encabezado, setEncabezado] = useState(true);
  /** Muchas listas vienen sin IVA: se suma al importar (por fila si hay columna de IVA, si no 21%). */
  const [sumarIva, setSumarIva] = useState(false);
  const [filas, setFilas] = useState<Fila[] | null>(null);
  const [rubroNuevos, setRubroNuevos] = useState<string>(RUBROS[0]);
  const [asociando, setAsociando] = useState<number | null>(null);
  const [leyendo, setLeyendo] = useState(false);
  const [pending, startTransition] = useTransition();

  const porId = useMemo(() => new Map(materiales.map((m) => [m.id, m])), [materiales]);

  const leer = async (file: File) => {
    setLeyendo(true);
    try {
      const t = await leerTabla(file);
      if (t.length === 0) throw new Error("El archivo está vacío.");
      setArchivo(file);
      setTabla(t);
      setMapeo(
        adivinarMapeo(t, {
          descripcion: /descrip|articulo|producto|detalle|material|nombre/,
          precio: /precio|importe|valor|\$|lista/,
          codigo: /codigo|cod\.?|sku|art\./,
          unidad: /unidad|u\.?m\.?|^un/,
          iva: /^iva|alicuota/,
        })
      );
      setFilas(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo leer el archivo.");
    } finally {
      setLeyendo(false);
    }
  };

  /** Arma las filas y las asocia solas: por equivalencia del proveedor, por código o por nombre exacto. */
  const asociar = () =>
    startTransition(async () => {
      if (!tabla) return;
      const equivalencias = new Map((await equivalenciasProveedor(proveedor)).map((e) => [e.texto, e.material_id]));
      const porCodigo = new Map(materiales.filter((m) => m.codigo).map((m) => [normalizar(m.codigo!), m.id]));
      const porNombre = new Map(materiales.map((m) => [normalizar(m.nombre), m.id]));
      const col = (f: string[], k: string) => (mapeo[k] >= 0 && mapeo[k] !== undefined ? (f[mapeo[k]] ?? "").trim() : "");

      const nuevas: Fila[] = [];
      for (const f of tabla.slice(encabezado ? 1 : 0)) {
        const texto = col(f, "descripcion");
        const neto = parseNumero(col(f, "precio"));
        if (!texto || neto === null) continue; // títulos de sección, renglones vacíos
        const iva = parseNumero(col(f, "iva")) ?? 21;
        const precio = sumarIva ? Math.round(neto * (1 + iva / 100) * 100) / 100 : neto;
        const codigo = col(f, "codigo");
        const n = normalizar(texto);
        let material_id: string | null = null;
        let auto: Fila["auto"] = null;
        if (equivalencias.has(n)) [material_id, auto] = [equivalencias.get(n)!, "equivalencia"];
        else if (codigo && porCodigo.has(normalizar(codigo))) [material_id, auto] = [porCodigo.get(normalizar(codigo))!, "codigo"];
        else if (porNombre.has(n)) [material_id, auto] = [porNombre.get(n)!, "nombre"];
        nuevas.push({ texto, codigo, unidad: col(f, "unidad"), precio, material_id, auto, estado: material_id ? "asociada" : "ignorar" });
      }
      if (nuevas.length === 0) return void toast.error("No se encontraron filas con descripción y precio. Revisá las columnas.");
      setFilas(nuevas);
    });

  const set = (i: number, cambios: Partial<Fila>) =>
    setFilas((fs) => (fs ? fs.map((f, j) => (j === i ? { ...f, ...cambios } : f)) : fs));

  const importar = () =>
    startTransition(async () => {
      if (!filas) return;
      const res = await importarLista({
        proveedor_id: proveedor,
        fecha,
        moneda,
        archivo: archivo?.name ?? null,
        filas: filas
          .filter((f) => f.estado !== "ignorar")
          .map((f) => ({
            texto: f.texto,
            precio: f.precio,
            material_id: f.estado === "asociada" ? f.material_id : null,
            nuevo:
              f.estado === "nueva"
                ? { nombre: f.texto, unidad: f.unidad || "u", rubro: rubroNuevos, codigo: f.codigo || null }
                : null,
          })),
      });
      if (!res.ok) return void toast.error(res.error);
      toast.success(`${res.importados} precios importados`);
      router.push("/admin/presupuestador/precios");
    });

  const cuenta = (e: Estado) => filas?.filter((f) => f.estado === e).length ?? 0;
  const listoParaAsociar = proveedor && fecha && tabla && mapeo.descripcion >= 0 && mapeo.precio >= 0;

  return (
    <div className="flex flex-col gap-4">
      <Button variant="ghost" size="sm" className="self-start" asChild>
        <Link href="/admin/presupuestador/precios">
          <ArrowLeft />
          Listas de precios
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>1. La lista</CardTitle>
          <CardDescription>Excel (.xlsx), CSV o PDF con columnas (código, descripción, precio). Si el PDF no se lee bien, pedile el Excel al proveedor.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label>Proveedor *</Label>
            <Select value={proveedor} onValueChange={(v) => { setProveedor(v); setFilas(null); }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={proveedores.length ? "Elegí el proveedor" : "Primero cargá un proveedor"} />
              </SelectTrigger>
              <SelectContent>
                {proveedores.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="lista-fecha">Fecha de la lista *</Label>
            <Input id="lista-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Moneda</Label>
            <Select value={moneda} onValueChange={(v) => setMoneda(v as Moneda)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ARS">Pesos</SelectItem>
                <SelectItem value="USD">Dólares</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-4">
            <input
              id="lista-archivo"
              type="file"
              accept=".xlsx,.csv,.txt,.tsv,.pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) leer(f);
              }}
            />
            <Button variant="outline" asChild>
              <label htmlFor="lista-archivo" className="cursor-pointer">
                {leyendo ? <Loader2 className="animate-spin" /> : <FileUp />}
                {archivo ? "Cambiar archivo" : "Elegir archivo"}
              </label>
            </Button>
            {archivo && <span className="truncate text-sm text-muted-foreground">{archivo.name} · {tabla?.length} filas</span>}
          </div>
        </CardContent>
      </Card>

      {tabla && (
        <Card>
          <CardHeader>
            <CardTitle>2. Columnas</CardTitle>
            <CardDescription>Indicá qué columna tiene cada dato. Las filas sin precio (títulos, separadores) se saltean.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <MapeoColumnas filas={tabla} roles={ROLES} mapeo={mapeo} onMapeo={(m) => { setMapeo(m); setFilas(null); }} encabezado={encabezado} onEncabezado={(v) => { setEncabezado(v); setFilas(null); }} />
            <div className="flex items-center gap-2">
              <Checkbox id="sumar-iva" checked={sumarIva} onCheckedChange={(v) => { setSumarIva(v === true); setFilas(null); }} />
              <Label htmlFor="sumar-iva" className="font-normal">
                Los precios no incluyen IVA: sumarlo (usa la columna de IVA, o 21% si no hay)
              </Label>
            </div>
            <Button className="self-start" onClick={asociar} disabled={!listoParaAsociar || pending}>
              {pending && !filas ? <Loader2 className="animate-spin" /> : <Link2 />}
              Asociar con el catálogo
            </Button>
          </CardContent>
        </Card>
      )}

      {filas && (
        <Card>
          <CardHeader>
            <CardTitle>3. Asociar cada producto a un material del catálogo</CardTitle>
            <CardDescription>
              Lo que asocies queda guardado: la próxima lista de este proveedor se asocia sola. {cuenta("asociada")} asociadas ·{" "}
              {cuenta("nueva")} nuevas · {cuenta("ignorar")} sin importar.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end gap-2 rounded-md bg-muted/50 p-3">
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Rubro para los materiales nuevos</Label>
                <Select value={rubroNuevos} onValueChange={setRubroNuevos}>
                  <SelectTrigger className="w-56 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RUBROS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="sm" onClick={() => setFilas((fs) => fs && fs.map((f) => (f.estado === "ignorar" ? { ...f, estado: "nueva" } : f)))}>
                <Plus />
                Crear como nuevos todos los sin asociar
              </Button>
            </div>

            <ul className="flex flex-col divide-y rounded-md border">
              {filas.map((f, i) => {
                const m = f.material_id ? porId.get(f.material_id) : null;
                return (
                  <li key={i} className={cn("flex flex-col gap-2 p-2 text-sm sm:flex-row sm:items-center", f.estado === "ignorar" && "opacity-60")}>
                    <div className="min-w-0 flex-1">
                      <p className="truncate">{f.texto}</p>
                      <p className="text-xs text-muted-foreground">
                        {[f.codigo, f.unidad].filter(Boolean).join(" · ")}
                        {f.codigo || f.unidad ? " · " : ""}
                        <span className="tabular-nums">{formatMonto(f.precio!, moneda)}</span>
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {f.estado === "asociada" && m && (
                        <Badge variant="secondary" className="max-w-64 truncate" title={m.nombre}>
                          <Check />
                          {m.nombre}
                          {f.auto && <span className="font-normal text-muted-foreground"> · {f.auto === "equivalencia" ? "ya conocida" : `por ${f.auto}`}</span>}
                        </Badge>
                      )}
                      {f.estado === "nueva" && <Badge variant="outline">material nuevo</Badge>}
                      <Button variant="ghost" size="xs" onClick={() => setAsociando(i)}>
                        Asociar…
                      </Button>
                      {f.estado !== "nueva" && (
                        <Button variant="ghost" size="xs" onClick={() => set(i, { estado: "nueva" })}>
                          Crear
                        </Button>
                      )}
                      {f.estado !== "ignorar" && (
                        <Button variant="ghost" size="xs" onClick={() => set(i, { estado: "ignorar" })} aria-label="No importar">
                          <X />
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            <Button className="self-end" onClick={importar} disabled={pending || cuenta("asociada") + cuenta("nueva") === 0}>
              {pending ? <Loader2 className="animate-spin" /> : <FileUp />}
              Importar {cuenta("asociada") + cuenta("nueva")} precios
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={asociando !== null} onOpenChange={(v) => !v && setAsociando(null)}>
        <DialogContent className="p-0 sm:max-w-lg">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle className="truncate text-sm">{asociando !== null && filas?.[asociando]?.texto}</DialogTitle>
          </DialogHeader>
          <Command>
            <CommandInput placeholder="Buscar material del catálogo…" />
            <CommandList className="max-h-80">
              <CommandEmpty>No hay materiales con ese nombre.</CommandEmpty>
              <CommandGroup>
                {materiales.map((m) => (
                  <CommandItem
                    key={m.id}
                    value={`${m.nombre} ${m.codigo ?? ""}`}
                    onSelect={() => {
                      if (asociando === null) return;
                      set(asociando, { material_id: m.id, estado: "asociada", auto: null });
                      setAsociando(null);
                    }}
                  >
                    <span className="truncate">{m.nombre}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{m.unidad}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </div>
  );
}
