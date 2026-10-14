import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  getProjectBySlug,
  getAdjacentProjects,
  getProjectImages
} from "@/lib/projects";
import ProjectClient from "./ProjectClient";

// Forzar renderizado dinámico - nunca cachear esta página
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const { prev, next } = await getAdjacentProjects(slug);
  const media = getProjectImages(project);

  return (
    <>
      <Header />
      <main className="main clearfix wrapper">
        <div className="single projects">
          <ProjectClient 
            project={project} 
            media={media}
            prevProject={prev}
            nextProject={next}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
