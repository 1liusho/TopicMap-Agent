from __future__ import annotations

import json
from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4

from ..bootstrap import bootstrap_repo_paths

bootstrap_repo_paths()

from research_lineage_core.models import (  # noqa: E402
    GraphPayload,
    Paper,
    Project,
    ProjectCreate,
    QueryPlan,
    ReportPayload,
)


REPO_ROOT = Path(__file__).resolve().parents[4]
PROJECTS_DIR = REPO_ROOT / "data" / "projects"


def _now_iso() -> str:
    return datetime.now(UTC).replace(microsecond=0).isoformat()


def _project_dir(project_id: str) -> Path:
    return PROJECTS_DIR / project_id


def _project_file(project_id: str) -> Path:
    return _project_dir(project_id) / "project.json"


def _query_plan_file(project_id: str) -> Path:
    return _project_dir(project_id) / "query-plan.json"


def _run_file(project_id: str) -> Path:
    return _project_dir(project_id) / "run.json"


def _papers_file(project_id: str) -> Path:
    return _project_dir(project_id) / "papers.json"


def _graph_file(project_id: str) -> Path:
    return _project_dir(project_id) / "graph.json"


def _report_file(project_id: str) -> Path:
    return _project_dir(project_id) / "report.json"


def _read_json(path: Path) -> dict | list | None:
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def _write_json(path: Path, payload: dict | list) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def create_project(payload: ProjectCreate) -> Project:
    project_id = f"proj-{uuid4().hex[:8]}"
    timestamp = _now_iso()
    project = Project(
        id=project_id,
        topic=payload.topic,
        goal=payload.goal,
        domain=payload.domain,
        yearStart=payload.yearStart,
        yearEnd=payload.yearEnd,
        sources=payload.sources,
        status="draft",
        createdAt=timestamp,
        updatedAt=timestamp,
    )
    save_project(project)
    _write_json(_papers_file(project_id), [])
    return project


def list_projects() -> list[Project]:
    if not PROJECTS_DIR.exists():
        return []

    projects: list[Project] = []
    for path in PROJECTS_DIR.glob("*/project.json"):
        payload = _read_json(path)
        if payload:
            projects.append(Project.model_validate(payload))

    return sorted(projects, key=lambda item: item.updatedAt, reverse=True)


def get_project(project_id: str) -> Project | None:
    payload = _read_json(_project_file(project_id))
    if payload is None:
        return None
    return Project.model_validate(payload)


def save_project(project: Project) -> Project:
    updated = project.model_copy(update={"updatedAt": _now_iso()})
    _write_json(_project_file(project.id), updated.model_dump(mode="json"))
    return updated


def get_query_plan(project_id: str) -> QueryPlan | None:
    payload = _read_json(_query_plan_file(project_id))
    if payload is None:
        return None
    return QueryPlan.model_validate(payload)


def save_query_plan(plan: QueryPlan) -> QueryPlan:
    _write_json(_query_plan_file(plan.projectId), plan.model_dump(mode="json"))
    return plan


def get_run_payload(project_id: str) -> dict | None:
    payload = _read_json(_run_file(project_id))
    if payload is None:
        return None
    return dict(payload)


def save_run_payload(project_id: str, payload: dict) -> dict:
    _write_json(_run_file(project_id), payload)
    return payload


def get_papers(project_id: str) -> list[Paper]:
    payload = _read_json(_papers_file(project_id))
    if payload is None:
        return []
    return [Paper.model_validate(item) for item in payload]


def save_papers(project_id: str, papers: list[Paper]) -> list[Paper]:
    _write_json(
        _papers_file(project_id),
        [paper.model_dump(mode="json") for paper in papers],
    )
    return papers


def save_paper(project_id: str, updated_paper: Paper) -> Paper:
    papers = get_papers(project_id)
    merged: list[Paper] = []
    for paper in papers:
        if paper.id == updated_paper.id:
            merged.append(updated_paper)
        else:
            merged.append(paper)
    save_papers(project_id, merged)
    return updated_paper


def get_graph(project_id: str) -> GraphPayload | None:
    payload = _read_json(_graph_file(project_id))
    if payload is None:
        return None
    return GraphPayload.model_validate(payload)


def save_graph(graph: GraphPayload) -> GraphPayload:
    _write_json(_graph_file(graph.projectId), graph.model_dump(mode="json"))
    return graph


def get_report(project_id: str) -> ReportPayload | None:
    payload = _read_json(_report_file(project_id))
    if payload is None:
        return None
    return ReportPayload.model_validate(payload)


def save_report(report: ReportPayload) -> ReportPayload:
    _write_json(_report_file(report.projectId), report.model_dump(mode="json"))
    return report
