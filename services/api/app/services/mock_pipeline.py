from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

from ..bootstrap import bootstrap_repo_paths

bootstrap_repo_paths()

from research_lineage_core.models import Paper, Project, ProjectRun  # noqa: E402

from .insight_builder import build_graph_payload, build_report_payload
from .project_store import (
    get_graph,
    get_papers,
    get_query_plan,
    get_report,
    get_run_payload,
    save_graph,
    save_papers,
    save_project,
    save_report,
    save_run_payload,
)


def _now() -> datetime:
    return datetime.now(UTC)


def _parse_iso(value: str) -> datetime:
    return datetime.fromisoformat(value)


def _topic_seed(topic: str) -> list[dict]:
    text = topic.lower()
    if "fabry" in text or "perot" in text or "谐振腔" in text:
        return [
            {
                "title": "High-Gain Fabry-Perot Cavity Antenna Using a Partially Reflective Surface",
                "authors": ["J. Huang", "M. Li"],
                "year": 2021,
                "venue": "IEEE Transactions on Antennas and Propagation",
                "doi": "10.1109/TAP.2021.000001",
                "abstract": "The paper studies partially reflective surface design for compact Fabry-Perot cavity antennas with improved gain-bandwidth trade-offs.",
                "citationCount": 64,
                "relevanceScore": 0.95,
                "qualityScore": 0.89,
            },
            {
                "title": "Wideband Resonant Cavity Antenna with Metasurface Superstrate",
                "authors": ["Y. Chen", "K. Zhang"],
                "year": 2023,
                "venue": "IEEE Access",
                "doi": "10.1109/ACCESS.2023.000002",
                "abstract": "A metasurface superstrate is used to widen the impedance bandwidth of a resonant cavity antenna while preserving high directivity.",
                "citationCount": 28,
                "relevanceScore": 0.91,
                "qualityScore": 0.78,
            },
            {
                "title": "Low-Profile Fabry-Perot Antenna for Millimeter-Wave Applications",
                "authors": ["S. Kumar", "R. Gupta"],
                "year": 2020,
                "venue": "IET Microwaves, Antennas & Propagation",
                "doi": "10.1049/iet-map.2020.000003",
                "abstract": "This work proposes a low-profile cavity geometry for millimeter-wave Fabry-Perot antennas targeting 5G base-station scenarios.",
                "citationCount": 41,
                "relevanceScore": 0.88,
                "qualityScore": 0.81,
            },
            {
                "title": "Reconfigurable Partially Reflective Surface Antenna Based on PIN Diodes",
                "authors": ["L. Wang", "P. Xu"],
                "year": 2022,
                "venue": "Progress In Electromagnetics Research",
                "doi": "10.2528/PIER2200004",
                "abstract": "PIN-diode controlled partially reflective surfaces enable beam and frequency tuning in Fabry-Perot style antennas.",
                "citationCount": 23,
                "relevanceScore": 0.84,
                "qualityScore": 0.77,
            },
            {
                "title": "Review of Fabry-Perot Cavity Antennas: Structures, Bandwidth Enhancement, and Beam Control",
                "authors": ["A. Desai", "H. Zhao"],
                "year": 2024,
                "venue": "International Journal of RF and Microwave Computer-Aided Engineering",
                "doi": "10.1002/mmce.000005",
                "abstract": "A review summarizing cavity geometry, PRS design, bandwidth enhancement techniques, and beam-steering methods for Fabry-Perot antennas.",
                "citationCount": 12,
                "relevanceScore": 0.97,
                "qualityScore": 0.83,
            },
        ]

    if "钙钛矿" in text or "perovskite" in text:
        return [
            {
                "title": "Stability Pathways in Perovskite Solar Cells Under Humidity Stress",
                "authors": ["N. Patel", "E. Morris"],
                "year": 2022,
                "venue": "Advanced Energy Materials",
                "doi": "10.1002/aenm.2022.000001",
                "abstract": "The authors compare encapsulation and additive engineering for moisture-induced instability in perovskite solar cells.",
                "citationCount": 87,
                "relevanceScore": 0.94,
                "qualityScore": 0.91,
            },
            {
                "title": "Thermal Degradation Mechanisms of Perovskite Solar Modules",
                "authors": ["F. Liu", "T. Brown"],
                "year": 2023,
                "venue": "Joule",
                "doi": "10.1016/j.joule.2023.000002",
                "abstract": "This paper traces thermal degradation from ionic migration to interface decomposition in large-area modules.",
                "citationCount": 54,
                "relevanceScore": 0.9,
                "qualityScore": 0.93,
            },
        ]

    if "llm" in text or "agent" in text or "智能体" in text:
        return [
            {
                "title": "Benchmarking Tool-Using LLM Agents on Multi-Step Research Tasks",
                "authors": ["R. Kim", "S. Ortega"],
                "year": 2025,
                "venue": "NeurIPS Datasets and Benchmarks",
                "doi": "10.5555/neurips.2025.000001",
                "abstract": "The benchmark evaluates planning, retrieval grounding, and error recovery for tool-using LLM agents.",
                "citationCount": 19,
                "relevanceScore": 0.96,
                "qualityScore": 0.86,
            },
            {
                "title": "Failure Taxonomy for Autonomous LLM Research Agents",
                "authors": ["C. Singh", "D. Park"],
                "year": 2024,
                "venue": "ACL Findings",
                "doi": "10.18653/v1/2024.findings.000002",
                "abstract": "A failure taxonomy covering hallucinated citations, planning drift, tool misuse, and verification gaps in research agents.",
                "citationCount": 33,
                "relevanceScore": 0.92,
                "qualityScore": 0.84,
            },
        ]

    return [
        {
            "title": f"A Structured Review of {topic}",
            "authors": ["Research Lineage Demo"],
            "year": 2024,
            "venue": "Demo Proceedings",
            "doi": None,
            "abstract": f"A mock review seed generated for the topic {topic}.",
            "citationCount": 0,
            "relevanceScore": 0.82,
            "qualityScore": 0.7,
        }
    ]


