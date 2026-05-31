from __future__ import annotations

from collections import Counter, defaultdict
from datetime import UTC, datetime
from typing import Any

from ..bootstrap import bootstrap_repo_paths

bootstrap_repo_paths()

from research_lineage_core.models import (  # noqa: E402
    CitationItem,
    EvidenceSpan,
    GraphEdge,
    GraphNode,
    GraphPayload,
    Paper,
    Project,
    ReportPayload,
    ReportSection,
)


def _now_iso() -> str:
    return datetime.now(UTC).replace(microsecond=0).isoformat()


def _profile_for_topic(topic: str) -> dict[str, Any]:
    text = topic.lower()

    if "fabry" in text or "perot" in text or "谐振腔" in text:
        return {
            "summary": "重点关注 PRS 结构、超表面加载、带宽提升与波束控制。",
            "concepts": [
                {
                    "id": "method-prs",
                    "label": "Partially Reflective Surface",
                    "type": "Method",
                    "keywords": ["partially reflective surface", "prs"],
                },
                {
                    "id": "method-metasurface",
                    "label": "Metasurface Superstrate",
                    "type": "Method",
                    "keywords": ["metasurface", "superstrate"],
                },
                {
                    "id": "method-reconfigurable",
                    "label": "Reconfigurable PRS",
                    "type": "Method",
                    "keywords": ["reconfigurable", "pin diode", "tuning"],
                },
                {
                    "id": "problem-bandwidth",
                    "label": "Bandwidth Enhancement",
                    "type": "Problem",
                    "keywords": ["bandwidth", "wideband"],
                },
                {
                    "id": "metric-directivity",
                    "label": "High Directivity",
                    "type": "Metric",
                    "keywords": ["directivity", "gain"],
                },
                {
                    "id": "metric-low-profile",
                    "label": "Low Profile",
                    "type": "Metric",
                    "keywords": ["low-profile", "compact"],
                },
                {
                    "id": "metric-beam-control",
                    "label": "Beam Control",
                    "type": "Metric",
                    "keywords": ["beam", "steering", "tuning"],
                },
                {
                    "id": "app-mmwave",
                    "label": "Millimeter-wave / 5G",
                    "type": "Application",
                    "keywords": ["millimeter-wave", "5g", "base-station"],
                },
            ],
            "gaps": [
                "如何在高增益和宽带之间找到更稳定的折中，仍然是 Fabry-Perot 腔天线里的核心问题。",
                "可重构 PRS 的控制复杂度、偏置网络损耗与辐射性能之间还缺少系统比较。",
                "面向毫米波和实际封装场景的低剖面结构，仍需要更多可复现实验数据。",
            ],
        }

    if "钙钛矿" in text or "perovskite" in text:
        return {
            "summary": "重点关注湿热稳定性、界面钝化、封装与模块尺度退化机制。",
            "concepts": [
                {
                    "id": "method-encapsulation",
                    "label": "Encapsulation Strategy",
                    "type": "Method",
                    "keywords": ["encapsulation", "moisture"],
                },
                {
                    "id": "method-additive",
                    "label": "Additive Engineering",
                    "type": "Method",
                    "keywords": ["additive", "interface"],
                },
                {
                    "id": "problem-thermal",
                    "label": "Thermal Degradation",
                    "type": "Problem",
                    "keywords": ["thermal", "degradation"],
                },
                {
                    "id": "metric-lifetime",
                    "label": "Device Lifetime",
                    "type": "Metric",
                    "keywords": ["stability", "lifetime"],
                },
                {
                    "id": "app-module",
                    "label": "Large-area Module",
                    "type": "Application",
                    "keywords": ["module", "large-area"],
                },
            ],
            "gaps": [
                "不同稳定性强化策略的横向比较仍然不足，尤其缺少统一测试协议。",
                "从电池到模块放大的过程中，界面与封装耦合退化机制仍需更细粒度证据。",
                "寿命预测模型与真实户外运行数据之间还有明显断层。",
            ],
        }

    if "llm" in text or "agent" in text or "智能体" in text:
        return {
            "summary": "重点关注工具使用、规划鲁棒性、失败恢复与评测协议。",
            "concepts": [
                {
                    "id": "method-tool-use",
                    "label": "Tool-Using Agent",
                    "type": "Method",
                    "keywords": ["tool-using", "tool use"],
                },
                {
                    "id": "method-planning",
                    "label": "Multi-step Planning",
                    "type": "Method",
                    "keywords": ["planning", "multi-step"],
                },
                {
                    "id": "problem-hallucination",
                    "label": "Citation Hallucination",
                    "type": "Problem",
                    "keywords": ["hallucinated", "hallucination"],
                },
                {
                    "id": "metric-reliability",
                    "label": "Reliability",
                    "type": "Metric",
                    "keywords": ["reliability", "error recovery"],
                },
                {
                    "id": "metric-grounding",
                    "label": "Retrieval Grounding",
                    "type": "Metric",
                    "keywords": ["grounding", "retrieval"],
                },
                {
                    "id": "app-benchmark",
                    "label": "Benchmarking Workflow",
                    "type": "Application",
                    "keywords": ["benchmark", "evaluation"],
                },
            ],
            "gaps": [
                "评测集仍然偏静态，缺少对真实长链路研究任务的持续观测。",
                "失败分类与修复策略通常被分开研究，尚未形成闭环优化框架。",
                "工具调用日志、引用真实性与最终任务成功率之间的关系还不够透明。",
            ],
        }

    return {
        "summary": "当前使用通用 mock 规则，为后续真实抽取和图谱构建预留接口。",
        "concepts": [
            {
                "id": "method-core",
                "label": "Core Method",
                "type": "Method",
                "keywords": [topic.lower()],
            },
            {
                "id": "metric-impact",
                "label": "Impact Metric",
                "type": "Metric",
                "keywords": ["performance", "impact", "result"],
            },
            {
                "id": "problem-open",
                "label": "Open Problem",
                "type": "Problem",
                "keywords": ["challenge", "limitation"],
            },
        ],
        "gaps": [
            "需要补充真实检索与抽取结果，才能形成更可信的研究空白总结。",
            "还需要加入证据置信度与人工校正流程。",
        ],
    }


