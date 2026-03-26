import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { deleteFromCloudinary } from '@/lib/cloudinary';
import type { Project } from '@/lib/projects';

// Deshabilitar caché de rutas API
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type RouteParams = { params: Promise<{ slug: string }> };

// DELETE - Eliminar un archivo de Cloudinary y de Supabase
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('filename'); // Ahora recibimos la URL completa
    const type = searchParams.get('type') || 'images';

    if (!fileUrl) return NextResponse.json({ error: 'URL de archivo requerida' }, { status: 400 });

    // 1. Extraer public_id de la URL para borrar en Cloudinary
    // Formato típico: .../noreste-arq/slug/public_id.jpg
    const parts = fileUrl.split('/');
    const lastPart = parts[parts.length - 1];
    const folderPart = parts[parts.length - 2];
    const rootPart = parts[parts.length - 3];
    const publicId = `${rootPart}/${folderPart}/${lastPart.split('.')[0]}`;

    await deleteFromCloudinary(publicId);

    // 2. Actualizar Supabase
    const { data: project } = await supabase
      .from('projects')
      .select('images, videos, cover')
      .eq('slug', slug)
      .single();

    if (project) {
      const typedProject = project as Project;
      const field = type === 'videos' ? 'videos' : 'images';
      const updatedFiles = (typedProject[field] || []).filter((f: string) => f !== fileUrl);
      
      const updateData: Partial<Project> = { [field]: updatedFiles };
      
      // Si era la portada, resetear
      if (typedProject.cover === fileUrl) {
        updateData.cover = updatedFiles[0] || '';
      }
      
      await supabase.from('projects').update(updateData).eq('slug', slug);
    }

    revalidatePath(`/projects/${slug}`);
    revalidatePath('/');
    revalidatePath('/indice');

    return NextResponse.json({ success: true });
  } catch (_error) {
    console.error('Error deleting file:', _error);
    return NextResponse.json({ error: 'Error al eliminar archivo' }, { status: 500 });
  }
}
