import Header from "@/components/Header";
import Footer from "@/components/Footer";
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
      <main className="main clearfix wrapper">
        <div className="page projects">
          <section className="section feed content pt-3 pb-0">
            <div className="container">
              <IndexClient projects={projectsForClient} />
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
