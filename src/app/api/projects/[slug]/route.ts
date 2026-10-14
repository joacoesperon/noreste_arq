import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { authorizeApi } from '@/lib/auth';
import { clearProjectsCache } from '@/lib/projects';

// Deshabilitar caché de rutas API
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type RouteParams = { params: Promise<{ slug: string }> };

// GET - Obtener un proyecto por slug desde Supabase
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { supabase, error: authError } = await authorizeApi();
  if (authError) return authError;

  try {
    const { slug } = await params;
    
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (fetchError || !project) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
    }
    
    const response = NextResponse.json(project);
    // Headers para evitar caché en el navegador y CDN
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  } catch (_error) {
    return NextResponse.json({ error: 'Error al leer proyecto' }, { status: 500 });
  }
}

// PUT - Actualizar proyecto en Supabase
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { supabase, error: authError } = await authorizeApi();
  if (authError) return authError;

  try {
    const { slug } = await params;
    const updatedData = await request.json();
    
    // Limpiamos el objeto para enviar solo lo que la base de datos espera
    // Evitamos enviar id, created_at o campos que no deben cambiar
    const { id: _id, created_at: _created_at, slug: _bodySlug, ...dataToUpdate } = updatedData;

    const { data, error: updateError } = await supabase
      .from('projects')
      .update(dataToUpdate)
      .eq('slug', slug)
      .select()
      .single();
    
    if (updateError) {
      console.error('Supabase Update Error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }
    
    clearProjectsCache();
    revalidatePath(`/projects/${slug}`);
    revalidatePath('/');
    revalidatePath('/indice');
    revalidatePath('/info');

    return NextResponse.json({ success: true, project: data });
  } catch (error) {
    console.error('Error updating project:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al actualizar proyecto';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE - Eliminar proyecto de Supabase
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { supabase, error: authError } = await authorizeApi();
  if (authError) return authError;

  try {
    const { slug } = await params;
    
    const { data, error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('slug', slug)
      .select()
      .single();
    
    if (deleteError) {
      console.error('Supabase Delete Error:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }
    
    clearProjectsCache();
    revalidatePath(`/projects/${slug}`);
    revalidatePath('/');
    revalidatePath('/indice');
    revalidatePath('/info');

    return NextResponse.json({ success: true, deleted: data });
  } catch (error) {
    console.error('Error deleting project:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al eliminar proyecto';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
