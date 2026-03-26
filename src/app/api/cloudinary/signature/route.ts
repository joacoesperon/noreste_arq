import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  try {
    // Validar autenticación
    const cookieStore = await cookies();
    const session = cookieStore.get("noreste_session");

    console.log("🔐 Verificando autenticación:", {
      hasCookie: !!session,
      cookieValue: session?.value,
      allCookies: cookieStore.getAll().map(c => c.name)
    });

    if (!session || session.value !== "active") {
      console.log("❌ Autenticación falló");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("✅ Autenticación exitosa");

    // Obtener parámetros
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get("folder");

    if (!folder) {
      return NextResponse.json(
        { error: "Folder parameter required" },
        { status: 400 }
      );
    }

    // Generar timestamp
    const timestamp = Math.round(Date.now() / 1000);

    // Parámetros para la firma
    const params: Record<string, string | number> = {
      timestamp,
      folder: `noreste-arq/${folder}`,
    };

    // Crear string para firmar (ordenado alfabéticamente)
    const paramsStr = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join("&");

    // Generar firma usando SHA-256
    const signature = crypto
      .createHash("sha256")
      .update(paramsStr + process.env.CLOUDINARY_API_SECRET)
      .digest("hex");

    // Retornar datos necesarios para el upload
    return NextResponse.json({
      timestamp,
      signature,
      api_key: process.env.CLOUDINARY_API_KEY,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      folder: params.folder,
    });
  } catch (error) {
    console.error("Error generating signature:", error);
    return NextResponse.json(
      { error: "Error generating signature" },
      { status: 500 }
    );
  }
}
