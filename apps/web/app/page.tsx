import Link from "next/link";

import { PageShell } from "@/components/page-shell";
import { StatusBadge } from "@/components/status-badge";
import { listProjects } from "@/lib/api";
import type { Project } from "@/lib/types";

export default async function HomePage() {
  let projects: Project[] = [];
  let apiError: string | null = null;

  try {
    projects = await listProjects();
  } catch (caught) {
    apiError = caught instanceof Error ? caught.message : "后端暂不可用。";
  }

  return (
    <PageShell
      title="科研助手工作台"
      subtitle="这一版先把 Website -> API -> Mock Pipeline 跑通，后面再把真实检索与 OpenClaw 对话桥接接进来。"
      actions={
        <Link
          href="/projects/new"
          className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          新建研究任务
        </Link>
      }
    >
      <section className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-panel">
          <h2 className="text-lg font-semibold text-ink">当前架构</h2>
          <div className="mt-5 grid gap-3">
            {[
              "前端网站负责配置任务、展示运行状态和论文池。",
              "FastAPI 负责项目状态、Query Planner 和任务编排。",
              "Mock pipeline 先承担演示流，后续替换为真实检索与抽取。",
              "OpenClaw 下一步通过单独桥接接口接入同一后端。"
            ].map((item) => (
              <div
                key={item}
                className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700"
              >
                {item}
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-panel">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-ink">最近项目</h2>
            <StatusBadge tone={apiError ? "warning" : "neutral"}>
              {apiError ? "等待后端" : `${projects.length} 个项目`}
            </StatusBadge>
          </div>

          {apiError ? (
            <p className="mt-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
              还没有连上 FastAPI。先启动 `services/api`，然后刷新这个页面。
            </p>
          ) : projects.length === 0 ? (
            <p className="mt-5 rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm leading-6 text-slate-600">
              目前还没有项目。可以先创建一个 Fabry-Perot cavity antenna 演示任务。
            </p>
          ) : (
            <div className="mt-5 grid gap-3">
              {projects.slice(0, 6).map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}/run`}
                  className="rounded-md border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-slate-300 hover:bg-white"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-950">
                        {project.topic}
                      </div>
                      <div className="mt-1 text-sm text-slate-600">
                        {project.domain || "未指定学科方向"}
                      </div>
                    </div>
                    <StatusBadge
                      tone={
                        project.status === "completed"
                          ? "success"
                          : project.status === "running"
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {project.status}
                    </StatusBadge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </article>
      </section>
    </PageShell>
  );
}
