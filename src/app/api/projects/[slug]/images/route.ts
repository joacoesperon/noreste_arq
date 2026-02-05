import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

type RouteParams = { params: Promise<{ slug: string }> };

// POST - Subir imágenes a un proyecto
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const formData = await request.formData();
    
    const projectDir = path.join(process.cwd(), 'public', 'projects', slug);
    
    // Asegurar que la carpeta existe
    await fs.mkdir(projectDir, { recursive: true });
    
    const uploadedFiles: string[] = [];
    
    // Procesar cada archivo
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        const buffer = Buffer.from(await value.arrayBuffer());
        const filename = value.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filepath = path.join(projectDir, filename);
        
        await fs.writeFile(filepath, buffer);
        uploadedFiles.push(filename);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      files: uploadedFiles,
      message: `${uploadedFiles.length} archivos subidos` 
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    return NextResponse.json({ error: 'Error al subir imágenes' }, { status: 500 });
  }
}

// GET - Listar imágenes de un proyecto
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const projectDir = path.join(process.cwd(), 'public', 'projects', slug);
    
    try {
      const files = await fs.readdir(projectDir);
      const images = files.filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f));
      return NextResponse.json({ images });
    } catch {
      return NextResponse.json({ images: [] });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Error al listar imágenes' }, { status: 500 });
  }
}