def _build_papers(project: Project) -> list[Paper]:
    plan = get_query_plan(project.id)
    seeds = _topic_seed(project.topic)
    source_ids = plan.searchQueries if plan else []

    papers: list[Paper] = []
    for index, seed in enumerate(seeds, start=1):
        papers.append(
            Paper(
                id=f"{project.id}-paper-{index:02d}",
                title=seed["title"],
                authors=seed["authors"],
                year=seed["year"],
                venue=seed["venue"],
                doi=seed["doi"],
                abstract=seed["abstract"],
                url=f"https://example.org/papers/{project.id}/{index}",
                citationCount=seed["citationCount"],
                sourceIds=[query.source for query in source_ids] or project.sources,
                relevanceScore=seed["relevanceScore"],
                qualityScore=seed["qualityScore"],
                isKept=True,
            )
        )
    return papers


def start_run(project: Project) -> ProjectRun:
    current_payload = get_run_payload(project.id)
    if current_payload is not None and current_payload.get("status") in {
        "running",
        "completed",
    }:
        return ProjectRun.model_validate(current_payload)

    payload = {
        "id": f"run-{uuid4().hex[:8]}",
        "projectId": project.id,
        "stage": "query_planning",
        "status": "running",
        "startedAt": _now().replace(microsecond=0).isoformat(),
        "finishedAt": None,
        "errorMessage": None,
        "stats": {
            "queryCount": 0,
            "retrievedCount": 0,
            "dedupedCount": 0,
            "paperCount": 0,
        },
    }
    save_run_payload(project.id, payload)
    save_project(project.model_copy(update={"status": "running"}))
    return ProjectRun.model_validate(payload)


def advance_or_load_run(project: Project) -> ProjectRun:
    payload = get_run_payload(project.id)
    if payload is None:
        return start_run(project)

    if payload["status"] == "completed":
        return ProjectRun.model_validate(payload)

    elapsed = (_now() - _parse_iso(payload["startedAt"])).total_seconds()

    if elapsed < 2:
        payload["stage"] = "query_planning"
        payload["stats"]["queryCount"] = len(project.sources)
    elif elapsed < 5:
        payload["stage"] = "searching"
        payload["stats"]["queryCount"] = len(project.sources)
        payload["stats"]["retrievedCount"] = 24
    elif elapsed < 8:
        payload["stage"] = "deduping"
        payload["stats"]["queryCount"] = len(project.sources)
        payload["stats"]["retrievedCount"] = 24
        payload["stats"]["dedupedCount"] = 16
    else:
        papers = get_papers(project.id)
        if not papers:
            papers = _build_papers(project)
            save_papers(project.id, papers)
        graph = get_graph(project.id)
        if graph is None:
            graph = build_graph_payload(project, papers)
            save_graph(graph)
        if get_report(project.id) is None:
            save_report(build_report_payload(project, papers, graph))
        payload["stage"] = "completed"
        payload["status"] = "completed"
        payload["finishedAt"] = _now().replace(microsecond=0).isoformat()
        payload["stats"]["queryCount"] = len(project.sources)
        payload["stats"]["retrievedCount"] = 24
        payload["stats"]["dedupedCount"] = 16
        payload["stats"]["paperCount"] = len(papers)
        save_project(project.model_copy(update={"status": "completed"}))

    save_run_payload(project.id, payload)
    return ProjectRun.model_validate(payload)
