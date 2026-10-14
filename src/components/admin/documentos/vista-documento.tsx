import { Fragment } from "react";
import type { Bloque, DocumentoResuelto, Run } from "@/lib/documentos/bloques";
import { ESTUDIO } from "@/lib/documentos/estudio";
import { cn } from "@/lib/utils";
import { Gantt } from "@/components/admin/cronogramas/gantt";

function Runs({ runs }: { runs: Run[] }) {
  return (
    <>
      {runs.map((r, i) => {
        const partes = r.texto.split("\n");
        return (
          <span
            key={i}
            className={cn(
              r.b && "font-semibold",
              r.i && "italic",
              r.u && "underline",
              r.falta && "rounded bg-amber-100 px-1 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
            )}
          >
            {partes.map((p, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {p}
              </Fragment>
            ))}
          </span>
        );
      })}
    </>
  );
}

function VistaBloque({ b }: { b: Bloque }) {
  switch (b.t) {
    case "titulo": {
      const Tag = (["h1", "h2", "h3"] as const)[b.nivel - 1];
      return (
        <Tag className={cn("font-semibold", b.nivel === 1 ? "mt-2 text-2xl" : b.nivel === 2 ? "mt-6 text-base" : "mt-4 text-sm")}>
          <Runs runs={b.runs} />
        </Tag>
      );
    }
    case "parrafo":
      return (
        <p className="min-h-[1em] text-sm leading-relaxed">
          <Runs runs={b.runs} />
        </p>
      );
    case "lista": {
      const Tag = b.ordenada ? "ol" : "ul";
      return (
        <Tag className={cn("flex flex-col gap-1 pl-5 text-sm", b.ordenada ? "list-decimal" : "list-disc")}>
          {b.items.map((item, i) => (
            <li key={i}>
              <Runs runs={item} />
            </li>
          ))}
        </Tag>
      );
    }
    case "tabla":
      return (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-foreground/70">
              {b.columnas.map((c, i) => (
                <th key={i} className={cn("py-1.5 text-left font-semibold", b.derecha?.includes(i) && "text-right")}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {b.filas.map((f, i) => (
              <tr
                key={i}
                className={cn(
                  "border-b",
                  f.tipo === "seccion" && "bg-muted/60 font-medium",
                  f.tipo === "subtotal" && "text-muted-foreground",
                  f.tipo === "total" && "border-t-2 border-foreground/70 font-semibold"
                )}
              >
                {f.celdas.map((c, j) => (
                  <td key={j} className={cn("px-0.5 py-1.5", b.derecha?.includes(j) && "text-right tabular-nums")}>
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    case "gantt":
      return <Gantt etapas={b.etapas} hoy="" />;
    case "firmas":
      return (
        <div className="mt-16 grid grid-cols-2 gap-12">
          {b.partes.map((p, i) => (
            <div key={i} className="flex flex-col items-center gap-1 border-t border-foreground/70 pt-2 text-center text-sm">
              <span className="font-medium">{p.nombre}</span>
              <span className="text-xs text-muted-foreground">{p.rol}</span>
            </div>
          ))}
        </div>
      );
    case "separador":
      return <hr className="my-2" />;
  }
}

/** Vista previa del documento como hoja A4 con la identidad del estudio. */
export function VistaDocumento({ documento }: { documento: DocumentoResuelto }) {
  return (
    <div className="mx-auto w-full max-w-[210mm] rounded-sm bg-white px-[12%] py-12 text-neutral-900 shadow-sm ring-1 ring-black/5 dark:text-neutral-900">
      <header className="mb-10 flex items-end justify-between border-b border-neutral-300 pb-3">
        {/* Marca en texto hasta recibir el logo en vector (el PNG actual tiene fondo). */}
        <div className="leading-none">
          <p className="text-base font-bold tracking-tight">noreste</p>
          <p className="text-[9px] tracking-wider">ARQ</p>
        </div>
        <span className="text-[10px] tracking-wide text-neutral-500 uppercase">{ESTUDIO.nombre}</span>
      </header>
      <div className="flex flex-col gap-3">
        {documento.bloques.map((b, i) => (
          <VistaBloque key={i} b={b} />
        ))}
      </div>
      <footer className="mt-12 border-t border-neutral-300 pt-3 text-center text-[10px] text-neutral-500">
        {ESTUDIO.nombre} · {ESTUDIO.email} · {ESTUDIO.telefono} · {ESTUDIO.ciudad}
      </footer>
    </div>
  );
}
