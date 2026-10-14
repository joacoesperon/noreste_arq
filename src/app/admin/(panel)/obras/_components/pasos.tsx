"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Plus, Trash2 } from "lucide-react";
import type { Cliente, StaffOption } from "@/lib/obras/queries";
import { ESPECIALIDADES, ESTADOS, ROLES_COLABORADOR, SERVICIOS, TIPOLOGIAS } from "@/lib/obras/constants";
import type { ClienteDatosInput } from "@/lib/obras/schemas";
import { formatM2 } from "@/lib/obras/superficies";
import { parseNumero } from "@/lib/documentos/formato";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Destino, PasoProps } from "./asistente";

// ---------------------------------------------------------------------------
// helpers

/** Vacío → null; texto inválido → NaN (lo rechaza la validación). */
function aNumero(value: string): number | null {
  if (!value.trim()) return null;
  return parseNumero(value) ?? NaN;
}

/** Para inputs numéricos con coma decimal (es-AR). */
function aTexto(value: number | null | undefined) {
  return value === null || value === undefined ? "" : String(value).replace(".", ",");
}

function Campo({
  id,
  label,
  children,
  className,
}: {
  id?: string;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function Formulario({
  onSubmit,
  children,
}: {
  onSubmit: (destino: Destino) => void;
  children: React.ReactNode;
}) {
  // Enter en un input equivale a "Siguiente" / "Guardar".
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit("siguiente");
      }}
      className="flex flex-col gap-6"
    >
      {children}
    </form>
  );
}

