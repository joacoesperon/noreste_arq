import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const PROJECTS_FILE = path.join(process.cwd(), 'content', 'projects.json');

type RouteParams = { params: Promise<{ slug: string }> };

// GET - Obtener un proyecto por slug
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const data = await fs.readFile(PROJECTS_FILE, 'utf-8');
    const { projects } = JSON.parse(data);
    
    const project = projects.find((p: { slug: string }) => p.slug === slug);
    
    if (!project) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
    }
    
    return NextResponse.json(project);
  } catch (error) {
    return NextResponse.json({ error: 'Error al leer proyecto' }, { status: 500 });
  }
}

// PUT - Actualizar proyecto
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const updatedData = await request.json();
    
    const data = await fs.readFile(PROJECTS_FILE, 'utf-8');
    const { projects } = JSON.parse(data);
    
    const index = projects.findIndex((p: { slug: string }) => p.slug === slug);
    
    if (index === -1) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
    }
    
    // Actualizar proyecto manteniendo el slug original
    projects[index] = { ...projects[index], ...updatedData, slug };
    
    await fs.writeFile(PROJECTS_FILE, JSON.stringify({ projects }, null, 2), 'utf-8');
    
    return NextResponse.json({ success: true, project: projects[index] });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Error al actualizar proyecto' }, { status: 500 });
  }
}

// DELETE - Eliminar proyecto
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const data = await fs.readFile(PROJECTS_FILE, 'utf-8');
    const { projects } = JSON.parse(data);
    
    const index = projects.findIndex((p: { slug: string }) => p.slug === slug);
    
    if (index === -1) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
    }
    
    // Eliminar proyecto del array
    const deleted = projects.splice(index, 1)[0];
    
    // Guardar
    await fs.writeFile(PROJECTS_FILE, JSON.stringify({ projects }, null, 2), 'utf-8');
    
    // Opcionalmente eliminar carpeta de imágenes
    const projectImagesDir = path.join(process.cwd(), 'public', 'projects', slug);
    try {
      await fs.rm(projectImagesDir, { recursive: true });
    } catch {
      // Ignorar si la carpeta no existe
    }
    
    return NextResponse.json({ success: true, deleted });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Error al eliminar proyecto' }, { status: 500 });
  }
}
