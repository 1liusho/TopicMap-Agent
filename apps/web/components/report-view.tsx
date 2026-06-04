import Link from "next/link";

import { AssistantPanel } from "@/components/assistant-panel";
import { SiteHeader } from "@/components/site-header";
import { Project, ReportPayload } from "@/lib/types";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_RESEARCH_API_BASE_URL ?? "http://127.0.0.1:8000";

export function ReportView({
  project,
  report
}: {
  project: Project;
  report: ReportPayload;
}) {
  const researchGraphHref = project.topic.trim()
    ? `/research-graph?topic=${encodeURIComponent(project.topic.trim())}`
    : "/research-graph";

  return (
    <div className="min-h-screen">
      <SiteHeader
        active="report"
        initialQuery={project.topic}
        projectId={project.id}
        backHref={researchGraphHref}
        backLabel="返回图谱页"
      />

      <main className="mx-auto max-w-[1320px] px-4 py-8 md:px-8">
        <section className="rounded-[24px] border border-[var(--border2)] bg-white px-6 py-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex rounded-full border border-[rgba(245,158,11,0.18)] bg-[rgba(245,158,11,0.08)] px-3 py-1 text-xs font-semibold text-[var(--amber)]">
                研究报告
              </div>
              <h1 className="text-3xl font-bold text-[var(--text)]">{project.topic}</h1>
              <p className="mt-3 text-sm leading-7 text-[var(--text2)]">{report.summary}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`${apiBaseUrl}/api/projects/${project.id}/exports/markdown`}
                className="rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--text2)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                导出 Markdown
              </Link>
              <Link
                href={`${apiBaseUrl}/api/projects/${project.id}/exports/bibtex`}
                className="rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--text2)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                导出 BibTeX
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.7fr)_minmax(320px,0.3fr)]">
          <article className="rounded-[24px] border border-[var(--border2)] bg-white px-6 py-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
            <div className="grid gap-8">
              {report.sections.map((section) => (
                <section key={section.id}>
                  <h2 className="text-xl font-semibold text-[var(--text)]">{section.title}</h2>
                  <div className="mt-3 whitespace-pre-wrap text-sm leading-8 text-[var(--text2)]">
                    {section.content}
                  </div>
                </section>
              ))}
            </div>

            <section className="mt-10 border-t border-[var(--border2)] pt-8">
              <h2 className="text-xl font-semibold text-[var(--text)]">研究空白</h2>
              <div className="mt-4 grid gap-3">
                {report.researchGaps.map((gap) => (
                  <div
                    key={gap}
                    className="rounded-2xl border border-[rgba(245,158,11,0.18)] bg-[rgba(245,158,11,0.08)] px-4 py-4 text-sm leading-7 text-[var(--text)]"
                  >
                    {gap}
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-10 border-t border-[var(--border2)] pt-8">
              <h2 className="text-xl font-semibold text-[var(--text)]">引用列表</h2>
              <div className="mt-4 grid gap-3">
                {report.citations.map((citation) => (
                  <article
                    key={citation.paperId}
                    className="rounded-2xl border border-[var(--border2)] bg-[var(--surface2)] px-4 py-4 text-sm leading-7 text-[var(--text2)]"
                  >
                    <div className="font-semibold text-[var(--text)]">{citation.title}</div>
                    <div className="mt-1">
                      {citation.authors.join(", ")} · {citation.year ?? "-"} ·{" "}
                      {citation.venue ?? "Unknown venue"}
                    </div>
                    {citation.doi ? (
                      <div className="mt-1 text-xs text-[var(--text3)]">DOI: {citation.doi}</div>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          </article>

          <aside className="grid gap-6">
            <AssistantPanel
              projectId={project.id}
              title="报告助手"
              suggestions={[
                "把报告总结成三条结论",
                "解释当前研究空白",
                "给我下一步阅读建议"
              ]}
            />

            <article className="rounded-[24px] border border-[var(--border2)] bg-white px-5 py-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
              <h2 className="text-base font-semibold text-[var(--text)]">Markdown 预览</h2>
              <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-2xl border border-[var(--border2)] bg-[var(--surface2)] px-4 py-4 text-xs leading-6 text-[var(--text2)]">
                {report.markdown}
              </pre>
            </article>
          </aside>
        </section>
      </main>
    </div>
  );
}
