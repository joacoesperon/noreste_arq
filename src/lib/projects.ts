import fs from 'fs';
import path from 'path';

export type ProjectCredits = {
  proyecto: string;
  equipo: string;
  fotografias: string;
};

export type Project = {
  slug: string;
  title: string;
  m2: number;
  status: "Construido" | "Proyecto";
  year: number;
  location: string;
  credits: ProjectCredits;
  exteriorImages: string[];
  interiorImages: string[];
  coverImage?: string;
};

// Leer proyectos desde el JSON
export function getProjects(): Project[] {
  const filePath = path.join(process.cwd(), 'content', 'projects.json');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(fileContents);
  return data.projects;
}

// Obtener proyectos ordenados por año (descendente)
export function getProjectsSortedByYear(): Project[] {
  const projects = getProjects();
  return projects.sort((a, b) => b.year - a.year);
}

// Obtener proyectos en orden pseudo-aleatorio consistente
export function getProjectsShuffled(): Project[] {
  const projects = getProjects();
  
  // Usamos una función hash simple basada en los slugs para generar orden consistente
  const hashString = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  };

  // Crear seed basado en todos los slugs concatenados
  const seed = hashString(projects.map(p => p.slug).join(''));
  
  // Shuffle determinístico usando el seed
  const shuffled = [...projects];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = (seed + i * 31) % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

// Obtener un proyecto por slug
export function getProjectBySlug(slug: string): Project | undefined {
  const projects = getProjects();
  return projects.find(p => p.slug === slug);
}

// Obtener proyecto anterior y siguiente (para navegación)
export function getAdjacentProjects(slug: string): { prev: Project | null; next: Project | null } {
  const projects = getProjectsSortedByYear();
  const currentIndex = projects.findIndex(p => p.slug === slug);
  
  return {
    prev: currentIndex > 0 ? projects[currentIndex - 1] : null,
    next: currentIndex < projects.length - 1 ? projects[currentIndex + 1] : null,
  };
}

// Obtener la imagen de portada de un proyecto
export function getProjectCoverImage(project: Project): string {
  // Primero intentamos usar cover.jpg, si no existe usamos la primera imagen exterior
  const basePath = `/projects/${project.slug}`;
  
  // Por defecto usamos la primera imagen exterior como cover
  if (project.exteriorImages.length > 0) {
    return `${basePath}/exterior/${project.exteriorImages[0]}`;
  }
  
  // Fallback a imagen placeholder
  return 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=80';
}

// Obtener todas las imágenes de un proyecto (exterior primero, luego interior)
export function getProjectImages(project: Project): { src: string; type: 'exterior' | 'interior' }[] {
  const basePath = `/projects/${project.slug}`;
  const images: { src: string; type: 'exterior' | 'interior' }[] = [];
  
  // Primero exterior
  project.exteriorImages.forEach(img => {
    images.push({ src: `${basePath}/exterior/${img}`, type: 'exterior' });
  });
  
  // Luego interior
  project.interiorImages.forEach(img => {
    images.push({ src: `${basePath}/interior/${img}`, type: 'interior' });
  });
  
  return images;
}