def _candidate_text(paper: Paper) -> str:
    return " ".join(filter(None, [paper.title, paper.abstract])).lower()


def _select_papers(project: Project, papers: list[Paper]) -> list[Paper]:
    kept = [paper for paper in papers if paper.isKept]
    return kept or papers


def build_graph_payload(project: Project, papers: list[Paper]) -> GraphPayload:
    selected_papers = _select_papers(project, papers)
    profile = _profile_for_topic(project.topic)

    nodes_by_id: dict[str, GraphNode] = {}
    evidence_spans: list[EvidenceSpan] = []
    edges: list[GraphEdge] = []
    method_metric_links: dict[tuple[str, str, str], set[str]] = defaultdict(set)

    for paper in selected_papers:
        nodes_by_id[paper.id] = GraphNode(
            id=paper.id,
            projectId=project.id,
            type="Paper",
            label=paper.title,
            properties={
                "year": paper.year,
                "venue": paper.venue,
                "doi": paper.doi,
                "authors": paper.authors,
                "relevanceScore": paper.relevanceScore,
                "qualityScore": paper.qualityScore,
            },
        )

    for paper in selected_papers:
        text = _candidate_text(paper)
        matched_methods: list[str] = []
        matched_metrics: list[str] = []

        for concept in profile["concepts"]:
            if not any(keyword in text for keyword in concept["keywords"]):
                continue

            if concept["id"] not in nodes_by_id:
                nodes_by_id[concept["id"]] = GraphNode(
                    id=concept["id"],
                    projectId=project.id,
                    type=concept["type"],
                    label=concept["label"],
                    properties={"keywords": concept["keywords"]},
                )

            evidence_id = f"ev-{paper.id}-{concept['id']}"
            evidence_spans.append(
                EvidenceSpan(
                    id=evidence_id,
                    paperId=paper.id,
                    text=paper.abstract or paper.title,
                    section="abstract",
                    sourceType="abstract",
                )
            )

            relation = "uses"
            confidence = 0.76
            if concept["type"] == "Problem":
                relation = "targets"
                confidence = 0.71
            elif concept["type"] == "Metric":
                relation = "achieves"
                confidence = 0.79
            elif concept["type"] == "Application":
                relation = "applies_to"
                confidence = 0.73

            edges.append(
                GraphEdge(
                    id=f"edge-{paper.id}-{concept['id']}",
                    projectId=project.id,
                    sourceNodeId=paper.id,
                    targetNodeId=concept["id"],
                    type=relation,
                    confidence=confidence,
                    evidenceSpanIds=[evidence_id],
                    extractionMethod="rule",
                )
            )

            if concept["type"] == "Method":
                matched_methods.append(concept["id"])
            if concept["type"] == "Metric":
                matched_metrics.append(concept["id"])

        for method_id in matched_methods:
            for metric_id in matched_metrics:
                method_metric_links[(method_id, metric_id, "targets")].add(
                    f"ev-{paper.id}-{method_id}"
                )

    for index, ((source_id, target_id, relation), evidence_ids) in enumerate(
        sorted(method_metric_links.items()),
        start=1,
    ):
        edges.append(
            GraphEdge(
                id=f"edge-method-metric-{index:02d}",
                projectId=project.id,
                sourceNodeId=source_id,
                targetNodeId=target_id,
                type=relation,
                confidence=0.68,
                evidenceSpanIds=sorted(evidence_ids),
                extractionMethod="rule",
            )
        )

    stats = Counter(node.type for node in nodes_by_id.values())
    return GraphPayload(
        projectId=project.id,
        nodes=list(nodes_by_id.values()),
        edges=edges,
        evidenceSpans=evidence_spans,
        stats={
            "paperCount": len([node for node in nodes_by_id.values() if node.type == "Paper"]),
            "edgeCount": len(edges),
            "evidenceCount": len(evidence_spans),
            **{f"{node_type.lower()}Count": count for node_type, count in stats.items()},
        },
        generatedAt=_now_iso(),
    )


