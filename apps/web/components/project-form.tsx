"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { apiFetch } from "@/lib/api";
import { Project, QueryPlan } from "@/lib/types";

const sourceOptions = [
  { id: "openalex", label: "OpenAlex" },
  { id: "semantic_scholar", label: "Semantic Scholar" }
];

type FormState = {
  topic: string;
  goal: string;
  domain: string;
  yearStart: string;
  yearEnd: string;
  sources: string[];
};

const initialState: FormState = {
  topic: "Fabry-Perot cavity antenna",
  goal: "梳理关键技术路线、指标和研究空白",
  domain: "天线与电磁",
  yearStart: "2019",
  yearEnd: "2026",
  sources: sourceOptions.map((item) => item.id)
};

export function ProjectForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialState);
  const [project, setProject] = useState<Project | null>(null);
  const [plan, setPlan] = useState<QueryPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => form.topic.trim().length >= 2 && form.sources.length > 0,
    [form]
  );

  async function generatePlan() {
    if (!canSubmit) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const created = await apiFetch<Project>("/api/projects", {
        method: "POST",
        body: JSON.stringify({
          topic: form.topic.trim(),
          goal: form.goal.trim() || null,
          domain: form.domain.trim() || null,
          yearStart: form.yearStart ? Number(form.yearStart) : null,
          yearEnd: form.yearEnd ? Number(form.yearEnd) : null,
          sources: form.sources
        })
      });
      const nextPlan = await apiFetch<QueryPlan>(
        `/api/projects/${created.id}/plan-query`,
        {
          method: "POST"
        }
      );

      setProject(created);
      setPlan(nextPlan);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "生成检索计划失败。");
    } finally {
      setLoading(false);
    }
  }

  function toggleSource(sourceId: string) {
    setForm((current) => {
      const enabled = current.sources.includes(sourceId);
      return {
        ...current,
        sources: enabled
          ? current.sources.filter((value) => value !== sourceId)
          : [...current.sources, sourceId]
      };
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-panel">
        <div className="grid gap-5">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-800">研究主题</span>
            <input
              value={form.topic}
              onChange={(event) => setForm({ ...form, topic: event.target.value })}
              className="rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              placeholder="例如：Fabry-Perot cavity antenna"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-800">研究目标</span>
            <textarea
              value={form.goal}
              onChange={(event) => setForm({ ...form, goal: event.target.value })}
              rows={4}
              className="rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              placeholder="例如：梳理技术路线、指标和研究空白"
            />
          </label>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-800">学科方向</span>
              <input
                value={form.domain}
                onChange={(event) => setForm({ ...form, domain: event.target.value })}
                className="rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                placeholder="例如：天线与电磁"
              />
            </label>

            <div className="grid gap-2">
              <span className="text-sm font-medium text-slate-800">年份范围</span>
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={form.yearStart}
                  onChange={(event) => setForm({ ...form, yearStart: event.target.value })}
                  className="rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  placeholder="起始年"
                />
                <input
                  value={form.yearEnd}
                  onChange={(event) => setForm({ ...form, yearEnd: event.target.value })}
                  className="rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  placeholder="结束年"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <span className="text-sm font-medium text-slate-800">检索源</span>
            <div className="flex flex-wrap gap-3">
              {sourceOptions.map((source) => {
                const enabled = form.sources.includes(source.id);
                return (
                  <label
                    key={source.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition ${
                      enabled
                        ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                        : "border-slate-300 bg-white text-slate-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => toggleSource(source.id)}
                      className="h-4 w-4"
                    />
                    {source.label}
                  </label>
                );
              })}
            </div>
          </div>

          {error ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={generatePlan}
              disabled={!canSubmit || loading}
              className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {loading ? "正在生成检索计划..." : "生成检索计划"}
            </button>

            {project ? (
              <button
                type="button"
                onClick={() => router.push(`/projects/${project.id}/run`)}
                className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:border-slate-400 hover:text-slate-950"
              >
                进入运行页
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-panel">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-ink">Query Planner 预览</h2>
            <p className="mt-1 text-sm text-steel">
              先确认关键词组和检索策略，再启动正式流程。
            </p>
          </div>
          {project ? (
            <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              {project.id}
            </span>
          ) : null}
        </div>

        {!plan ? (
          <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm leading-6 text-slate-600">
            在左侧填写主题后点击“生成检索计划”，这里会显示关键词组、检索式和数据源策略。
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            <div className="grid gap-3">
              <h3 className="text-sm font-semibold text-slate-900">关键词组</h3>
              {plan.keywordGroups.map((group) => (
                <article
                  key={group.label}
                  className="rounded-md border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <strong className="text-sm text-slate-900">{group.label}</strong>
                    <span className="text-xs text-slate-500">
                      {group.keywords.length} 个词
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{group.rationale}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {group.keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>

            <div className="grid gap-3">
              <h3 className="text-sm font-semibold text-slate-900">检索式</h3>
              {plan.searchQueries.map((query) => (
                <article
                  key={`${query.source}-${query.query}`}
                  className="rounded-md border border-slate-200 bg-white px-4 py-4"
                >
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {query.source}
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-900">{query.query}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{query.rationale}</p>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

