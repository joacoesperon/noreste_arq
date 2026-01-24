import HomeHeader from "@/components/HomeHeader";
import Footer from "@/components/Footer";
import HomeFeed from "@/components/HomeFeed";
import { getProjectsShuffled, getProjectCoverImage } from "@/lib/projects";

export default function Home() {
  const projects = getProjectsShuffled();
  
  // Preparar datos para el feed
  const projectsForFeed = projects.map(p => ({
    slug: p.slug,
    title: p.title,
    image: getProjectCoverImage(p),
  }));

  // Logo para la presentación inicial
  // Coloca tu logo en: public/images/logo.webp (o .svg, .png)
  const logoImage = "/images/logo.svg";

  return (
    <>
      <HomeHeader />
      <main className="main clearfix wrapper">
        <HomeFeed projects={projectsForFeed} logoImage={logoImage} />
      </main>
      <Footer />
    </>
  );
}
