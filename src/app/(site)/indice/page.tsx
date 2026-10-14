import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getProjectsSortedByYear, getProjectCoverImage } from "@/lib/projects";
import IndexClient from "./IndexClient";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function IndexPage() {
  const projects = await getProjectsSortedByYear();
  
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
      <main className=  "w-full min-h-[80vh] pt-23.5 pb-12">
        <div className="mx-auto px-4 md:px-8 max-w-400">
          <IndexClient projects={projectsForClient} />
        </div>
      </main>
      <Footer />
    </>
  );
}
