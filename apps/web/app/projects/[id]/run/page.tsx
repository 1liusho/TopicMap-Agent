import Link from "next/link";

import { PageShell } from "@/components/page-shell";
import { RunMonitor } from "@/components/run-monitor";
import { getProject } from "@/lib/api";

export default async function RunPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);

  return (
    <PageShell
      title={project.topic}
      subtitle={`研究目标：${project.goal || "尚未填写"}。这一页负责展示运行阶段、核心统计和下一步跳转。`}
      actions={
        <Link
          href={`/projects/${project.id}/papers`}
          className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:border-slate-400"
        >
          直达论文池
        </Link>
      }
    >
      <section className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-panel">
          <h2 className="text-lg font-semibold text-ink">任务配置</h2>
          <dl className="mt-5 grid gap-4 text-sm">
            <Field label="Project ID" value={project.id} />
            <Field label="学科方向" value={project.domain || "未指定"} />
            <Field
              label="年份范围"
              value={`${project.yearStart || "-"} 至 ${project.yearEnd || "-"}`}
            />
            <Field label="检索源" value={project.sources.join(", ")} />
          </dl>
        </article>

        <RunMonitor projectId={project.id} />
      </section>
    </PageShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900">{value}</dd>
    </div>
  );
}

