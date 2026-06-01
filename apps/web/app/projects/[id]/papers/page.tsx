import { PapersDirectory } from "@/components/papers-directory";
import { getPapers, getProject } from "@/lib/api";

export default async function PapersPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, papers] = await Promise.all([getProject(id), getPapers(id)]);

  return <PapersDirectory project={project} initialPapers={papers} />;
}
