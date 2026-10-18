"use client";

import { useEffect, useRef, useState } from "react";
import { guardarConsulta } from "@/app/(site)/actions";
import { PREGUNTAS, linkWhatsapp, mensajeWhatsapp, type Respuestas } from "@/lib/consultas/preguntas";

const VACIAS: Respuestas = { tipo: "", ubicacion: "", servicio: "", presupuesto: "", etapa: "", plazo: "", nombre: "" };

/** Botón fijo «Cotizá tu proyecto»: preguntas rápidas y salida a WhatsApp con Josefina. */
export default function CotizaProyecto({ telefono }: { telefono: string }) {
  const [open, setOpen] = useState(false);
  const [paso, setPaso] = useState(0);
  const [respuestas, setRespuestas] = useState<Respuestas>(VACIAS);
  const [otro, setOtro] = useState(false);
  const [otroTexto, setOtroTexto] = useState("");
  const [trampa, setTrampa] = useState("");
  const guardada = useRef(false);
  const panel = useRef<HTMLDivElement>(null);

  const final = paso === PREGUNTAS.length;
  const pregunta = PREGUNTAS[paso];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Foco en el primer campo de cada paso (teclado y lectores de pantalla)
  useEffect(() => {
    if (open) panel.current?.querySelector<HTMLElement>("input, button[data-opcion]")?.focus();
  }, [open, paso, otro]);

  const responder = (valor: string) => {
    if (!pregunta) return;
    setRespuestas((r) => ({ ...r, [pregunta.campo]: valor }));
    setOtro(false);
    setPaso((p) => p + 1);
  };

  const elegir = (opcion: string) => {
    if (pregunta?.otra === opcion) return setOtro(true);
    responder(opcion);
  };

  const reiniciar = () => {
    setPaso(0);
    setRespuestas(VACIAS);
    setOtro(false);
    setOtroTexto("");
    guardada.current = false;
  };

  const enviar = () => {
    if (guardada.current) return;
    guardada.current = true;
    void guardarConsulta({ ...respuestas, web: trampa });
  };

  const texto = pregunta ? respuestas[pregunta.campo] : "";
  const setTexto = (v: string) => pregunta && setRespuestas((r) => ({ ...r, [pregunta.campo]: v }));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="cotiza-panel"
        className="
          fixed bottom-6 right-6 z-1000
          rounded-full bg-[#1a1a1a] px-5 py-2.5
          text-white shadow-[0_2px_10px_rgba(0,0,0,0.15)]
          transition-all duration-300
          hover:scale-105 hover:shadow-[0_4px_15px_rgba(0,0,0,0.2)]
          active:scale-95
        "
      >
        {open ? "Cerrar" : "Cotizá tu proyecto"}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-999 bg-black/5 backdrop-blur-[1px]" onClick={() => setOpen(false)} />
          <div
            id="cotiza-panel"
            ref={panel}
            role="dialog"
            aria-label="Cotizá tu proyecto"
            className="
              fixed bottom-20 left-4 right-4 z-1000
              sm:left-auto sm:right-6 sm:w-[380px]
              max-h-[75vh] overflow-y-auto
              bg-(--background) border border-text/20
              shadow-[0_10px_30px_rgba(0,0,0,0.1)]
              p-6 flex flex-col gap-5
              animate-in fade-in slide-in-from-bottom-4 duration-300
            "
          >
            <div className="flex items-center justify-between border-b border-text/10 pb-4">
              <h2 className="text-xxs uppercase tracking-[0.15em] font-medium text-text/60">Cotizá tu proyecto</h2>
              <span className="text-xxs text-text/40 tabular-nums">
                {final ? "Listo" : `${paso + 1} / ${PREGUNTAS.length}`}
              </span>
            </div>

            {pregunta && (
              <div className="flex flex-col gap-4">
                <p className="font-medium text-[#1a1a1a]">{pregunta.titulo}</p>

                {pregunta.opciones && !otro ? (
                  <div className="flex flex-col gap-1.5">
                    {pregunta.opciones.map((o) => (
                      <button
                        key={o}
                        type="button"
                        data-opcion
                        onClick={() => elegir(o)}
                        className={`
                          border px-3 py-2 text-left transition-colors
                          ${texto === o || (o === pregunta.otra && texto.startsWith(`${o}:`))
                            ? "border-[#1a1a1a] text-[#1a1a1a]"
                            : "border-text/15 hover:border-text/50 hover:text-text-hover"}
                        `}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                ) : (
                  <form
                    className="flex flex-col gap-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const v = (otro ? otroTexto : texto).trim();
                      responder(otro ? `${pregunta.otra}${v ? `: ${v}` : ""}` : v);
                    }}
                  >
                    <input
                      value={otro ? otroTexto : texto}
                      onChange={(e) => (otro ? setOtroTexto(e.target.value) : setTexto(e.target.value))}
                      placeholder={otro ? "Contanos qué proyecto" : pregunta.placeholder}
                      maxLength={180}
                      className="border border-text/20 px-3 py-2 outline-none focus:border-[#1a1a1a]"
                    />
                    <button type="submit" className="self-end bg-[#1a1a1a] px-4 py-2 text-white hover:opacity-90">
                      Siguiente
                    </button>
                  </form>
                )}
              </div>
            )}

            {final && (
              <div className="flex flex-col gap-4">
                <p className="font-medium text-[#1a1a1a]">¡Gracias! Así le llega tu consulta a Josefina:</p>
                <pre className="whitespace-pre-wrap bg-text/5 p-3 font-sans text-xs leading-relaxed text-text">
                  {mensajeWhatsapp(respuestas)}
                </pre>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs text-text/70">Tu nombre (opcional)</span>
                  <input
                    value={respuestas.nombre}
                    onChange={(e) => setRespuestas((r) => ({ ...r, nombre: e.target.value }))}
                    maxLength={120}
                    className="border border-text/20 px-3 py-2 outline-none focus:border-[#1a1a1a]"
                  />
                </label>
                {/* Campo trampa para bots: oculto para las personas */}
                <input
                  value={trampa}
                  onChange={(e) => setTrampa(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="absolute -left-[9999px] h-0 w-0 opacity-0"
                />
                <a
                  href={linkWhatsapp(telefono, mensajeWhatsapp(respuestas))}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={enviar}
                  className="bg-[#1a1a1a] px-4 py-2.5 text-center text-white hover:opacity-90"
                >
                  Enviar por WhatsApp
                </a>
              </div>
            )}

            {paso > 0 && (
              <div className="flex justify-between border-t border-text/10 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setOtro(false);
                    setPaso((p) => p - 1);
                  }}
                  className="text-xxs uppercase tracking-wider opacity-50 hover:opacity-100"
                >
                  ← Anterior
                </button>
                <button type="button" onClick={reiniciar} className="text-xxs uppercase tracking-wider opacity-50 hover:opacity-100">
                  Empezar de nuevo
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
