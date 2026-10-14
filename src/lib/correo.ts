import "server-only";

// Envío de correos con Resend (gratis hasta 3.000 por mes). Configuración (variables de entorno):
//   RESEND_API_KEY   clave de Resend. Si falta, no se envía nada (se registra en el log).
//   CORREO_DE        remitente, p. ej. «noreste arq <avisos@norestearq.com>» (dominio verificado en Resend).
//   CORREO_SOLO_A    modo prueba: lista separada por comas. Si está, solo se envía a esas direcciones.
//   NEXT_PUBLIC_SITE_URL  dirección del sitio para los links (por defecto https://www.norestearq.com).

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.norestearq.com").replace(/\/$/, "");

type Correo = {
  para: string | null | undefined;
  asunto: string;
  titulo: string;
  parrafos: string[];
  boton?: { texto: string; url: string };
  /** Si responden, a dónde va la respuesta (p. ej. el correo del estudio). */
  responderA?: string;
};

function escapar(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

/** HTML simple con la identidad del estudio (los clientes de correo no aceptan CSS externo). */
function plantilla({ titulo, parrafos, boton }: Correo) {
  return `<!doctype html><html><body style="margin:0;background:#f8f8f8;font-family:Helvetica,Arial,sans-serif;color:#181818">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8f8;padding:32px 12px"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #c0c0c4">
<tr><td style="padding:24px 28px 8px"><img src="${SITE_URL}/images/marca/logo.png" alt="noreste arq" width="96" style="display:block"></td></tr>
<tr><td style="padding:12px 28px 4px;font-size:18px;font-weight:bold">${escapar(titulo)}</td></tr>
${parrafos.map((p) => `<tr><td style="padding:6px 28px;font-size:14px;line-height:1.5;color:#181818">${escapar(p)}</td></tr>`).join("")}
${boton ? `<tr><td style="padding:18px 28px 6px"><a href="${boton.url}" style="display:inline-block;background:#181818;color:#ffffff;text-decoration:none;font-size:14px;padding:10px 18px">${escapar(boton.texto)}</a></td></tr>` : ""}
<tr><td style="padding:22px 28px 24px;font-size:11px;color:#555555">Aviso automático del panel del estudio · noreste arq</td></tr>
</table></td></tr></table></body></html>`;
}

/** Envía un aviso. Nunca lanza: si falla, lo registra y sigue (un mail no puede frenar el trabajo). */
export async function enviarCorreo(correo: Correo): Promise<boolean> {
  const para = correo.para?.trim();
  if (!para) return false;

  const clave = process.env.RESEND_API_KEY;
  if (!clave) {
    console.info(`[correo] sin RESEND_API_KEY, no se envía «${correo.asunto}» a ${para}`);
    return false;
  }
  const soloA = (process.env.CORREO_SOLO_A ?? "").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);
  if (soloA.length && !soloA.includes(para.toLowerCase())) {
    console.info(`[correo] modo prueba: no se envía a ${para}`);
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${clave}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.CORREO_DE || "noreste arq <avisos@norestearq.com>",
        to: [para],
        ...(correo.responderA ? { reply_to: correo.responderA } : {}),
        subject: correo.asunto,
        html: plantilla(correo),
        text: [correo.titulo, ...correo.parrafos, correo.boton ? `${correo.boton.texto}: ${correo.boton.url}` : ""].join("\n\n"),
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      console.error(`[correo] Resend respondió ${res.status}: ${await res.text()}`);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[correo] error al enviar", e);
    return false;
  }
}
