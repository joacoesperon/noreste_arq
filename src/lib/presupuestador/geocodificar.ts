import "server-only";

// Ubicación a partir de una dirección con Nominatim (OpenStreetMap): gratuito y abierto.
// Política de uso: identificarse con User-Agent y no más de 1 consulta por segundo
// (acá se consulta solo al guardar un proveedor o ubicar una obra).
async function buscar(q: string) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "ar");
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "noreste-arq-panel/1.0 (norestearq.com)", "Accept-Language": "es" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { lat: string; lon: string; display_name: string }[];
    return data[0] ? { lat: Number(data[0].lat), lng: Number(data[0].lon), lugar: data[0].display_name } : null;
  } catch {
    return null;
  }
}

/**
 * Prueba de lo más preciso a lo más general: la dirección completa y, si no aparece,
 * la localidad. Para el radio de proveedores alcanza con la localidad.
 */
export async function geocodificar(partes: (string | null | undefined)[]) {
  const trozos = partes
    .filter((p): p is string => !!p?.trim())
    .flatMap((p) => p.split(",").map((x) => x.trim()))
    .filter(Boolean);
  for (let i = 0; i < trozos.length; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, 1100)); // 1 consulta por segundo
    const r = await buscar(`${trozos.slice(i).join(", ")}, Argentina`);
    if (r) return r;
  }
  return null;
}
