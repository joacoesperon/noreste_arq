import Link from "next/link";
import { Pencil } from "lucide-react";
import type { ObraCompleta, StaffOption } from "@/lib/obras/queries";
import { formatFecha, finEstimado, formatMeses } from "@/lib/obras/format";
import { formatM2, totalesSuperficie } from "@/lib/obras/superficies";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EstadoBadge } from "./estado-badge";

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  const vacio = children === null || children === undefined || children === "";
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{vacio ? <span className="text-muted-foreground">—</span> : children}</dd>
    </div>
  );
}

function Seccion({
  titulo,
  editarHref,
  children,
}: {
  titulo: string;
  editarHref: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{titulo}</CardTitle>
        <CardAction>
          <Button variant="ghost" size="sm" asChild>
            <Link href={editarHref}>
              <Pencil />
              Editar
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function ObraResumen({ obra, staff }: { obra: ObraCompleta; staff: StaffOption[] }) {
  const editar = (paso: number) => `/admin/obras/${obra.id}/editar?paso=${paso}`;
  const totales = totalesSuperficie(obra, obra.sectores);
  const nombreStaff = (id: string | null) => staff.find((s) => s.id === id)?.nombre ?? "Persona del estudio";
  const finProyecto = finEstimado(obra.proyecto_inicio, obra.proyecto_duracion_meses);
  const finObra = finEstimado(obra.obra_inicio, obra.obra_duracion_meses);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Seccion titulo="Datos generales" editarHref={editar(1)}>
        <dl className="grid gap-4 sm:grid-cols-2">
          <Campo label="Título">{obra.titulo}</Campo>
          <Campo label="Estado">
            <EstadoBadge estado={obra.estado} />
          </Campo>
          <Campo label="Tipología">{obra.tipologia}</Campo>
          <div className="sm:col-span-2">
            <Campo label="Notas">{obra.notas && <span className="whitespace-pre-line">{obra.notas}</span>}</Campo>
          </div>
        </dl>
      </Seccion>

      <Seccion titulo="Cliente" editarHref={editar(2)}>
        {obra.cliente ? (
          <dl className="grid gap-4 sm:grid-cols-2">
            <Campo label="Nombre">{obra.cliente.nombre}</Campo>
            <Campo label="DNI / CUIT">{obra.cliente.dni_cuit}</Campo>
            <Campo label="Domicilio">{obra.cliente.domicilio}</Campo>
            <Campo label="Teléfono">{obra.cliente.telefono}</Campo>
            <Campo label="Correo">{obra.cliente.email}</Campo>
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">Sin cliente asignado.</p>
        )}
      </Seccion>

      <Seccion titulo="Ubicación" editarHref={editar(3)}>
        <dl className="grid gap-4 sm:grid-cols-3">
          <Campo label="Dirección">{obra.direccion}</Campo>
          <Campo label="Localidad">{obra.localidad}</Campo>
          <Campo label="Provincia">{obra.provincia}</Campo>
        </dl>
      </Seccion>

      <Seccion titulo="Superficies" editarHref={editar(4)}>
        <div className="flex flex-col gap-4">
          {obra.sectores.length > 0 && (
            <ul className="flex flex-col divide-y text-sm">
              {obra.sectores.map((s) => (
                <li key={s.id} className="flex justify-between gap-4 py-1.5">
                  <span>{s.nombre}</span>
                  <span className="text-muted-foreground">
                    {formatM2(totalesSuperficie(s).total)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Campo label="Cubierta">{formatM2(totales.cubierta)}</Campo>
            <Campo label="Semicubierta">{formatM2(totales.semicubierta)}</Campo>
            <Campo label="Descubierta">{formatM2(totales.descubierta)}</Campo>
            <Campo label="Total">
              <span className="font-medium">{formatM2(totales.total)}</span>
            </Campo>
          </dl>
        </div>
      </Seccion>

      <Seccion titulo="Servicios y plazos" editarHref={editar(5)}>
        <div className="flex flex-col gap-4">
          <Campo label="Servicio contratado">
            {obra.servicios.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {obra.servicios.map((s) => (
                  <Badge key={s} variant="secondary">
                    {s}
                  </Badge>
                ))}
              </div>
            )}
          </Campo>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Campo label="Proyecto">
              {(obra.proyecto_inicio || obra.proyecto_duracion_meses) &&
                [formatFecha(obra.proyecto_inicio), formatMeses(obra.proyecto_duracion_meses)]
                  .filter(Boolean)
                  .join(" · ")}
              {finProyecto && <span className="block text-xs text-muted-foreground">fin estimado: {finProyecto}</span>}
            </Campo>
            <Campo label="Obra">
              {(obra.obra_inicio || obra.obra_duracion_meses) &&
                [formatFecha(obra.obra_inicio), formatMeses(obra.obra_duracion_meses)].filter(Boolean).join(" · ")}
              {finObra && <span className="block text-xs text-muted-foreground">fin estimado: {finObra}</span>}
            </Campo>
          </dl>
        </div>
      </Seccion>

      <Seccion titulo="Equipo y especialidades" editarHref={editar(6)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Colaboradores">
            {obra.colaboradores.length > 0 && (
              <ul className="flex flex-col gap-1">
                {obra.colaboradores.map((c) => (
                  <li key={c.id}>
                    {c.staff_id ? nombreStaff(c.staff_id) : c.nombre}
                    {c.rol && <span className="text-muted-foreground"> · {c.rol}</span>}
                  </li>
                ))}
              </ul>
            )}
          </Campo>
          <Campo label="Especialidades">
            {obra.especialidades.length > 0 && (
              <ul className="flex flex-col gap-1">
                {obra.especialidades.map((e) => (
                  <li key={e.id}>
                    {e.especialidad}
                    {e.responsable && <span className="text-muted-foreground"> · {e.responsable}</span>}
                  </li>
                ))}
              </ul>
            )}
          </Campo>
        </div>
      </Seccion>
    </div>
  );
}
