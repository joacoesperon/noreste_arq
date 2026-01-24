import { notFound } from "next/navigation";
import Header from "@/components/Header";
import { 
  getProjects, 
  getProjectBySlug, 
  getAdjacentProjects,
  getProjectImages 
} from "@/lib/projects";
import ProjectClient from "./ProjectClient";

// Generar rutas estáticas para todos los proyectos
export async function generateStaticParams() {
  const projects = getProjects();
  return projects.map((project) => ({
    slug: project.slug,
  }));
}

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const { prev, next } = getAdjacentProjects(slug);
  const images = getProjectImages(project);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-bone">
        <ProjectClient 
          project={project} 
          images={images}
          prevProject={prev}
          nextProject={next}
        />
      </main>
    </>
  );
}
