"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import { createProject, generateQueryPlan } from "@/lib/api";

type SiteHeaderProps = {
  active?: "papers" | "graph" | "report";
  initialQuery?: string;
  backHref?: string;
  backLabel?: string;
  projectId?: string;
};

export function SiteHeader({
  active,
  initialQuery = "",
  backHref = "/",
  backLabel = "返回首页",
  projectId
}: SiteHeaderProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => query.trim().length >= 2, [query]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || loading) {
      return;
    }

    setLoading(true);
    try {
      const project = await createProject({
        topic: query.trim(),
        sources: ["openalex", "semantic_scholar"]
      });
      await generateQueryPlan(project.id);
      router.push(`/projects/${project.id}/run`);
    } catch {
      setLoading(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-[60px] max-w-[1440px] items-center gap-4 px-4 md:px-8">
        <Link href="/" className="flex items-center gap-3 text-[var(--text)]">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[linear-gradient(135deg,#6c5ce7,#8b7cf7)] text-lg font-extrabold text-white shadow-[0_4px_16px_rgba(108,92,231,0.25)]">
            研
          </div>
          <span className="text-[19px] font-bold tracking-[0.18em]">研脉</span>
        </Link>

        <form
          onSubmit={handleSubmit}
          className="ml-0 flex max-w-[420px] flex-1 items-center rounded-[10px] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 transition focus-within:border-[var(--accent)] focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(108,92,231,0.08)] md:ml-6"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#9ca0b4"
            strokeWidth="2"
            strokeLinecap="round"
            className="mr-2 shrink-0"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索研究主题、论文、学者..."
            className="min-w-0 flex-1 border-none bg-transparent text-[13px] text-[var(--text)] outline-none placeholder:text-[var(--text3)]"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="mr-1 rounded p-1 text-[var(--text3)] transition hover:bg-white hover:text-[var(--text2)]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          ) : null}
          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[var(--accent-dark)] disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading ? "启动中" : "搜索"}
          </button>
        </form>

        <nav className="hidden items-center gap-1 rounded-[10px] bg-[var(--surface2)] p-[3px] md:flex">
          <Link
            href={projectId ? `/projects/${projectId}/papers` : "/projects/new"}
            className={`rounded-[8px] px-4 py-1.5 text-[13px] font-medium transition ${
              active === "papers"
                ? "bg-white text-[var(--accent)] shadow-sm"
                : "text-[var(--text2)] hover:text-[var(--text)]"
            }`}
          >
            文献目录
          </Link>
          <Link
            href={projectId ? `/projects/${projectId}/graph` : "/projects/new"}
            className={`rounded-[8px] px-4 py-1.5 text-[13px] font-medium transition ${
              active === "graph"
                ? "bg-white text-[var(--teal)] shadow-sm"
                : "text-[var(--text2)] hover:text-[var(--text)]"
            }`}
          >
            知识图谱
          </Link>
          <Link
            href={projectId ? `/projects/${projectId}/report` : "/projects/new"}
            className={`rounded-[8px] px-4 py-1.5 text-[13px] font-medium transition ${
              active === "report"
                ? "bg-white text-[var(--amber)] shadow-sm"
                : "text-[var(--text2)] hover:text-[var(--text)]"
            }`}
          >
            研究报告
          </Link>
        </nav>

        <Link
          href={backHref}
          className="ml-auto flex items-center gap-1 rounded-[9px] px-3 py-2 text-[13px] text-[var(--text2)] transition hover:bg-[var(--purple-bg)] hover:text-[var(--accent)]"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {backLabel}
        </Link>
      </div>
    </header>
  );
}
