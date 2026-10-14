import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { authorizeApi } from '@/lib/auth';

// Deshabilitar caché de rutas API
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET - Obtener todos los proyectos desde Supabase
export async function GET() {
  const { supabase, error: authError } = await authorizeApi();
  if (authError) return authError;

  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('order', { ascending: true });

    if (error) throw error;
    
    const response = NextResponse.json({ projects: data });
    // Headers para evitar caché en el navegador y CDN
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Error al leer proyectos' }, { status: 500 });
  }
}

// POST - Crear nuevo proyecto en Supabase
export async function POST(request: NextRequest) {
  const { supabase, error: authError } = await authorizeApi();
  if (authError) return authError;

  try {
    const newProject = await request.json();
    
    // Verificar que no exista un proyecto con el mismo slug
    const { data: existing } = await supabase
      .from('projects')
      .select('slug')
      .eq('slug', newProject.slug)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Ya existe un proyecto con ese slug' }, { status: 400 });
    }
    
    // Insertar proyecto
    // Nota: La creación de carpetas físicas se elimina ya que no funciona en Serverless
    const { data, error } = await supabase
      .from('projects')
      .insert([
        {
          slug: newProject.slug,
          title: newProject.title,
          m2: newProject.m2,
          status: newProject.status,
          year: newProject.year,
          location: newProject.location,
          credits: newProject.credits,
          images: newProject.images || [],
          videos: newProject.videos || [],
          cover: newProject.cover,
          visible: newProject.visible ?? true
        }
      ])
      .select()
      .single();

    if (error) throw error;
    
    revalidatePath(`/projects/${data.slug}`);
    revalidatePath('/');
    revalidatePath('/indice');
    revalidatePath('/info');

    return NextResponse.json({ success: true, project: data });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Error al crear proyecto' }, { status: 500 });
  }
}

// PUT - Actualizar el orden de los proyectos
export async function PUT(request: NextRequest) {
  const { supabase, error: authError } = await authorizeApi();
  if (authError) return authError;

  try {
    const { projects } = await request.json();
    
    if (!Array.isArray(projects)) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    console.log("💾 Actualizando orden de proyectos en Supabase...");
    
    // Actualizar cada proyecto con su nuevo orden
    // Usamos upsert para actualizar múltiples filas basándonos en el slug o ID
    const updates = projects.map((p, index) => ({
      slug: p.slug,
      order: index,
      // Incluimos otros campos necesarios si upsert requiere el objeto completo
      title: p.title,
      year: p.year,
      visible: p.visible
    }));

    const { error } = await supabase
      .from('projects')
      .upsert(updates, { onConflict: 'slug' });

    if (error) throw error;
    
    revalidatePath('/');
    revalidatePath('/indice');
    revalidatePath('/info');
    console.log("✅ Orden actualizado y cache limpiada.");
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating projects order:', error);
    return NextResponse.json({ error: 'Error al actualizar el orden' }, { status: 500 });
  }
}
