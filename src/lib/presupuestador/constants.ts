// Rubros de obra (etapas de la pregunta 10) para agrupar materiales y presupuestos.
// Se guardan como texto: agregar o renombrar acá no requiere migración.
export const RUBROS = [
  "Trabajos preliminares",
  "Movimiento de suelos",
  "Estructura",
  "Prefabricados",
  "Albañilería",
  "Instalación sanitaria",
  "Instalación eléctrica",
  "Instalación termomecánica (HVAC)",
  "Instalación de gas",
  "Carpinterías",
  "Terminaciones",
  "Pintura",
  "Equipamiento",
  "Exteriores y paisajismo",
  "Otros",
] as const;

export const UNIDADES = ["u", "m", "m²", "m³", "kg", "t", "l", "bolsa", "global", "h", "jornal"] as const;

export const TIPOS_MATERIAL = [
  { value: "material", label: "Material" },
  { value: "mano_de_obra", label: "Mano de obra" },
] as const;

export const RADIO_POR_DEFECTO_KM = 25;
