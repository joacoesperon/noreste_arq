import type { Metadata } from "next";
import { ProjectsManager } from "./projects-manager";

export const metadata: Metadata = { title: "Sitio web" };

export default function SitioWebPage() {
  return <ProjectsManager />;
}
