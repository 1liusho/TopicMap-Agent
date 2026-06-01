import { ProjectForm } from "@/components/project-form";
import { SiteHeader } from "@/components/site-header";

export default function NewProjectPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader backHref="/" backLabel="返回首页" />
      <main className="mx-auto max-w-[1320px] px-4 py-8 md:px-8">
        <section className="rounded-[24px] border border-[var(--border2)] bg-white px-6 py-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex rounded-full border border-[rgba(108,92,231,0.18)] bg-[var(--purple-bg)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
              高级配置
            </div>
            <h1 className="text-3xl font-bold text-[var(--text)]">新建研究任务</h1>
            <p className="mt-3 text-sm leading-7 text-[var(--text2)]">
              先生成 Query Planner，再进入运行页。这里适合明确研究目标、时间范围和数据源策略。
            </p>
          </div>
        </section>
        <div className="mt-6">
          <ProjectForm />
        </div>
      </main>
    </div>
  );
}
