import { RunJourney } from "@/components/run-journey";
import { getProject } from "@/lib/api";

export default async function RunPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);

  return <RunJourney project={project} />;
}
