import Link from "next/link";

import { AssistantPanel } from "@/components/assistant-panel";
import { GraphWorkbench } from "@/components/graph-workbench";
import { PageShell } from "@/components/page-shell";
import { getGraph, getProject } from "@/lib/api";

export default async function GraphPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, graph] = await Promise.all([getProject(id), getGraph(id)]);

  return (
    <PageShell
      title={`${project.topic} 图谱页`}
      subtitle="现在这个页面已经接上后端图谱数据，包含左侧过滤、中间节点关系、右侧详情面板。后续再升级成 React Flow 画布。"
      actions={
        <Link
          href={`/projects/${project.id}/report`}
          className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          前往报告页
        </Link>
      }
    >
      <GraphWorkbench graph={graph} />
      <AssistantPanel
        projectId={project.id}
        title="图谱助手"
        suggestions={["解释图谱里最重要的关系", "我该先校正哪些边", "图谱说明了哪些技术路线"]}
      />
    </PageShell>
  );
}
