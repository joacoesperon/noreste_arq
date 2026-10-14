// Copia a public/ los archivos que se cargan en tiempo de ejecución, con la versión instalada.
// Corre en postinstall.
//   public/visor/: worker de fragments y WASM de web-ifc (visor IFC)
//   public/vendor/: worker de pdf.js (importar listas de precios en PDF)
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
mkdirSync("public/vendor", { recursive: true });
copyFileSync("node_modules/pdfjs-dist/build/pdf.worker.min.mjs", "public/vendor/pdf.worker.min.mjs");
console.log("workers y wasm copiados a public/visor y public/vendor");
