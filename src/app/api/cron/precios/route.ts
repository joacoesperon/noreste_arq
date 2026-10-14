import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dominioValido, precioVtex } from "@/lib/presupuestador/vtex";
import { hoyAR } from "@/lib/tareas/semanas";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Actualización semanal de precios web (vercel.json). Recorre los materiales vinculados a
 * productos de tiendas online, de a poco y del más viejo al más nuevo, para no superar el
 * tiempo máximo de la función: si el precio cambió guarda uno nuevo, si no actualiza la fecha.
 */
export async function GET(request: NextRequest) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || request.headers.get("authorization") !== `Bearer ${secreto}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ error: "Falta SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 });

  const { data: vinculos } = await supabase
    .from("material_productos_web")
    .select("id, material_id, proveedor_id, producto_id, proveedor:proveedores(web_dominio, activo)")
    .order("ultima_lectura", { ascending: true, nullsFirst: true })
    .limit(120);

  const hoy = hoyAR();
  let nuevos = 0;
  let iguales = 0;
  let errores = 0;
  const inicio = Date.now();
  for (const v of vinculos ?? []) {
    if (Date.now() - inicio > 50_000) break; // dejar margen al límite de la función
    const dominio = v.proveedor?.web_dominio;
    if (!v.proveedor?.activo || !dominioValido(dominio)) continue;
    try {
      const producto = await precioVtex(dominio, v.producto_id);
      if (!producto) throw new Error("El producto ya no está en la tienda");
      const { data: ultimo } = await supabase
        .from("precios")
        .select("id, precio")
        .eq("material_id", v.material_id)
        .eq("proveedor_id", v.proveedor_id)
        .eq("fuente", "web")
        .order("fecha", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (ultimo && Number(ultimo.precio) === producto.precio) {
        await supabase.from("precios").update({ fecha: hoy }).eq("id", ultimo.id);
        iguales++;
      } else {
        await supabase.from("precios").insert({
          material_id: v.material_id,
          proveedor_id: v.proveedor_id,
          precio: producto.precio,
          moneda: "ARS",
          fecha: hoy,
          fuente: "web",
          referencia: producto.url,
          descripcion_proveedor: producto.nombre,
        });
        nuevos++;
      }
      await supabase.from("material_productos_web").update({ ultima_lectura: new Date().toISOString(), ultimo_error: null }).eq("id", v.id);
    } catch (e) {
      errores++;
      await supabase
        .from("material_productos_web")
        .update({ ultima_lectura: new Date().toISOString(), ultimo_error: e instanceof Error ? e.message : "Error" })
        .eq("id", v.id);
    }
    await new Promise((r) => setTimeout(r, 300)); // no saturar la tienda
  }
  return NextResponse.json({ ok: true, nuevos, iguales, errores });
}
