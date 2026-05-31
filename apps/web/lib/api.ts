import {
  GraphPayload,
  Paper,
  Project,
  ProjectRun,
  QueryPlan,
  ReportPayload
} from "@/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_RESEARCH_API_BASE_URL ?? "http://127.0.0.1:8000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `API request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function listProjects(): Promise<Project[]> {
  return apiFetch<Project[]>("/api/projects");
}

export async function getProject(projectId: string): Promise<Project> {
  return apiFetch<Project>(`/api/projects/${projectId}`);
}

export async function getPapers(projectId: string): Promise<Paper[]> {
  return apiFetch<Paper[]>(`/api/projects/${projectId}/papers`);
}

export async function getLatestRun(projectId: string): Promise<ProjectRun> {
  return apiFetch<ProjectRun>(`/api/projects/${projectId}/runs/latest`);
}

export async function getQueryPlan(projectId: string): Promise<QueryPlan> {
  return apiFetch<QueryPlan>(`/api/projects/${projectId}/plan-query`);
}

export async function getGraph(projectId: string): Promise<GraphPayload> {
  return apiFetch<GraphPayload>(`/api/projects/${projectId}/graph`);
}

export async function getReport(projectId: string): Promise<ReportPayload> {
  return apiFetch<ReportPayload>(`/api/projects/${projectId}/report`);
}

export { API_BASE_URL, apiFetch };