def build_report_payload(
    project: Project,
    papers: list[Paper],
    graph: GraphPayload,
) -> ReportPayload:
    selected_papers = _select_papers(project, papers)
    profile = _profile_for_topic(project.topic)

    node_lookup = {node.id: node for node in graph.nodes}
    incoming_counts: Counter[str] = Counter()
    for edge in graph.edges:
        incoming_counts[edge.targetNodeId] += 1

    route_lines = []
    for node in graph.nodes:
        if node.type == "Method":
            route_lines.append(
                f"- {node.label}：关联 {incoming_counts.get(node.id, 0)} 篇论文。"
            )

    metric_lines = []
    for node in graph.nodes:
        if node.type == "Metric":
            linked_papers = sum(
                1
                for edge in graph.edges
                if edge.targetNodeId == node.id and node_lookup.get(edge.sourceNodeId, None)
            )
            metric_lines.append(f"- {node.label}：在 {linked_papers} 条关系中被提及。")

    sections = [
        ReportSection(
            id="overview",
            title="检索概览",
            content=(
                f"本轮围绕“{project.topic}”整理了 {len(selected_papers)} 篇保留论文，"
                f"来源包括 {', '.join(project.sources)}。{profile['summary']}"
            ),
        ),
        ReportSection(
            id="routes",
            title="技术路线",
            content="\n".join(route_lines)
            if route_lines
            else "当前 mock 图谱还没有命中足够的技术路线节点。",
        ),
        ReportSection(
            id="metrics",
            title="指标与证据观察",
            content="\n".join(metric_lines)
            if metric_lines
            else "当前 mock 图谱还没有形成稳定的指标节点。",
        ),
        ReportSection(
            id="gaps",
            title="研究空白建议",
            content="\n".join(f"- {gap}" for gap in profile["gaps"]),
        ),
    ]

    citations = [
        CitationItem(
            paperId=paper.id,
            title=paper.title,
            authors=paper.authors,
            year=paper.year,
            venue=paper.venue,
            doi=paper.doi,
        )
        for paper in selected_papers
    ]

    summary = (
        f"已基于 {len(selected_papers)} 篇论文生成 mock 研究报告。"
        f" 当前更适合验证页面和数据流，后续替换为真实抽取与证据校验。"
    )

    markdown_lines = [
        f"# {project.topic} 研究报告",
        "",
        f"> {summary}",
        "",
    ]
    for section in sections:
        markdown_lines.extend([f"## {section.title}", "", section.content, ""])
    markdown_lines.extend(["## 引用列表", ""])
    for citation in citations:
        author_text = ", ".join(citation.authors)
        venue_text = citation.venue or "Unknown venue"
        year_text = str(citation.year) if citation.year else "n.d."
        doi_text = f", DOI: {citation.doi}" if citation.doi else ""
        markdown_lines.append(
            f"- {author_text} ({year_text}). {citation.title}. {venue_text}{doi_text}"
        )

    return ReportPayload(
        projectId=project.id,
        summary=summary,
        sections=sections,
        researchGaps=profile["gaps"],
        citations=citations,
        markdown="\n".join(markdown_lines),
        generatedAt=_now_iso(),
    )


def build_bibtex(report: ReportPayload) -> str:
    entries = []
    for index, citation in enumerate(report.citations, start=1):
        key = citation.doi.replace("/", "_") if citation.doi else f"paper{index}"
        author_text = " and ".join(citation.authors)
        year_text = citation.year or "2026"
        venue_text = citation.venue or "Unknown venue"
        entries.append(
            "\n".join(
                [
                    f"@article{{{key},",
                    f"  title = {{{citation.title}}},",
                    f"  author = {{{author_text}}},",
                    f"  journal = {{{venue_text}}},",
                    f"  year = {{{year_text}}},",
                    f"  doi = {{{citation.doi or ''}}}",
                    "}",
                ]
            )
        )
    return "\n\n".join(entries)
