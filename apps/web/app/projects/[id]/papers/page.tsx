import Link from "next/link";

import { PageShell } from "@/components/page-shell";
import { PapersTable } from "@/components/papers-table";
import { getPapers, getProject } from "@/lib/api";

export default async function PapersPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, papers] = await Promise.all([getProject(id), getPapers(id)]);

  return (
    <PageShell
      title={`${project.topic} 论文池`}
      subtitle="这里已经接上后端 papers 接口。下一步可以在这个页面加筛选器、手动导入和摘要详情面板。"
      actions={
        <div className="flex items-center gap-3">
          <Link
            href={`/projects/${project.id}/run`}
            className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:border-slate-400"
          >
            返回运行页
          </Link>
          <Link
            href={`/projects/${project.id}/graph`}
            className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            下一步看图谱
          </Link>
        </div>
      }
    >
      <PapersTable projectId={project.id} initialPapers={papers} />
    </PageShell>
  );
}

