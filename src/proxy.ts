import { NextResponse, type NextRequest } from "next/server";
import { updateSession, withSessionCookies } from "@/lib/supabase/proxy";

const LOGIN_PATH = "/admin/login";

/**
 * Todo /admin y /api requiere sesión. El control de que el usuario sea del
 * estudio (tabla `staff`) lo hacen el layout del panel, las API y las políticas RLS.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  // Tareas programadas de Vercel: se autentican con CRON_SECRET en la propia ruta.
  if (pathname.startsWith("/api/cron/")) return NextResponse.next();

  const { response, userId } = await updateSession(request);

  if (pathname === LOGIN_PATH) {
    if (userId) {
      return withSessionCookies(response, NextResponse.redirect(new URL("/admin", request.url)));
    }
    return response;
  }

  if (!userId) {
    if (pathname.startsWith("/api/")) {
      return withSessionCookies(
        response,
        NextResponse.json({ error: "No autorizado" }, { status: 401 })
      );
    }
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set("next", pathname + search);
    return withSessionCookies(response, NextResponse.redirect(loginUrl));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
