"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { apiFetch } from "@/lib/api";
import { ProjectRun } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";

const stages = [
  { id: "query_planning", label: "规划检索式" },
  { id: "searching", label: "多源检索" },
  { id: "deduping", label: "去重与排序" },
  { id: "completed", label: "生成论文池" }
];

type RunMonitorProps = {
  projectId: string;
};

export function RunMonitor({ projectId }: RunMonitorProps) {
  const [run, setRun] = useState<ProjectRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function boot() {
      try {
        await apiFetch<ProjectRun>(`/api/projects/${projectId}/run`, {
          method: "POST"
        });
        await poll();
      } catch (caught) {
        if (active) {
          setError(caught instanceof Error ? caught.message : "任务启动失败。");
          setLoading(false);
        }
      }
    }

    async function poll() {
      try {
        const nextRun = await apiFetch<ProjectRun>(
          `/api/projects/${projectId}/runs/latest`
        );

        if (!active) {
          return;
        }

        setRun(nextRun);
        setLoading(false);
        setError(null);

        if (nextRun.status === "running") {
          timer = setTimeout(poll, 2000);
        }
      } catch (caught) {
        if (active) {
          setError(caught instanceof Error ? caught.message : "获取运行状态失败。");
          setLoading(false);
        }
      }
    }

    void boot();

    return () => {
      active = false;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [projectId]);

  const stageIndex = useMemo(() => {
    if (!run) {
      return 0;
    }
    return Math.max(
      stages.findIndex((stage) => stage.id === run.stage),
      0
    );
  }, [run]);

  return (
    <div className="grid gap-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-ink">任务运行状态</h2>
            <p className="mt-1 text-sm text-steel">
              当前阶段由 mock pipeline 驱动，后续会替换为真实检索和抽取流程。
            </p>
          </div>

          {run ? (
            <StatusBadge tone={run.status === "completed" ? "success" : "warning"}>
              {run.status === "completed" ? "已完成" : "运行中"}
            </StatusBadge>
          ) : null}
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-slate-600">正在启动任务...</p>
        ) : error ? (
          <p className="mt-6 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : run ? (
          <div className="mt-6 grid gap-6">
            <div className="grid gap-3">
              {stages.map((stage, index) => {
                const completed = index < stageIndex || run.stage === "completed";
                const active = index === stageIndex && run.stage !== "completed";
                return (
                  <div
                    key={stage.id}
                    className={`grid grid-cols-[20px_minmax(0,1fr)] gap-3 rounded-md border px-4 py-3 ${
                      completed
                        ? "border-emerald-200 bg-emerald-50"
                        : active
                          ? "border-amber-200 bg-amber-50"
                          : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div
                      className={`mt-1 h-3 w-3 rounded-full ${
                        completed ? "bg-emerald-500" : active ? "bg-amber-500" : "bg-slate-300"
                      }`}
                    />
                    <div>
                      <div className="text-sm font-medium text-slate-900">{stage.label}</div>
                      <div className="mt-1 text-xs text-slate-600">
                        {active
                          ? "正在执行这一阶段"
                          : completed
                            ? "这一阶段已完成"
                            : "等待上游阶段完成"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <MetricCard label="检索式" value={String(run.stats.queryCount ?? 0)} />
              <MetricCard label="初始候选" value={String(run.stats.retrievedCount ?? 0)} />
              <MetricCard label="去重后" value={String(run.stats.dedupedCount ?? 0)} />
              <MetricCard label="论文池" value={String(run.stats.paperCount ?? 0)} />
            </div>

            {run.status === "completed" ? (
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/projects/${projectId}/papers`}
                  className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  查看论文池
                </Link>
                <Link
                  href={`/projects/${projectId}/graph`}
                  className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:border-slate-400"
                >
                  查看图谱页占位
                </Link>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-md border border-slate-200 bg-slate-50 px-4 py-4">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-950">{value}</div>
    </article>
  );
}

