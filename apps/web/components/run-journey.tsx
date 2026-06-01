"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Project, ProjectRun } from "@/lib/types";
import { getLatestRun, startProjectRun } from "@/lib/api";
import { SiteHeader } from "@/components/site-header";

const stages = [
  { id: "query_planning", label: "检索文献" },
  { id: "searching", label: "分析关联" },
  { id: "deduping", label: "构建图谱" },
  { id: "completed", label: "整理结果" }
];

export function RunJourney({ project }: { project: Project }) {
  const [run, setRun] = useState<ProjectRun | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function boot() {
      try {
        await startProjectRun(project.id);
      } catch {
        // allow polling to continue if the run already exists
      }
      await poll();
    }

    async function poll() {
      try {
        const nextRun = await getLatestRun(project.id);
        if (!active) {
          return;
        }
        setRun(nextRun);
        setBooting(false);

        if (nextRun.status === "running") {
          timer = setTimeout(poll, 1800);
        }
      } catch {
        if (!active) {
          return;
        }
        setBooting(false);
      }
    }

    void boot();

    return () => {
      active = false;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [project.id]);

  const stageIndex = useMemo(() => {
    if (!run) {
      return 0;
    }
    return Math.max(
      stages.findIndex((stage) => stage.id === run.stage),
      0
    );
  }, [run]);

  const resultCount = Number(run?.stats.paperCount ?? 0);
  const ready = run?.status === "completed";

  return (
    <div className="min-h-screen">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[30%] top-[-100px] h-[450px] w-[450px] rounded-full bg-[#e8e4ff] opacity-70 blur-[130px]" />
      </div>

      <SiteHeader
        initialQuery={project.topic}
        backHref="/"
        backLabel="返回首页"
        projectId={project.id}
      />

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-60px)] max-w-[760px] flex-col items-center justify-center px-6 py-14">
        {!ready ? (
          <>
            <div className="relative mb-12 h-24 w-24">
              <svg viewBox="0 0 96 96" className="h-24 w-24 -rotate-90">
                <defs>
                  <linearGradient id="run-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6c5ce7" />
                    <stop offset="100%" stopColor="#8b7cf7" />
                  </linearGradient>
                </defs>
                <circle cx="48" cy="48" r="40" fill="none" stroke="#e4e6ed" strokeWidth="3" />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  fill="none"
                  stroke="url(#run-grad)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="251"
                  strokeDashoffset="120"
                />
              </svg>
              <div className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[linear-gradient(135deg,#6c5ce7,#8b7cf7)] shadow-[0_0_0_8px_rgba(108,92,231,0.08)]" />
            </div>

            <p className="text-center text-xl font-semibold text-[var(--text)]">
              正在搜索 "<span className="text-[var(--accent)]">{project.topic}</span>"
            </p>
            <p className="mt-2 flex items-center gap-1 text-sm text-[var(--text3)]">
              研脉正在为您检索相关文献
              <span className="inline-flex gap-1">
                <span className="h-1 w-1 rounded-full bg-[var(--text3)]" />
                <span className="h-1 w-1 rounded-full bg-[var(--text3)]" />
                <span className="h-1 w-1 rounded-full bg-[var(--text3)]" />
              </span>
            </p>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-5">
              {stages.map((stage, index) => {
                const completed = run?.status === "completed" || index < stageIndex;
                const active = !completed && index === stageIndex;
                return (
                  <div
                    key={stage.id}
                    className={`flex items-center gap-2 text-xs font-medium transition ${
                      completed
                        ? "text-[var(--teal)]"
                        : active
                          ? "text-[var(--accent)]"
                          : "text-[var(--text3)]"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        completed
                          ? "bg-[var(--teal)]"
                          : active
                            ? "bg-[var(--accent)] shadow-[0_0_0_8px_rgba(108,92,231,0.08)]"
                            : "bg-[var(--text3)]"
                      }`}
                    />
                    {stage.label}
                  </div>
                );
              })}
            </div>

            <div className="mt-12 grid w-full gap-3 sm:grid-cols-4">
              <MetricCard label="检索式" value={String(run?.stats.queryCount ?? 0)} />
              <MetricCard label="初始候选" value={String(run?.stats.retrievedCount ?? 0)} />
              <MetricCard label="去重后" value={String(run?.stats.dedupedCount ?? 0)} />
              <MetricCard label="论文池" value={String(run?.stats.paperCount ?? 0)} />
            </div>

            <div className="mt-10 rounded-2xl border border-[var(--border2)] bg-white/80 px-5 py-4 text-sm text-[var(--text2)] shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
              {booting
                ? "正在初始化任务状态..."
                : run?.status === "running"
                  ? `当前阶段：${stages[stageIndex]?.label || "处理中"}`
                  : "正在准备结果页..."}
            </div>
          </>
        ) : (
          <section className="w-full animate-[fade-up_0.5s_ease]">
            <div className="border-b border-[var(--border)] pb-10 text-center">
              <h2 className="text-[28px] font-semibold text-[var(--text)]">
                找到 <span className="font-bold text-[var(--accent)]">{resultCount}</span> 篇相关文献
              </h2>
              <p className="mt-2 text-sm text-[var(--text3)]">请选择你要查看的结果视图</p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              <ActionCard
                href={`/projects/${project.id}/papers`}
                accent="purple"
                title="文献目录"
                description="按相关度查看论文池，支持保留、剔除、排序和快速筛选。"
              />
              <ActionCard
                href={`/projects/${project.id}/graph`}
                accent="teal"
                title="知识图谱"
                description="围绕方法、指标、问题与论文关系查看当前研究脉络。"
              />
              <ActionCard
                href={`/projects/${project.id}/report`}
                accent="amber"
                title="研究报告"
                description="查看摘要、技术路线、研究空白与引用清单，并导出结果。"
              />
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border2)] bg-white px-4 py-4 text-center shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
      <div className="text-xs uppercase tracking-[0.08em] text-[var(--text3)]">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-[var(--text)]">{value}</div>
    </div>
  );
}

function ActionCard({
  href,
  accent,
  title,
  description
}: {
  href: string;
  accent: "purple" | "teal" | "amber";
  title: string;
  description: string;
}) {
  const tone =
    accent === "purple"
      ? "border-[rgba(108,92,231,0.15)] before:bg-[linear-gradient(90deg,#6c5ce7,#8b7cf7)] text-[var(--accent)] bg-[var(--purple-bg)]"
      : accent === "teal"
        ? "border-[rgba(16,185,129,0.15)] before:bg-[linear-gradient(90deg,#10b981,#34d399)] text-[var(--teal)] bg-[rgba(16,185,129,0.08)]"
        : "border-[rgba(245,158,11,0.15)] before:bg-[linear-gradient(90deg,#f59e0b,#fbbf24)] text-[var(--amber)] bg-[rgba(245,158,11,0.08)]";

  return (
    <Link
      href={href}
      className="group relative flex flex-col items-center gap-4 overflow-hidden rounded-[20px] border border-[var(--border2)] bg-white px-7 py-10 text-center transition hover:-translate-y-1.5 hover:shadow-[0_16px_40px_rgba(0,0,0,0.06)] before:absolute before:left-0 before:right-0 before:top-0 before:h-0.5 before:opacity-0 before:transition group-hover:before:opacity-100"
    >
      <div className={`flex h-[68px] w-[68px] items-center justify-center rounded-[18px] ${tone}`}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          {accent === "purple" ? (
            <>
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              <line x1="8" y1="7" x2="16" y2="7" />
              <line x1="8" y1="11" x2="16" y2="11" />
              <line x1="8" y1="15" x2="12" y2="15" />
            </>
          ) : accent === "teal" ? (
            <>
              <circle cx="12" cy="5" r="2.5" />
              <circle cx="5" cy="12" r="2.5" />
              <circle cx="19" cy="12" r="2.5" />
              <circle cx="12" cy="19" r="2.5" />
              <line x1="12" y1="7.5" x2="7.3" y2="10.2" />
              <line x1="12" y1="7.5" x2="16.7" y2="10.2" />
              <line x1="7.3" y1="13.8" x2="10.5" y2="17" />
              <line x1="16.7" y1="13.8" x2="13.5" y2="17" />
            </>
          ) : (
            <>
              <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
              <polyline points="14 3 14 8 19 8" />
              <line x1="9" y1="13" x2="15" y2="13" />
              <line x1="9" y1="17" x2="15" y2="17" />
            </>
          )}
        </svg>
      </div>
      <h3 className="text-lg font-bold text-[var(--text)]">{title}</h3>
      <p className="text-sm leading-7 text-[var(--text3)]">{description}</p>
      <span className="text-xs font-semibold text-[var(--text2)] transition group-hover:text-[var(--text)]">
        进入查看
      </span>
    </Link>
  );
}
