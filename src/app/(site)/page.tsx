import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HomeFeed from "@/components/HomeFeed";
import { getVisibleProjects, getProjectCoverImage } from "@/lib/projects";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  const projects = await getVisibleProjects();
  
  // Preparar datos para el feed
  const projectsForFeed = projects.map(p => ({
    slug: p.slug,
    title: p.title,
    image: getProjectCoverImage(p),
  }));

  return (
    <>
      <Header />
      <main className="main clearfix wrapper">
        <HomeFeed projects={projectsForFeed} />
      </main>
      <Footer />
    </>
  );
}