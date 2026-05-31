import Link from "next/link";

import { AssistantPanel } from "@/components/assistant-panel";
import { PageShell } from "@/components/page-shell";
import { getProject, getReport } from "@/lib/api";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_RESEARCH_API_BASE_URL ?? "http://127.0.0.1:8000";

export default async function ReportPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, report] = await Promise.all([getProject(id), getReport(id)]);

  return (
    <PageShell
      title={`${project.topic} 报告页`}
      subtitle="报告页现在已经接上 mock 报告数据，包含分节内容、研究空白、引用列表和导出入口。"
      actions={
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`${apiBaseUrl}/api/projects/${project.id}/exports/markdown`}
            className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:border-slate-400"
          >
            导出 Markdown
          </Link>
          <Link
            href={`${apiBaseUrl}/api/projects/${project.id}/exports/bibtex`}
            className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:border-slate-400"
          >
            导出 BibTeX
          </Link>
          <Link
            href={`/projects/${project.id}/papers`}
            className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            返回论文池
          </Link>
        </div>
      }
    >
      <section className="grid gap-6 lg:grid-cols-[minmax(0,0.68fr)_minmax(320px,0.32fr)]">
        <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-panel">
          <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-700">
            {report.summary}
          </div>

          <div className="mt-6 grid gap-5">
            {report.sections.map((section) => (
              <section key={section.id}>
                <h2 className="text-lg font-semibold text-ink">{section.title}</h2>
                <div className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {section.content}
                </div>
              </section>
            ))}
          </div>

          <section className="mt-8">
            <h2 className="text-lg font-semibold text-ink">研究空白</h2>
            <div className="mt-3 grid gap-3">
              {report.researchGaps.map((gap) => (
                <div
                  key={gap}
                  className="rounded-md border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-900"
                >
                  {gap}
                </div>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-lg font-semibold text-ink">引用列表</h2>
            <div className="mt-3 grid gap-3">
              {report.citations.map((citation) => (
                <article
                  key={citation.paperId}
                  className="rounded-md border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-700"
                >
                  <div className="font-medium text-slate-900">{citation.title}</div>
                  <div className="mt-1">
                    {citation.authors.join(", ")} · {citation.year ?? "-"} ·{" "}
                    {citation.venue ?? "Unknown venue"}
                  </div>
                  {citation.doi ? (
                    <div className="mt-1 text-xs text-slate-500">DOI: {citation.doi}</div>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        </article>

        <div className="grid gap-6">
          <AssistantPanel
            projectId={project.id}
            title="报告助手"
            suggestions={["帮我解释研究空白", "把报告总结成组会提纲", "我下一步该补哪些论文"]}
          />
          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
            <h2 className="text-base font-semibold text-ink">Markdown 预览</h2>
            <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-md border border-slate-200 bg-slate-50 px-4 py-4 text-xs leading-6 text-slate-700">
              {report.markdown}
            </pre>
          </article>
        </div>
      </section>
    </PageShell>
  );
}
