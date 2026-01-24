import Header from "@/components/Header";
import { getProjectsSortedByYear, getProjectCoverImage } from "@/lib/projects";
import IndexClient from "./IndexClient";

export default function IndexPage() {
  const projects = getProjectsSortedByYear();
  
  // Preparar datos para el cliente
  const projectsForClient = projects.map(p => ({
    slug: p.slug,
    title: p.title,
    status: p.status,
    year: p.year,
    image: getProjectCoverImage(p),
  }));

  return (
    <>
      <Header />
      <main className="min-h-screen bg-bone">
        <section className="pt-16 pb-0">
          <div className="px-4">
            <IndexClient projects={projectsForClient} />
          </div>
        </section>
      </main>
    </>
  );
}
