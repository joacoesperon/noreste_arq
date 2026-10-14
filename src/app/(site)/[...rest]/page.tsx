import { notFound } from "next/navigation";

// Con root layouts separados (sitio y admin) no hay app/not-found global:
// cualquier ruta desconocida cae acá y muestra el 404 del sitio.
export default function CatchAll() {
  notFound();
}
