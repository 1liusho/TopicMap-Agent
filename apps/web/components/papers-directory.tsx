"use client";

import { useMemo, useState } from "react";

import { API_BASE_URL } from "@/lib/api";
import { Paper, Project } from "@/lib/types";
import { SiteHeader } from "@/components/site-header";

type PapersDirectoryProps = {
  project: Project;
  initialPapers: Paper[];
};

type SortMode = "relevance" | "date" | "citations";
type FilterMode = "all" | "kept" | "removed";

export function PapersDirectory({ project, initialPapers }: PapersDirectoryProps) {
  const [papers, setPapers] = useState(initialPapers);
  const [search, setSearch] = useState(project.topic);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("relevance");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [selectedSources, setSelectedSources] = useState<string[]>(project.sources);
  const [yearUpper, setYearUpper] = useState<number>(project.yearEnd ?? 2026);

  const availableSources = useMemo(
    () => Array.from(new Set(papers.flatMap((paper) => paper.sourceIds))),
    [papers]
  );
  const yearMin = useMemo(
    () => Math.min(...papers.map((paper) => paper.year ?? yearUpper), yearUpper),
    [papers, yearUpper]
  );

  const filteredPapers = useMemo(() => {
    let next = papers.filter((paper) => (paper.year ?? yearUpper) <= yearUpper);

    if (filterMode === "kept") {
      next = next.filter((paper) => paper.isKept);
    } else if (filterMode === "removed") {
      next = next.filter((paper) => !paper.isKept);
    }

    if (selectedSources.length > 0) {
      next = next.filter((paper) =>
        paper.sourceIds.some((source) => selectedSources.includes(source))
      );
    }

    next = [...next].sort((left, right) => {
      if (sortMode === "date") {
        return (right.year ?? 0) - (left.year ?? 0);
      }
      if (sortMode === "citations") {
        return (right.citationCount ?? 0) - (left.citationCount ?? 0);
      }
      return (right.relevanceScore ?? 0) - (left.relevanceScore ?? 0);
    });

    return next;
  }, [filterMode, papers, selectedSources, sortMode, yearUpper]);

  async function togglePaper(paper: Paper) {
    setPendingId(paper.id);
    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/${project.id}/papers/${paper.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          isKept: !paper.isKept
        })
      });

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

  function toggleSource(source: string) {
    setSelectedSources((current) =>
      current.includes(source)
        ? current.filter((item) => item !== source)
        : [...current, source]
    );
  }

  return (
    <div className="min-h-screen">
      <SiteHeader
        active="papers"
        initialQuery={search}
        projectId={project.id}
        backHref={`/projects/${project.id}/run`}
        backLabel="返回流程页"
      />

      <div className="mx-auto flex max-w-[1280px] gap-7 px-4 py-7 md:px-7">
        <aside className="sticky top-[88px] hidden w-[230px] shrink-0 self-start lg:block">
          <div className="rounded-2xl border border-[var(--border2)] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold text-[var(--text2)]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6c5ce7" strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              筛选条件
            </h2>

            <div className="mb-5">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text3)]">
                保留状态
              </div>
              {[
                ["all", "全部"],
                ["kept", "保留"],
                ["removed", "已剔除"]
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilterMode(value as FilterMode)}
                  className={`mb-2 flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition ${
                    filterMode === value
                      ? "bg-[var(--purple-bg)] text-[var(--accent)]"
                      : "text-[var(--text2)] hover:bg-[var(--bg)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mb-5">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text3)]">
                数据源
              </div>
              {availableSources.map((source) => (
                <label
                  key={source}
                  className="mb-2 flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-[var(--text2)] transition hover:bg-[var(--bg)]"
                >
                  <input
                    type="checkbox"
                    checked={selectedSources.includes(source)}
                    onChange={() => toggleSource(source)}
                    className="accent-[var(--accent)]"
                  />
                  {source}
                  <span className="ml-auto text-xs text-[var(--text3)]">
                    {
                      papers.filter((paper) =>
                        paper.sourceIds.includes(source)
                      ).length
                    }
                  </span>
                </label>
              ))}
            </div>

            <div>
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text3)]">
                发表年份
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text3)]">{yearMin}</span>
                <input
                  type="range"
                  min={yearMin}
                  max={project.yearEnd ?? yearUpper}
                  value={yearUpper}
                  onChange={(event) => setYearUpper(Number(event.target.value))}
                  className="flex-1 accent-[var(--accent)]"
                />
                <span className="min-w-9 text-center text-xs text-[var(--text3)]">{yearUpper}</span>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-[var(--text2)]">
              共找到 <strong className="font-bold text-[var(--accent)]">{filteredPapers.length}</strong> 篇文献
            </div>
            <label className="flex items-center gap-2 text-xs text-[var(--text3)]">
              排序：
              <select
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value as SortMode)}
                className="rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]"
              >
                <option value="relevance">相关度</option>
                <option value="date">最新发布</option>
                <option value="citations">引用量</option>
              </select>
            </label>
          </div>

          <div className="flex flex-col gap-3">
            {filteredPapers.map((paper, index) => (
              <article
                key={paper.id}
                className="flex flex-wrap gap-4 rounded-2xl border border-[var(--border2)] bg-white px-5 py-5 transition hover:-translate-y-0.5 hover:border-[rgba(108,92,231,0.2)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.04)]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--bg)] text-sm font-bold text-[var(--text3)]">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-semibold leading-6 text-[var(--text)]">
                    {paper.title}
                  </div>
                  <div className="mt-1 text-sm text-[var(--text2)]">{paper.authors.join(", ")}</div>
                  <div className="mt-1 text-xs text-[var(--text3)]">
                    {paper.venue || "Unknown venue"} · {paper.year ?? "-"}
                  </div>
                  {paper.abstract ? (
                    <p className="mt-3 text-sm leading-7 text-[var(--text2)]">
                      {paper.abstract}
                    </p>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {paper.sourceIds.map((source) => (
                      <span
                        key={source}
                        className="rounded-full bg-[var(--purple-bg)] px-3 py-1 text-[10px] font-medium text-[var(--accent)]"
                      >
                        {source}
                      </span>
                    ))}
                    {paper.year ? (
                      <span className="rounded-full bg-[rgba(59,130,246,0.08)] px-3 py-1 text-[10px] font-medium text-sky-600">
                        {paper.year}
                      </span>
                    ) : null}
                    {typeof paper.citationCount === "number" ? (
                      <span className="rounded-full bg-[rgba(16,185,129,0.08)] px-3 py-1 text-[10px] font-medium text-[var(--teal)]">
                        引用 {paper.citationCount}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="ml-auto flex shrink-0 flex-col items-end gap-3">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[var(--accent)]">
                      {paper.citationCount ?? 0}
                    </div>
                    <div className="text-xs text-[var(--text3)]">引用量</div>
                  </div>
                  <div className="text-xs text-[var(--text2)]">
                    相关度 {paper.relevanceScore?.toFixed(2) ?? "-"}
                  </div>
                  <button
                    type="button"
                    disabled={pendingId === paper.id}
                    onClick={() => void togglePaper(paper)}
                    className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                      paper.isKept
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300"
                        : "border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300"
                    } disabled:cursor-not-allowed`}
                  >
                    {pendingId === paper.id ? "处理中..." : paper.isKept ? "保留中" : "已剔除"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
