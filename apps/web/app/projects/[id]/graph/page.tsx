import { KnowledgeGraphView } from "@/components/knowledge-graph-view";
import { getGraph, getProject } from "@/lib/api";

export default async function GraphPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, graph] = await Promise.all([getProject(id), getGraph(id)]);

  return <KnowledgeGraphView project={project} graph={graph} />;
}
