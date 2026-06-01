import { HomeExperience } from "@/components/home-experience";
import { listProjects } from "@/lib/api";
import type { Project } from "@/lib/types";

export default async function HomePage() {
  let projects: Project[] = [];

  try {
    projects = await listProjects();
  } catch {
    projects = [];
  }

  return <HomeExperience projects={projects} />;
}
