import { PageShell } from "@/components/page-shell";
import { ProjectForm } from "@/components/project-form";

export default function NewProjectPage() {
  return (
    <PageShell
      title="新建研究任务"
      subtitle="先生成 Query Planner 结果，再进入运行页。当前阶段的重点是把结构化工作流固定下来。"
    >
      <ProjectForm />
    </PageShell>
  );
}

