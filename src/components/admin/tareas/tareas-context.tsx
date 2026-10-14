"use client";

import { createContext, useContext, useState } from "react";
import type { ObraOpcion } from "@/lib/tareas/queries";
import type { StaffOption } from "@/lib/obras/queries";
import { TareaSheet } from "./tarea-sheet";

type TareasContextValue = {
  yo: string;
  staff: StaffOption[];
  obras: ObraOpcion[];
  nombre: (staffId: string | null) => string | null;
  abrir: (tareaId: string) => void;
};

const TareasContext = createContext<TareasContextValue | null>(null);

export function useTareas() {
  const ctx = useContext(TareasContext);
  if (!ctx) throw new Error("useTareas fuera de <TareasProvider>");
  return ctx;
}

/** Envuelve una vista con tareas: datos de referencia y el panel lateral de detalle. */
export function TareasProvider({
  yo,
  staff,
  obras,
  inicial = null,
  children,
}: {
  yo: string;
  staff: StaffOption[];
  obras: ObraOpcion[];
  /** Tarea a abrir al entrar (link de los avisos por correo). */
  inicial?: string | null;
  children: React.ReactNode;
}) {
  const [abierta, setAbierta] = useState<string | null>(inicial);
  const nombre = (id: string | null) => (id ? (staff.find((s) => s.id === id)?.nombre ?? null) : null);

  return (
    <TareasContext.Provider value={{ yo, staff, obras, nombre, abrir: setAbierta }}>
      {children}
      <TareaSheet tareaId={abierta} onClose={() => setAbierta(null)} />
    </TareasContext.Provider>
  );
}
