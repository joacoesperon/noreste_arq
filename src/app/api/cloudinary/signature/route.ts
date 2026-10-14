import { NextRequest, NextResponse } from "next/server";
import { authorizeApi } from "@/lib/auth";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  const { error: authError } = await authorizeApi();
  if (authError) return authError;

  try {
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
