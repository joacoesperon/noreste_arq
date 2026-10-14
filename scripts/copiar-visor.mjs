// Copia a public/visor/ los archivos que el visor IFC carga en tiempo de ejecución
// (worker de fragments y WASM de web-ifc), con la versión instalada. Corre en postinstall.
import { copyFileSync, mkdirSync } from "node:fs";

const destino = "public/visor";
mkdirSync(destino, { recursive: true });

for (const [origen, nombre] of [
  ["node_modules/@thatopen/fragments/dist/Worker/worker.mjs", "worker.mjs"],
  ["node_modules/web-ifc/web-ifc.wasm", "web-ifc.wasm"],
  ["node_modules/web-ifc/web-ifc-mt.wasm", "web-ifc-mt.wasm"],
]) {
  copyFileSync(origen, `${destino}/${nombre}`);
}
console.log("visor: worker y wasm copiados a public/visor");
