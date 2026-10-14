import { NextResponse, type NextRequest } from "next/server";
import { SITE_URL, enviarCorreo } from "@/lib/correo";
import { datosEstudio } from "@/lib/documentos/estudio";
import { mensajePedidoLista } from "@/lib/presupuestador/whatsapp";
import { createAdminClient } from "@/lib/supabase/admin";
import { hoyAR } from "@/lib/tareas/semanas";

export const dynamic = "force-dynamic";

/**
 * Recordatorio mensual a proveedores (pregunta 14). Lo dispara Vercel Cron (vercel.json)
 * el día 1 de cada mes: manda el pedido de lista por correo a los proveedores con correo y
 * deja una tarea en el tablero para hacer el pedido por WhatsApp (envío manual, gratuito).
 */
export async function GET(request: NextRequest) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || request.headers.get("authorization") !== `Bearer ${secreto}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ error: "Falta SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 });

  const { data: config } = await supabase.from("estudio_config").select("datos").maybeSingle();
  const estudio = datosEstudio(config?.datos);

  const hace25dias = new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString();
  const { data: proveedores } = await supabase
    .from("proveedores")
    .select("id, nombre, email, telefono, ultimo_recordatorio")
    .eq("activo", true)
    .eq("recordatorio", true);

  let correos = 0;
  const pendientesWhatsapp: string[] = [];
  for (const p of proveedores ?? []) {
    if (p.ultimo_recordatorio && p.ultimo_recordatorio > hace25dias) continue;
    if (p.email) {
      const ok = await enviarCorreo({
        para: p.email,
        asunto: `Pedido de lista de precios actualizada · ${estudio.nombre}`,
        titulo: "Pedido de lista de precios",
        parrafos: [mensajePedidoLista(p.nombre, estudio.nombre), `Pueden responder a este correo o escribirnos a ${estudio.email}.`],
        responderA: estudio.email,
      });
      if (ok) correos++;
    }
    if (p.telefono) pendientesWhatsapp.push(p.nombre);
    await supabase.from("proveedores").update({ ultimo_recordatorio: new Date().toISOString() }).eq("id", p.id);
  }

  // WhatsApp no se puede mandar gratis en forma automática: queda como tarea con los botones listos.
  if (pendientesWhatsapp.length) {
    await supabase.from("tareas").insert({
      titulo: "Pedir listas de precios por WhatsApp",
      descripcion: `Proveedores: ${pendientesWhatsapp.join(", ")}.\nEn ${SITE_URL}/admin/presupuestador/proveedores cada uno tiene el botón de WhatsApp con el mensaje armado.`,
      fecha: hoyAR(),
    });
  }

  return NextResponse.json({ ok: true, correos, whatsapp: pendientesWhatsapp.length });
}
