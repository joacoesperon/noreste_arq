"use client";

import { createElement } from "react";
import type { DocumentoResuelto } from "@/lib/documentos/bloques";
import type { Membrete } from "@/lib/documentos/estudio";
import { hoyAR } from "@/lib/tareas/semanas";

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

async function imagen(ruta: string) {
  try {
    const r = await fetch(ruta);
    return r.ok ? await r.arrayBuffer() : null;
  } catch {
    return null;
  }
}

// react-pdf y docx son pesados: se cargan recién al descargar.

export async function descargarPdf(documento: DocumentoResuelto, nombre: string, membrete: Membrete) {
  const [{ pdf }, { DocumentoPdf }] = await Promise.all([import("@react-pdf/renderer"), import("./pdf")]);
  const elemento = createElement(DocumentoPdf, { documento, membrete, base: window.location.origin, fecha: documento.fecha ?? hoyAR() });
  const blob = await pdf(elemento as Parameters<typeof pdf>[0]).toBlob();
  guardar(blob, `${nombreArchivo(nombre)}.pdf`);
}

export async function descargarDocx(documento: DocumentoResuelto, nombre: string, membrete: Membrete) {
  const [{ Packer }, { documentoDocx }, logo, isotipo] = await Promise.all([
    import("docx"),
    import("./docx"),
    imagen("/images/marca/logo.png"),
    imagen("/images/marca/isotipo.png"),
  ]);
  const blob = await Packer.toBlob(documentoDocx(documento, membrete, documento.fecha ?? hoyAR(), { logo, isotipo }));
  guardar(blob, `${nombreArchivo(nombre)}.docx`);
}
