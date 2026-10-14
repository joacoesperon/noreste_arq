import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { listPlantillasPersonalizadas } from "@/lib/documentos/queries";
import { TIPOS_DOCUMENTO } from "@/lib/documentos/tipos";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Plantillas" };

const fecha = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Argentina/Buenos_Aires" });
const GRUPOS = ["Propuestas y presupuestos", "Contratos", "Cronogramas"] as const;

export default async function PlantillasPage() {
  const personalizadas = new Map((await listPlantillasPersonalizadas()).map((p) => [p.clave, p.updated_at]));

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6 md:p-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Plantillas</h1>
        <p className="text-sm text-muted-foreground">
          El texto fijo de cada tipo de documento (presentación, condiciones, cláusulas). Los datos de la obra se completan
          solos. Los cambios se aplican a los documentos nuevos.
        </p>
      </div>
      {GRUPOS.map((g) => (
        <section key={g} className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">{g}</h2>
          <Card className="py-0">
            <ul className="divide-y">
              {TIPOS_DOCUMENTO.filter((t) => t.grupo === g).map((t) => {
                const editada = personalizadas.get(t.clave);
                return (
                  <li key={t.clave}>
                    <Link href={`/admin/plantillas/${t.clave}`} className="group flex items-center justify-between gap-3 p-3 hover:bg-muted/50">
                      <span className="text-sm font-medium">{t.nombre}</span>
                      <span className="flex items-center gap-2">
                        {editada ? (
                          <Badge variant="secondary">del estudio · {fecha.format(new Date(editada))}</Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            provisoria
                          </Badge>
                        )}
                        <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
        </section>
      ))}
    </div>
  );
}
