import { Fragment } from "react";
import type { Bloque, DocumentoResuelto, Run } from "@/lib/documentos/bloques";
import type { Membrete } from "@/lib/documentos/estudio";
import { hoyAR } from "@/lib/tareas/semanas";
import { cn } from "@/lib/utils";
import { Gantt } from "@/components/admin/cronogramas/gantt";

// Misma diagramación que el PDF (plantilla NE26): colores del manual #181818 / #555555 / #c0c0c4 / #f8f8f8.

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
              r.falta && "rounded bg-amber-100 px-1 text-amber-900"
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
        <Tag className={cn("font-bold text-[#181818]", b.nivel === 1 ? "text-2xl leading-tight" : b.nivel === 2 ? "mt-4 text-base" : "mt-2 text-sm")}>
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
        <Tag className={cn("flex flex-col gap-0.5 pl-5 text-sm", b.ordenada ? "list-decimal" : "list-disc")}>
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
            <tr className="border-b-2 border-[#181818]">
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
                  "border-b border-[#c0c0c4]",
                  f.tipo === "seccion" && "bg-[#f8f8f8] font-medium",
                  f.tipo === "subtotal" && "text-[#555555]",
                  f.tipo === "total" && "border-t-2 border-[#181818] font-semibold"
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
    case "columnas":
      return (
        <div className="flex flex-col">
          {b.filas.map((fila, i) => (
            <div key={i} className="grid gap-5" style={{ gridTemplateColumns: `repeat(${fila.length}, minmax(0, 1fr))` }}>
              {fila.map((celda, j) => (
                <div key={j} className="flex flex-col gap-2">
                  {celda.map((x, k) => (
                    <VistaBloque key={k} b={x} />
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      );
    case "gantt":
      return <Gantt etapas={b.etapas} hoy="" />;
    case "firmas":
      return (
        <div className="mt-14 grid grid-cols-2 gap-x-10 gap-y-12">
          {b.partes.map((p, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5 border-t border-[#181818] pt-2 text-center text-sm">
              <span className="font-semibold">{p.nombre}</span>
              <span className="text-xs text-[#555555]">{p.rol}</span>
            </div>
          ))}
        </div>
      );
    case "separador":
      return <hr className="my-2 border-[#c0c0c4]" />;
    case "portada":
    case "contratapa":
      return null;
  }
}

function HojaNegra({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex aspect-[210/297] w-full max-w-[210mm] flex-col items-center justify-center gap-6 rounded-sm bg-[#181818] p-10 text-center text-white shadow-sm">
      {children}
    </div>
  );
}

/** Vista previa del documento con la identidad del estudio. */
export function VistaDocumento({ documento, membrete }: { documento: DocumentoResuelto; membrete: Membrete }) {
  const portada = documento.bloques.find((b) => b.t === "portada");
  const contratapa = documento.bloques.some((b) => b.t === "contratapa");
  const cuerpo = documento.bloques.filter((b) => b.t !== "portada" && b.t !== "contratapa");

  return (
    <div className="flex flex-col gap-6">
      {portada?.t === "portada" && (
        <HojaNegra>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/marca/isotipo-blanco.png" alt="" className="w-24" />
          <div>
            <p className="text-lg font-bold">{portada.titulo}</p>
            {portada.subtitulo && <p className="mt-1 text-xs text-[#c0c0c4]">{portada.subtitulo}</p>}
          </div>
        </HojaNegra>
      )}

      <div className="mx-auto w-full max-w-[210mm] rounded-sm bg-white px-[9%] py-10 text-[#181818] shadow-sm ring-1 ring-black/5">
        <header className="mb-10 flex items-start justify-between">
          <div className="text-[10px] leading-relaxed text-[#555555]">
            <p>{documento.fecha ?? hoyAR()}</p>
            <p>{membrete.instagram}</p>
            <p>{membrete.email}</p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/marca/logo.svg" alt={membrete.nombre} className="h-10 w-auto" />
        </header>
        <div className="flex flex-col gap-2.5">
          {cuerpo.map((b, i) => (
            <VistaBloque key={i} b={b} />
          ))}
        </div>
        <footer className="mt-12 text-[10px] leading-relaxed text-[#555555]">
          {membrete.telefonos.map((t, i) => (
            <p key={i}>
              {t.numero} | {t.nombre}
            </p>
          ))}
        </footer>
      </div>

      {contratapa && (
        <HojaNegra>
          <div className="flex flex-1 flex-col items-center justify-center">
            <p className="text-lg font-bold">muchas gracias!</p>
            <p className="text-xs">{membrete.email}</p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/marca/isotipo-blanco.png" alt="" className="w-8" />
        </HojaNegra>
      )}
    </div>
  );
}
