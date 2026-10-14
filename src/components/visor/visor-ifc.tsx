"use client";

import { useEffect, useRef, useState } from "react";
import type * as OBCTypes from "@thatopen/components";
import { Loader2, Maximize, Scissors, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type Controles = {
  encuadrar: () => void;
  setCortes: (activo: boolean) => void;
  quitarCortes: () => void;
};

/**
 * Visor de modelos IFC (That Open Engine, open source). Carga el archivo desde
 * `url` (link firmado) y lo muestra en 3D: girar, desplazar, zoom y cortes.
 * El worker y el WASM se sirven desde /visor (ver scripts/copiar-visor.mjs).
 */
export function VisorIfc({ url, nombre }: { url: string; nombre: string }) {
  const contenedor = useRef<HTMLDivElement>(null);
  const controles = useRef<Controles | null>(null);
  const [progreso, setProgreso] = useState<number | null>(0);
  const [error, setError] = useState<string | null>(null);
  const [cortes, setCortes] = useState(false);

  useEffect(() => {
    const container = contenedor.current;
    if (!container) return;
    let cancelado = false;
    let liberar: (() => void) | undefined;

    (async () => {
      try {
        // Carga diferida: three y That Open solo se bajan cuando se abre el visor.
        const OBC = await import("@thatopen/components");
        if (cancelado) return;

        const components = new OBC.Components();
        liberar = () => components.dispose();

        const world = components
          .get(OBC.Worlds)
          .create<OBCTypes.SimpleScene, OBCTypes.OrthoPerspectiveCamera, OBCTypes.SimpleRenderer>();
        world.scene = new OBC.SimpleScene(components);
        world.scene.setup();
        world.scene.three.background = null;
        world.renderer = new OBC.SimpleRenderer(components, container);
        world.camera = new OBC.OrthoPerspectiveCamera(components);
        await world.camera.controls.setLookAt(30, 20, 30, 0, 0, 0);
        components.init();
        components.get(OBC.Grids).create(world);
        components.get(OBC.Raycasters).get(world);

        const fragments = components.get(OBC.FragmentsManager);
        fragments.init("/visor/worker.mjs");
        world.camera.controls.addEventListener("update", () => fragments.core.update());
        fragments.list.onItemSet.add(({ value: model }) => {
          model.useCamera(world.camera.three);
          world.scene.three.add(model.object);
          fragments.core.update(true);
        });

        const clipper = components.get(OBC.Clipper);
        clipper.enabled = false;
        container.ondblclick = () => {
          if (clipper.enabled) clipper.create(world);
        };

        controles.current = {
          encuadrar: () => world.camera.fitToItems(),
          setCortes: (activo) => {
            clipper.enabled = activo;
          },
          quitarCortes: () => clipper.deleteAll(),
        };

        const ifcLoader = components.get(OBC.IfcLoader);
        await ifcLoader.setup({ autoSetWasm: false, wasm: { path: "/visor/", absolute: true } });

        const res = await fetch(url);
        if (!res.ok) throw new Error("No se pudo descargar el modelo.");
        const buffer = new Uint8Array(await res.arrayBuffer());
        if (cancelado) return;

        await ifcLoader.load(buffer, false, nombre, {
          processData: { progressCallback: (p) => !cancelado && setProgreso(p) },
        });
        if (cancelado) return;
        await world.camera.fitToItems();
        setProgreso(null);
      } catch (e) {
        console.error("Visor IFC:", e);
        if (!cancelado) setError("No se pudo abrir el modelo. Verificá que sea un archivo IFC válido.");
      }
    })();

    return () => {
      cancelado = true;
      controles.current = null;
      container.ondblclick = null;
      liberar?.();
    };
  }, [url, nombre]);

  return (
    <div className="relative h-full min-h-[400px] w-full overflow-hidden rounded-lg border bg-muted/30">
      <div ref={contenedor} className="absolute inset-0" />

      {progreso !== null && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Cargando modelo…</p>
          <Progress value={Math.round(progreso * 100)} className="w-48" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/90 p-6 text-center">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {progreso === null && !error && (
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => controles.current?.encuadrar()}>
            <Maximize />
            Encuadrar
          </Button>
          <Button
            size="sm"
            variant={cortes ? "default" : "secondary"}
            onClick={() => {
              controles.current?.setCortes(!cortes);
              setCortes(!cortes);
            }}
          >
            <Scissors />
            Cortes
          </Button>
          {cortes && (
            <Button size="sm" variant="secondary" onClick={() => controles.current?.quitarCortes()}>
              <X />
              Quitar cortes
            </Button>
          )}
        </div>
      )}

      {progreso === null && !error && (
        <p className="pointer-events-none absolute right-3 bottom-3 left-40 hidden text-right text-xs text-muted-foreground sm:block">
          {cortes
            ? "Doble clic sobre el modelo para crear un plano de corte; arrastrá la flecha para moverlo."
            : "Arrastrá para girar · clic derecho para desplazar · rueda para acercar"}
        </p>
      )}
    </div>
  );
}
