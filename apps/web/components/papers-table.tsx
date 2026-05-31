"use client";

import { useMemo, useState } from "react";

import { API_BASE_URL } from "@/lib/api";
import { Paper } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";

type PapersTableProps = {
  projectId: string;
  initialPapers: Paper[];
};

export function PapersTable({ projectId, initialPapers }: PapersTableProps) {
  const [papers, setPapers] = useState(initialPapers);
  const [filter, setFilter] = useState<"all" | "kept" | "removed">("all");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (filter === "kept") {
      return papers.filter((paper) => paper.isKept);
    }
    if (filter === "removed") {
      return papers.filter((paper) => !paper.isKept);
    }
    return papers;
  }, [filter, papers]);

  async function togglePaper(paper: Paper) {
    setPendingId(paper.id);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${projectId}/papers/${paper.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            isKept: !paper.isKept
          })
        }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const nextPaper = (await response.json()) as Paper;
      setPapers((current) =>
        current.map((item) => (item.id === nextPaper.id ? nextPaper : item))
      );
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-ink">论文池</h2>
            <p className="mt-1 text-sm text-steel">
              先把保留 / 剔除动作做通，后续再加更多筛选、手动导入和摘要详情。
            </p>
          </div>

          <div className="flex items-center gap-2">
            <FilterButton current={filter} value="all" onClick={setFilter}>
              全部
            </FilterButton>
            <FilterButton current={filter} value="kept" onClick={setFilter}>
              保留
            </FilterButton>
            <FilterButton current={filter} value="removed" onClick={setFilter}>
              已剔除
            </FilterButton>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="border-b border-slate-200 px-3 py-3">论文</th>
                <th className="border-b border-slate-200 px-3 py-3">年份</th>
                <th className="border-b border-slate-200 px-3 py-3">来源</th>
                <th className="border-b border-slate-200 px-3 py-3">分数</th>
                <th className="border-b border-slate-200 px-3 py-3">状态</th>
                <th className="border-b border-slate-200 px-3 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((paper) => (
                <tr key={paper.id} className="align-top">
                  <td className="border-b border-slate-100 px-3 py-4">
                    <div className="max-w-xl">
                      <div className="text-sm font-medium leading-6 text-slate-950">
                        {paper.title}
                      </div>
                      <div className="mt-1 text-sm text-slate-600">
                        {paper.authors.join(", ")}
                      </div>
                      {paper.abstract ? (
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {paper.abstract}
                        </p>
                      ) : null}
                    </div>
                  </td>
                  <td className="border-b border-slate-100 px-3 py-4 text-sm text-slate-700">
                    {paper.year ?? "-"}
                  </td>
                  <td className="border-b border-slate-100 px-3 py-4 text-sm text-slate-700">
                    {paper.sourceIds.join(", ")}
                  </td>
                  <td className="border-b border-slate-100 px-3 py-4 text-sm text-slate-700">
                    <div>相关性 {paper.relevanceScore?.toFixed(2) ?? "-"}</div>
                    <div className="mt-1">质量 {paper.qualityScore?.toFixed(2) ?? "-"}</div>
                  </td>
                  <td className="border-b border-slate-100 px-3 py-4">
                    <StatusBadge tone={paper.isKept ? "success" : "warning"}>
                      {paper.isKept ? "保留" : "已剔除"}
                    </StatusBadge>
                  </td>
                  <td className="border-b border-slate-100 px-3 py-4 text-right">
                    <button
                      type="button"
                      disabled={pendingId === paper.id}
                      onClick={() => togglePaper(paper)}
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-slate-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:text-slate-400"
                    >
                      {pendingId === paper.id
                        ? "处理中..."
                        : paper.isKept
                          ? "剔除"
                          : "重新保留"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function FilterButton({
  current,
  value,
  onClick,
  children
}: {
  current: "all" | "kept" | "removed";
  value: "all" | "kept" | "removed";
  onClick: (value: "all" | "kept" | "removed") => void;
  children: string;
}) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`rounded-md px-3 py-2 text-sm transition ${
        active
          ? "bg-slate-950 text-white"
          : "border border-slate-300 bg-white text-slate-700 hover:border-slate-400"
      }`}
    >
      {children}
    </button>
  );
}

