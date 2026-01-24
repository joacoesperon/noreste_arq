import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Slideshow from "@/components/Slideshow";
import { getProjectsShuffled, getProjectCoverImage } from "@/lib/projects";

export default function Home() {
  const projects = getProjectsShuffled();
  
  // Preparar datos para el slideshow
  const projectsForSlideshow = projects.map(p => ({
    slug: p.slug,
    title: p.title,
    image: getProjectCoverImage(p),
  }));

  return (
    <>
      <Header />
      <main className="min-h-screen bg-bone">
        <Hero />
        <Slideshow projects={projectsForSlideshow} />
      </main>
    </>
  );
}
