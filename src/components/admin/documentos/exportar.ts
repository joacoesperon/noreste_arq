"use client";

import { createElement } from "react";
import type { DocumentoResuelto } from "@/lib/documentos/bloques";

function nombreArchivo(nombre: string) {
  return nombre.replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, " ").trim() || "documento";
}

function guardar(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// react-pdf y docx son pesados: se cargan recién al descargar.

export async function descargarPdf(documento: DocumentoResuelto, nombre: string) {
  const [{ pdf }, { DocumentoPdf }] = await Promise.all([import("@react-pdf/renderer"), import("./pdf")]);
  const blob = await pdf(createElement(DocumentoPdf, { documento }) as Parameters<typeof pdf>[0]).toBlob();
  guardar(blob, `${nombreArchivo(nombre)}.pdf`);
}

export async function descargarDocx(documento: DocumentoResuelto, nombre: string) {
  const [{ Packer }, { documentoDocx }] = await Promise.all([import("docx"), import("./docx")]);
  const blob = await Packer.toBlob(documentoDocx(documento));
  guardar(blob, `${nombreArchivo(nombre)}.docx`);
}