function NumeroM2({
  id,
  value,
  onChange,
  label,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  label?: string;
}) {
  return (
    <div className="relative">
      <Input
        id={id}
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pr-9"
        aria-label={label}
        placeholder={label}
      />
      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
        m²
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1 · Datos generales

export function PasoGenerales({ obra, onGuardar, footer }: PasoProps) {
  const [titulo, setTitulo] = useState(obra?.titulo ?? "");
  const [tipologia, setTipologia] = useState(obra?.tipologia ?? "");
  const [estado, setEstado] = useState(obra?.estado ?? "propuesta");
  const [notas, setNotas] = useState(obra?.notas ?? "");

  const guardar = (destino: Destino) => onGuardar({ titulo, tipologia, estado, notas }, destino);

  // Tipologías que ya no están en la lista (renombradas) se siguen mostrando.
  const tipologias = tipologia && !(TIPOLOGIAS as readonly string[]).includes(tipologia)
    ? [tipologia, ...TIPOLOGIAS]
    : TIPOLOGIAS;

  return (
    <Formulario onSubmit={guardar}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="titulo" label="Título *" className="sm:col-span-2">
          <Input
            id="titulo"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Casa Los Álamos"
            required
            autoFocus
          />
        </Campo>
        <Campo id="tipologia" label="Tipología">
          <Select value={tipologia} onValueChange={setTipologia}>
            <SelectTrigger id="tipologia" className="w-full">
              <SelectValue placeholder="Elegí una tipología" />
            </SelectTrigger>
            <SelectContent>
              {tipologias.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Campo>
        <Campo id="estado" label="Estado">
          <Select value={estado} onValueChange={setEstado}>
            <SelectTrigger id="estado" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS.map((e) => (
                <SelectItem key={e.value} value={e.value}>
                  {e.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Campo>
        <Campo id="notas" label="Notas" className="sm:col-span-2">
          <Textarea id="notas" value={notas} onChange={(e) => setNotas(e.target.value)} rows={3} />
        </Campo>
      </div>
      {footer(guardar)}
    </Formulario>
  );
}

// ---------------------------------------------------------------------------
// 2 · Cliente

type ModoCliente = "existente" | "nuevo" | "sin";

const clienteVacio: ClienteDatosInput = {
  nombre: "",
  dni_cuit: "",
  domicilio: "",
  email: "",
  telefono: "",
  notas: "",
};

function datosDe(c: Cliente | null | undefined): ClienteDatosInput {
  if (!c) return clienteVacio;
  return {
    nombre: c.nombre,
    dni_cuit: c.dni_cuit ?? "",
    domicilio: c.domicilio ?? "",
    email: c.email ?? "",
    telefono: c.telefono ?? "",
    notas: c.notas ?? "",
  };
}

export function PasoCliente({ obra, onGuardar, footer, clientes }: PasoProps & { clientes: Cliente[] }) {
  const [modo, setModo] = useState<ModoCliente>(
    obra?.cliente ? "existente" : clientes.length > 0 ? "existente" : "nuevo"
  );
  const [clienteId, setClienteId] = useState<string | null>(obra?.cliente_id ?? null);
  const [datos, setDatos] = useState<ClienteDatosInput>(datosDe(obra?.cliente));
  const [abierto, setAbierto] = useState(false);

  const seleccionado = clientes.find((c) => c.id === clienteId);
  const otrasObras = seleccionado && seleccionado.id !== obra?.cliente_id;

  const set = (key: keyof ClienteDatosInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setDatos({ ...datos, [key]: e.target.value });

  const cambiarModo = (m: ModoCliente) => {
    setModo(m);
    if (m === "nuevo") {
      setClienteId(null);
      setDatos(clienteVacio);
    } else if (m === "existente") {
      const actual = clientes.find((c) => c.id === obra?.cliente_id) ?? null;
      setClienteId(actual?.id ?? null);
      setDatos(datosDe(actual));
    }
  };

  const guardar = (destino: Destino) => {
    if (modo === "sin") return onGuardar({ cliente_id: null, datos: null }, destino);
    if (modo === "existente" && !clienteId) {
      // Sin elegir: se toma como "sin cliente" para no bloquear la carga.
      return onGuardar({ cliente_id: null, datos: null }, destino);
    }
    onGuardar({ cliente_id: modo === "existente" ? clienteId : null, datos }, destino);
  };

  const mostrarDatos = modo === "nuevo" || (modo === "existente" && clienteId);

  return (
    <Formulario onSubmit={guardar}>
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["existente", "Cliente existente"],
            ["nuevo", "Cliente nuevo"],
            ["sin", "Sin cliente por ahora"],
          ] as const
        ).map(([m, label]) => (
          <Button
            key={m}
            type="button"
            size="sm"
            variant={modo === m ? "default" : "outline"}
            onClick={() => cambiarModo(m)}
            disabled={m === "existente" && clientes.length === 0}
          >
            {label}
          </Button>
        ))}
      </div>

      {modo === "existente" && (
        <Campo label="Cliente">
          <Popover open={abierto} onOpenChange={setAbierto}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" aria-expanded={abierto} className="w-full justify-between font-normal">
                {seleccionado ? seleccionado.nombre : <span className="text-muted-foreground">Buscar cliente…</span>}
                <ChevronsUpDown className="opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
              <Command>
                <CommandInput placeholder="Nombre o DNI/CUIT…" />
                <CommandList>
                  <CommandEmpty>No hay clientes con ese nombre.</CommandEmpty>
                  <CommandGroup>
                    {clientes.map((c) => (
                      <CommandItem
                        key={c.id}
                        value={`${c.nombre} ${c.dni_cuit ?? ""}`}
                        onSelect={() => {
                          setClienteId(c.id);
                          setDatos(datosDe(c));
                          setAbierto(false);
                        }}
                      >
                        <Check className={cn(clienteId === c.id ? "opacity-100" : "opacity-0")} />
                        <span>{c.nombre}</span>
                        {c.dni_cuit && <span className="ml-auto text-xs text-muted-foreground">{c.dni_cuit}</span>}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {otrasObras && (
            <p className="text-xs text-muted-foreground">
              Si modificás los datos, se actualizan en todas las obras de este cliente.
            </p>
          )}
        </Campo>
      )}

      {mostrarDatos && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id="cliente-nombre" label="Nombre o razón social *" className="sm:col-span-2">
            <Input id="cliente-nombre" value={datos.nombre} onChange={set("nombre")} placeholder="Familia Ruiz" />
          </Campo>
          <Campo id="cliente-dni" label="DNI / CUIT">
            <Input id="cliente-dni" value={datos.dni_cuit ?? ""} onChange={set("dni_cuit")} />
          </Campo>
          <Campo id="cliente-telefono" label="Teléfono">
            <Input id="cliente-telefono" type="tel" value={datos.telefono ?? ""} onChange={set("telefono")} />
          </Campo>
          <Campo id="cliente-email" label="Correo">
            <Input id="cliente-email" type="email" value={datos.email ?? ""} onChange={set("email")} />
          </Campo>
          <Campo id="cliente-domicilio" label="Domicilio">
            <Input id="cliente-domicilio" value={datos.domicilio ?? ""} onChange={set("domicilio")} />
          </Campo>
          <Campo id="cliente-notas" label="Notas" className="sm:col-span-2">
            <Textarea id="cliente-notas" value={datos.notas ?? ""} onChange={set("notas")} rows={2} />
          </Campo>
        </div>
      )}

      {footer(guardar)}
    </Formulario>
  );
}

// ---------------------------------------------------------------------------
// 3 · Ubicación

export function PasoUbicacion({ obra, onGuardar, footer }: PasoProps) {
  const [direccion, setDireccion] = useState(obra?.direccion ?? "");
  const [localidad, setLocalidad] = useState(obra?.localidad ?? "");
  const [provincia, setProvincia] = useState(obra?.provincia ?? "Buenos Aires");

  const guardar = (destino: Destino) => onGuardar({ direccion, localidad, provincia }, destino);

  return (
    <Formulario onSubmit={guardar}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="direccion" label="Dirección" className="sm:col-span-2">
          <Input id="direccion" value={direccion} onChange={(e) => setDireccion(e.target.value)} autoFocus />
        </Campo>
        <Campo id="localidad" label="Localidad">
          <Input id="localidad" value={localidad} onChange={(e) => setLocalidad(e.target.value)} placeholder="Tigre" />
        </Campo>
        <Campo id="provincia" label="Provincia">
          <Input id="provincia" value={provincia} onChange={(e) => setProvincia(e.target.value)} />
        </Campo>
      </div>
      <p className="text-xs text-muted-foreground">La ubicación define la zona de precios del presupuestador.</p>
      {footer(guardar)}
    </Formulario>
  );
}

// ---------------------------------------------------------------------------
// 4 · Superficies y sectores

type FilaSector = { key: string; nombre: string; cub: string; semi: string; desc: string };

let claveSector = 0;
const nuevaClave = () => `s${++claveSector}`;

function sumar(...valores: string[]) {
  return valores.reduce((acc, v) => acc + (aNumero(v) || 0), 0);
}

export function PasoSuperficies({ obra, onGuardar, footer }: PasoProps) {
  const [usaSectores, setUsaSectores] = useState((obra?.sectores.length ?? 0) > 0);
  const [cub, setCub] = useState(aTexto(obra?.sup_cubierta));
  const [semi, setSemi] = useState(aTexto(obra?.sup_semicubierta));
  const [desc, setDesc] = useState(aTexto(obra?.sup_descubierta));
  const [sectores, setSectores] = useState<FilaSector[]>(
    obra?.sectores.map((s) => ({
      key: s.id,
      nombre: s.nombre,
      cub: aTexto(s.sup_cubierta),
      semi: aTexto(s.sup_semicubierta),
      desc: aTexto(s.sup_descubierta),
    })) ?? []
  );

  const actualizar = (key: string, campo: keyof Omit<FilaSector, "key">, value: string) =>
    setSectores((prev) => prev.map((s) => (s.key === key ? { ...s, [campo]: value } : s)));

  const agregar = () =>
    setSectores((prev) => [
      ...prev,
      { key: nuevaClave(), nombre: `Sector ${prev.length + 1}`, cub: "", semi: "", desc: "" },
    ]);

  const totales = usaSectores
    ? {
        cub: sumar(...sectores.map((s) => s.cub)),
        semi: sumar(...sectores.map((s) => s.semi)),
        desc: sumar(...sectores.map((s) => s.desc)),
      }
    : { cub: sumar(cub), semi: sumar(semi), desc: sumar(desc) };

  const guardar = (destino: Destino) =>
    onGuardar(
      {
        usa_sectores: usaSectores,
        sup_cubierta: aNumero(cub),
        sup_semicubierta: aNumero(semi),
        sup_descubierta: aNumero(desc),
        sectores: sectores.map((s) => ({
          nombre: s.nombre,
          sup_cubierta: aNumero(s.cub),
          sup_semicubierta: aNumero(s.semi),
          sup_descubierta: aNumero(s.desc),
        })),
      },
      destino
    );

  return (
    <Formulario onSubmit={guardar}>
      <div className="flex items-center gap-3">
        <Switch
          id="usa-sectores"
          checked={usaSectores}
          onCheckedChange={(v) => {
            setUsaSectores(v);
            if (v && sectores.length === 0) agregar();
          }}
        />
        <Label htmlFor="usa-sectores">Dividir la obra en sectores</Label>
      </div>

      {usaSectores ? (
        <div className="flex flex-col gap-3">
          <div className="hidden grid-cols-[1fr_7rem_7rem_7rem_2rem] gap-2 text-xs text-muted-foreground sm:grid">
            <span>Sector</span>
            <span>Cubierta</span>
            <span>Semicubierta</span>
            <span>Descubierta</span>
          </div>
          {sectores.map((s, i) => (
            <div
              key={s.key}
              className="grid grid-cols-3 gap-2 border-b pb-3 sm:grid-cols-[1fr_7rem_7rem_7rem_2rem] sm:border-0 sm:pb-0"
            >
              <Input
                value={s.nombre}
                onChange={(e) => actualizar(s.key, "nombre", e.target.value)}
                aria-label={`Nombre del sector ${i + 1}`}
                className="col-span-2 sm:col-span-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="justify-self-end sm:order-last"
                onClick={() => setSectores((prev) => prev.filter((x) => x.key !== s.key))}
                aria-label="Quitar sector"
              >
                <Trash2 />
              </Button>
              <NumeroM2 id={`${s.key}-cub`} label="Cubierta" value={s.cub} onChange={(v) => actualizar(s.key, "cub", v)} />
              <NumeroM2 id={`${s.key}-semi`} label="Semicubierta" value={s.semi} onChange={(v) => actualizar(s.key, "semi", v)} />
              <NumeroM2 id={`${s.key}-desc`} label="Descubierta" value={s.desc} onChange={(v) => actualizar(s.key, "desc", v)} />
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" className="self-start" onClick={agregar}>
            <Plus />
            Agregar sector
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo id="sup-cub" label="Cubierta">
            <NumeroM2 id="sup-cub" value={cub} onChange={setCub} />
          </Campo>
          <Campo id="sup-semi" label="Semicubierta">
            <NumeroM2 id="sup-semi" value={semi} onChange={setSemi} />
          </Campo>
          <Campo id="sup-desc" label="Descubierta">
            <NumeroM2 id="sup-desc" value={desc} onChange={setDesc} />
          </Campo>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/50 p-3 text-sm sm:grid-cols-4">
        <span>Cubierta: {formatM2(totales.cub)}</span>
        <span>Semicubierta: {formatM2(totales.semi)}</span>
        <span>Descubierta: {formatM2(totales.desc)}</span>
        <span className="font-medium">Total: {formatM2(totales.cub + totales.semi + totales.desc)}</span>
      </div>

      {footer(guardar)}
    </Formulario>
  );
}

// ---------------------------------------------------------------------------
// 5 · Servicios y plazos

export function PasoServicios({ obra, onGuardar, footer }: PasoProps) {
  const [servicios, setServicios] = useState<string[]>(obra?.servicios ?? []);
  const [proyectoInicio, setProyectoInicio] = useState(obra?.proyecto_inicio ?? "");
  const [proyectoMeses, setProyectoMeses] = useState(aTexto(obra?.proyecto_duracion_meses));
  const [obraInicio, setObraInicio] = useState(obra?.obra_inicio ?? "");
  const [obraMeses, setObraMeses] = useState(aTexto(obra?.obra_duracion_meses));

  // Servicios guardados que ya no están en la lista se siguen mostrando.
  const opciones = [...SERVICIOS, ...servicios.filter((s) => !(SERVICIOS as readonly string[]).includes(s))];

  const toggle = (s: string, checked: boolean) =>
    setServicios((prev) => (checked ? [...prev, s] : prev.filter((x) => x !== s)));

  const guardar = (destino: Destino) =>
    onGuardar(
      {
        // Mantener el orden de la lista
        servicios: opciones.filter((s) => servicios.includes(s)),
        proyecto_inicio: proyectoInicio || null,
        proyecto_duracion_meses: aNumero(proyectoMeses),
        obra_inicio: obraInicio || null,
        obra_duracion_meses: aNumero(obraMeses),
      },
      destino
    );

  return (
    <Formulario onSubmit={guardar}>
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-sm font-medium">Servicio contratado</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {opciones.map((s) => (
            <div key={s} className="flex items-center gap-2">
              <Checkbox
                id={`servicio-${s}`}
                checked={servicios.includes(s)}
                onCheckedChange={(v) => toggle(s, v === true)}
              />
              <Label htmlFor={`servicio-${s}`} className="font-normal">
                {s}
              </Label>
            </div>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="proyecto-inicio" label="Inicio del proyecto">
          <Input id="proyecto-inicio" type="date" value={proyectoInicio} onChange={(e) => setProyectoInicio(e.target.value)} />
        </Campo>
        <Campo id="proyecto-meses" label="Duración del proyecto (meses)">
          <Input id="proyecto-meses" inputMode="decimal" value={proyectoMeses} onChange={(e) => setProyectoMeses(e.target.value)} />
        </Campo>
        <Campo id="obra-inicio" label="Inicio de obra">
          <Input id="obra-inicio" type="date" value={obraInicio} onChange={(e) => setObraInicio(e.target.value)} />
        </Campo>
        <Campo id="obra-meses" label="Duración de obra (meses)">
          <Input id="obra-meses" inputMode="decimal" value={obraMeses} onChange={(e) => setObraMeses(e.target.value)} />
        </Campo>
      </div>

      {footer(guardar)}
    </Formulario>
  );
}

// ---------------------------------------------------------------------------
// 6 · Equipo y especialidades

const EXTERNO = "externo";

type FilaColaborador = { key: string; staffId: string; nombre: string; rol: string; contacto: string };
type FilaEspecialidad = { key: string; especialidad: string; responsable: string; contacto: string };

export function PasoEquipo({ obra, onGuardar, footer, staff }: PasoProps & { staff: StaffOption[] }) {
  const [colaboradores, setColaboradores] = useState<FilaColaborador[]>(
    obra?.colaboradores.map((c) => ({
      key: c.id,
      staffId: c.staff_id ?? EXTERNO,
      nombre: c.nombre ?? "",
      rol: c.rol ?? "",
      contacto: c.contacto ?? "",
    })) ?? []
  );
  const [especialidades, setEspecialidades] = useState<FilaEspecialidad[]>(
    obra?.especialidades.map((e) => ({
      key: e.id,
      especialidad: e.especialidad,
      responsable: e.responsable ?? "",
      contacto: e.contacto ?? "",
    })) ?? []
  );

  const setColab = (key: string, campo: keyof Omit<FilaColaborador, "key">, value: string) =>
    setColaboradores((prev) => prev.map((c) => (c.key === key ? { ...c, [campo]: value } : c)));
  const setEsp = (key: string, campo: keyof Omit<FilaEspecialidad, "key">, value: string) =>
    setEspecialidades((prev) => prev.map((e) => (e.key === key ? { ...e, [campo]: value } : e)));

  const guardar = (destino: Destino) =>
    onGuardar(
      {
        colaboradores: colaboradores.map((c) => ({
          staff_id: c.staffId && c.staffId !== EXTERNO ? c.staffId : null,
          nombre: c.staffId === EXTERNO ? c.nombre : null,
          rol: c.rol,
          contacto: c.contacto,
        })),
        especialidades: especialidades.map(({ especialidad, responsable, contacto }) => ({
          especialidad,
          responsable,
          contacto,
        })),
      },
      destino
    );

  return (
    <Formulario onSubmit={guardar}>
      <datalist id="roles-colaborador">
        {ROLES_COLABORADOR.map((r) => (
          <option key={r} value={r} />
        ))}
      </datalist>
      <datalist id="especialidades">
        {ESPECIALIDADES.map((e) => (
          <option key={e} value={e} />
        ))}
      </datalist>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-medium">Colaboradores</h3>
        {colaboradores.length === 0 && (
          <p className="text-sm text-muted-foreground">Personas del estudio o externas que participan, con su rol.</p>
        )}
        {colaboradores.map((c) => (
          <div key={c.key} className="grid gap-2 border-b pb-3 sm:grid-cols-[1fr_1fr_1fr_2rem] sm:border-0 sm:pb-0">
            <div className="flex flex-col gap-2">
              <Select value={c.staffId} onValueChange={(v) => setColab(c.key, "staffId", v)}>
                <SelectTrigger className="w-full" aria-label="Persona">
                  <SelectValue placeholder="Persona" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nombre}
                    </SelectItem>
                  ))}
                  <SelectItem value={EXTERNO}>Externo al estudio…</SelectItem>
                </SelectContent>
              </Select>
              {c.staffId === EXTERNO && (
                <Input
                  value={c.nombre}
                  onChange={(e) => setColab(c.key, "nombre", e.target.value)}
                  placeholder="Nombre"
                  aria-label="Nombre del colaborador externo"
                />
              )}
            </div>
            <Input
              value={c.rol}
              onChange={(e) => setColab(c.key, "rol", e.target.value)}
              placeholder="Rol"
              list="roles-colaborador"
              aria-label="Rol"
            />
            <Input
              value={c.contacto}
              onChange={(e) => setColab(c.key, "contacto", e.target.value)}
              placeholder="Contacto"
              aria-label="Contacto"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setColaboradores((prev) => prev.filter((x) => x.key !== c.key))}
              aria-label="Quitar colaborador"
            >
              <Trash2 />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() =>
            setColaboradores((prev) => [
              ...prev,
              { key: nuevaClave(), staffId: "", nombre: "", rol: "", contacto: "" },
            ])
          }
        >
          <Plus />
          Agregar colaborador
        </Button>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-medium">Especialidades</h3>
        {especialidades.length === 0 && (
          <p className="text-sm text-muted-foreground">Estructura, instalaciones, paisajismo… y quién se ocupa de cada una.</p>
        )}
        {especialidades.map((e) => (
          <div key={e.key} className="grid gap-2 border-b pb-3 sm:grid-cols-[1fr_1fr_1fr_2rem] sm:border-0 sm:pb-0">
            <Input
              value={e.especialidad}
              onChange={(ev) => setEsp(e.key, "especialidad", ev.target.value)}
              placeholder="Especialidad"
              list="especialidades"
              aria-label="Especialidad"
            />
            <Input
              value={e.responsable}
              onChange={(ev) => setEsp(e.key, "responsable", ev.target.value)}
              placeholder="Responsable"
              aria-label="Responsable"
            />
            <Input
              value={e.contacto}
              onChange={(ev) => setEsp(e.key, "contacto", ev.target.value)}
              placeholder="Contacto"
              aria-label="Contacto"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setEspecialidades((prev) => prev.filter((x) => x.key !== e.key))}
              aria-label="Quitar especialidad"
            >
              <Trash2 />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() =>
            setEspecialidades((prev) => [
              ...prev,
              { key: nuevaClave(), especialidad: "", responsable: "", contacto: "" },
            ])
          }
        >
          <Plus />
          Agregar especialidad
        </Button>
      </section>

      {footer(guardar)}
    </Formulario>
  );
}
