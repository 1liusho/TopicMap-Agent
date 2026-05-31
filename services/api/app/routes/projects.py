from __future__ import annotations

from fastapi import APIRouter, HTTPException
from fastapi.responses import PlainTextResponse

from ..bootstrap import bootstrap_repo_paths

bootstrap_repo_paths()

from research_lineage_core.models import (  # noqa: E402
    GraphPayload,
    Paper,
    PaperUpdate,
    Project,
    ProjectCreate,
    ProjectRun,
    ProjectUpdate,
    QueryPlan,
    ReportPayload,
)

from ..services.insight_builder import build_bibtex, build_graph_payload, build_report_payload
from ..services.mock_pipeline import advance_or_load_run, start_run
from ..services.project_store import (
    create_project,
    get_graph,
    get_papers,
    get_project,
    get_query_plan,
    get_report,
    list_projects,
    save_graph,
    save_paper,
    save_project,
    save_query_plan,
    save_report,
)
from ..services.query_planner import build_query_plan

router = APIRouter(prefix="/api", tags=["projects"])


@router.post("/projects", response_model=Project)
def create_project_endpoint(payload: ProjectCreate) -> Project:
    return create_project(payload)


@router.get("/projects", response_model=list[Project])
def list_projects_endpoint() -> list[Project]:
    return list_projects()


@router.get("/projects/{project_id}", response_model=Project)
def get_project_endpoint(project_id: str) -> Project:
    project = get_project(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found.")
    return project


@router.patch("/projects/{project_id}", response_model=Project)
def patch_project_endpoint(project_id: str, payload: ProjectUpdate) -> Project:
    project = get_project(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found.")

    updated = project.model_copy(
        update=payload.model_dump(exclude_unset=True, exclude_none=True)
    )
    return save_project(updated)


@router.post("/projects/{project_id}/plan-query", response_model=QueryPlan)
def plan_query_endpoint(project_id: str) -> QueryPlan:
    project = get_project(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found.")

    plan = build_query_plan(project)
    save_query_plan(plan)
    updated = project.model_copy(update={"status": "planned"})
    save_project(updated)
    return plan


@router.get("/projects/{project_id}/plan-query", response_model=QueryPlan)
def get_query_plan_endpoint(project_id: str) -> QueryPlan:
    plan = get_query_plan(project_id)
    if plan is None:
        raise HTTPException(status_code=404, detail="Query plan not found.")
    return plan


@router.post("/projects/{project_id}/run", response_model=ProjectRun)
def run_project_endpoint(project_id: str) -> ProjectRun:
    project = get_project(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found.")
    return start_run(project)


@router.get("/projects/{project_id}/runs/latest", response_model=ProjectRun)
def latest_run_endpoint(project_id: str) -> ProjectRun:
    project = get_project(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found.")
    return advance_or_load_run(project)


@router.get("/projects/{project_id}/papers", response_model=list[Paper])
def papers_endpoint(project_id: str) -> list[Paper]:
    project = get_project(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found.")
    return get_papers(project_id)


@router.patch("/projects/{project_id}/papers/{paper_id}", response_model=Paper)
def patch_paper_endpoint(project_id: str, paper_id: str, payload: PaperUpdate) -> Paper:
    project = get_project(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found.")

    papers = get_papers(project_id)
    for paper in papers:
        if paper.id == paper_id:
            updated = paper.model_copy(update=payload.model_dump())
            save_paper(project_id, updated)
            return updated

    raise HTTPException(status_code=404, detail="Paper not found.")


@router.get("/projects/{project_id}/graph", response_model=GraphPayload)
def graph_endpoint(project_id: str) -> GraphPayload:
    project = get_project(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found.")

    graph = get_graph(project_id)
    if graph is not None:
        return graph

    graph = build_graph_payload(project, get_papers(project_id))
    save_graph(graph)
    return graph


@router.get("/projects/{project_id}/report", response_model=ReportPayload)
def report_endpoint(project_id: str) -> ReportPayload:
    project = get_project(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found.")

    report = get_report(project_id)
    if report is not None:
        return report

    graph = get_graph(project_id) or build_graph_payload(project, get_papers(project_id))
    save_graph(graph)
    report = build_report_payload(project, get_papers(project_id), graph)
    save_report(report)
    return report


@router.post("/projects/{project_id}/report/regenerate", response_model=ReportPayload)
def regenerate_report_endpoint(project_id: str) -> ReportPayload:
    project = get_project(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found.")

    papers = get_papers(project_id)
    graph = build_graph_payload(project, papers)
    save_graph(graph)
    report = build_report_payload(project, papers, graph)
    save_report(report)
    return report


@router.get("/projects/{project_id}/exports/markdown", response_class=PlainTextResponse)
def markdown_export_endpoint(project_id: str) -> PlainTextResponse:
    report = report_endpoint(project_id)
    return PlainTextResponse(content=report.markdown, media_type="text/markdown")


@router.get("/projects/{project_id}/exports/bibtex", response_class=PlainTextResponse)
def bibtex_export_endpoint(project_id: str) -> PlainTextResponse:
    report = report_endpoint(project_id)
    return PlainTextResponse(content=build_bibtex(report), media_type="text/plain")
