"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { createProject, generateQueryPlan } from "@/lib/api";
import type { Project } from "@/lib/types";

const trendingTopics = [
  "Fabry-Perot cavity antenna",
  "钙钛矿太阳能电池稳定性",
  "LLM research agent evaluation",
  "毫米波低剖面天线"
];

const historyKey = "yanmai-search-history";

export function HomeExperience({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(historyKey);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as string[];
      if (Array.isArray(parsed)) {
        setHistory(parsed.filter(Boolean).slice(0, 8));
      }
    } catch {
      // ignore local storage parsing failures
    }
  }, []);

  const canSubmit = useMemo(() => query.trim().length >= 2, [query]);

  function persistHistory(nextQuery: string) {
    const normalized = nextQuery.trim();
    if (!normalized) {
      return;
    }
    const next = [normalized, ...history.filter((item) => item !== normalized)].slice(0, 8);
    setHistory(next);
    window.localStorage.setItem(historyKey, JSON.stringify(next));
  }

  async function launchResearch(nextQuery: string) {
    const normalized = nextQuery.trim();
    if (normalized.length < 2) {
      return;
    }

    setLoading(true);
    try {
      const project = await createProject({
        topic: normalized,
        goal: "梳理关键技术路线、指标和研究空白",
        sources: ["openalex", "semantic_scholar"]
      });
      await generateQueryPlan(project.id);
      persistHistory(normalized);
      router.push(`/projects/${project.id}/run`);
    } catch {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await launchResearch(query);
  }

  function removeHistoryItem(item: string) {
    const next = history.filter((entry) => entry !== item);
    setHistory(next);
    window.localStorage.setItem(historyKey, JSON.stringify(next));
  }

  return (
    <div className="min-h-screen">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-28 -top-44 h-[500px] w-[500px] rounded-full bg-[#e8e4ff] opacity-70 blur-[140px]" />
        <div className="absolute -bottom-36 -right-24 h-[400px] w-[400px] rounded-full bg-[#dcfce7] opacity-70 blur-[140px]" />
      </div>

      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex h-[60px] max-w-[1440px] items-center justify-between gap-6 px-4 md:px-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[linear-gradient(135deg,#6c5ce7,#8b7cf7)] text-lg font-extrabold text-white shadow-[0_4px_16px_rgba(108,92,231,0.25)]">
              研
            </div>
            <span className="text-[19px] font-bold tracking-[0.18em] text-[var(--text)]">研脉</span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            <Link href="/" className="rounded-[10px] px-4 py-2 text-[13px] text-[var(--text2)] transition hover:bg-[var(--surface2)] hover:text-[var(--text)]">
              搜索入口
            </Link>
            <Link href="/projects/new" className="rounded-[10px] px-4 py-2 text-[13px] text-[var(--text2)] transition hover:bg-[var(--surface2)] hover:text-[var(--text)]">
              新建任务
            </Link>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/projects/new"
              className="rounded-[10px] px-4 py-2 text-[13px] font-medium text-[var(--text2)] transition hover:bg-[var(--purple-bg)] hover:text-[var(--accent)]"
            >
              高级配置
            </Link>
            <button
              type="button"
              onClick={() => void launchResearch("Fabry-Perot cavity antenna")}
              className="rounded-[10px] bg-[var(--accent)] px-4 py-2 text-[13px] font-semibold text-white shadow-[0_2px_8px_rgba(108,92,231,0.2)] transition hover:-translate-y-px hover:bg-[var(--accent-dark)]"
            >
              演示任务
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex max-w-[680px] flex-col items-center px-6 pb-16 pt-20">
        <section className="text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(108,92,231,0.15)] bg-[var(--purple-bg)] px-4 py-1.5 text-xs font-medium text-[var(--accent)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--teal)]" />
            Research workflow + graph + assistant
          </div>
          <h1 className="bg-[linear-gradient(135deg,#1a1d2e,#6c5ce7)] bg-clip-text text-5xl font-extrabold tracking-[0.2em] text-transparent md:text-6xl">
            研脉
          </h1>
          <p className="mt-3 text-[15px] tracking-[0.14em] text-[var(--text2)]">
            面向科研选题、论文池、知识图谱与研究报告的一体化助手
          </p>
        </section>

        <section className="mt-14 w-full">
          <form
            onSubmit={handleSubmit}
            className="flex items-center rounded-[18px] border-2 border-[var(--border2)] bg-white px-5 py-1 shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition focus-within:border-[var(--accent)] focus-within:shadow-[0_4px_20px_rgba(0,0,0,0.04),0_0_0_5px_rgba(108,92,231,0.06)]"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9ca0b4"
              strokeWidth="2"
              strokeLinecap="round"
              className="mr-3 shrink-0"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="输入你的研究主题，例如：Fabry-Perot cavity antenna"
              className="min-w-0 flex-1 border-none bg-transparent py-4 text-[15px] text-[var(--text)] outline-none placeholder:text-[var(--text3)]"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="rounded-full p-2 text-[var(--text3)] transition hover:bg-[var(--bg)] hover:text-[var(--text2)]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            ) : null}
            <div className="mx-2 hidden h-6 w-px bg-[var(--border)] md:block" />
            <button
              type="submit"
              disabled={!canSubmit || loading}
              className="ml-2 rounded-[14px] bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-px hover:bg-[var(--accent-dark)] hover:shadow-[0_4px_18px_rgba(108,92,231,0.3)] disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {loading ? "构建中..." : "开始研究"}
            </button>
          </form>
          <p className="mt-3 pl-5 text-xs text-[var(--text3)]">
            输入主题后会自动创建项目、生成检索计划，并进入研究流程页。
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs text-[var(--text3)]">热门主题</span>
            {trendingTopics.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => {
                  setQuery(topic);
                  void launchResearch(topic);
                }}
                className="rounded-full border border-[var(--border2)] bg-white px-3 py-1.5 text-xs text-[var(--text2)] transition hover:border-[var(--accent)] hover:bg-[var(--purple-bg)] hover:text-[var(--accent)]"
              >
                {topic}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-14 w-full">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold tracking-[0.04em] text-[var(--text2)]">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca0b4" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              最近搜索
            </h2>
            {history.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setHistory([]);
                  window.localStorage.removeItem(historyKey);
                }}
                className="rounded-md px-3 py-1 text-xs text-[var(--text3)] transition hover:bg-rose-50 hover:text-rose-500"
              >
                清空
              </button>
            ) : null}
          </div>

          {history.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {history.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-xl border border-[var(--border2)] bg-white px-4 py-3 text-sm text-[var(--text2)] transition hover:-translate-y-0.5 hover:border-[var(--purple-light)] hover:bg-[var(--purple-bg)] hover:text-[var(--accent)] hover:shadow-[0_6px_16px_rgba(108,92,231,0.08)]"
                >
                  <button type="button" onClick={() => void launchResearch(item)} className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    {item}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeHistoryItem(item)}
                    className="rounded-md px-1 text-base leading-none text-[var(--text3)] transition hover:bg-rose-50 hover:text-rose-500"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/70 px-6 py-10 text-center text-sm text-[var(--text3)]">
              还没有历史搜索。输入一个研究主题，我们就从这里开第一条脉络。
            </div>
          )}
        </section>

        <section className="mt-14 w-full">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-[0.04em] text-[var(--text2)]">
              最近项目
            </h2>
            <Link href="/projects/new" className="text-xs text-[var(--accent)]">
              高级配置入口
            </Link>
          </div>
          <div className="grid gap-3">
            {projects.slice(0, 5).map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}/run`}
                className="rounded-2xl border border-[var(--border2)] bg-white px-5 py-4 transition hover:-translate-y-0.5 hover:border-[rgba(108,92,231,0.2)] hover:shadow-[0_8px_24px_rgba(15,23,42,0.05)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-[var(--text)]">{project.topic}</div>
                    <div className="mt-1 text-sm text-[var(--text2)]">
                      {project.domain || "未指定学科方向"}
                    </div>
                  </div>
                  <span className="rounded-full border border-[var(--border)] bg-[var(--surface2)] px-3 py-1 text-xs font-medium text-[var(--text2)]">
                    {project.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
