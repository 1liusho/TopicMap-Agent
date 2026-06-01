import { ReportView } from "@/components/report-view";
import { getProject, getReport } from "@/lib/api";

export default async function ReportPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, report] = await Promise.all([getProject(id), getReport(id)]);

  return <ReportView project={project} report={report} />;
}
