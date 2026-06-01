from __future__ import annotations

from ..bootstrap import bootstrap_repo_paths

bootstrap_repo_paths()

from research_lineage_core.models import (  # noqa: E402
    Project,
    QueryKeywordGroup,
    QueryPlan,
    SearchQuery,
    SourceStrategy,
)


DOMAIN_HINTS: dict[str, list[str]] = {
    "fabry-perot": [
        "Fabry-Perot cavity antenna",
        "FPCA",
        "resonant cavity antenna",
        "partially reflective surface antenna",
    ],
    "perovskite": [
        "perovskite solar cell stability",
        "perovskite degradation",
        "device encapsulation",
    ],
    "llm-agent": [
        "LLM agent evaluation",
        "tool-using agent benchmark",
        "agent reliability",
        "multi-step planning evaluation",
    ],
}


def _topic_aliases(topic: str) -> list[str]:
    text = topic.lower()
    if "fabry" in text or "perot" in text or "谐振腔" in text:
        return DOMAIN_HINTS["fabry-perot"]
    if "钙钛矿" in text or "perovskite" in text:
        return DOMAIN_HINTS["perovskite"]
    if "llm" in text or "agent" in text or "智能体" in text:
        return DOMAIN_HINTS["llm-agent"]
    return [topic, f"{topic} review", f"{topic} survey"]


def build_query_plan(project: Project) -> QueryPlan:
    aliases = _topic_aliases(project.topic)
    goal_terms = [project.goal] if project.goal else ["review", "benchmark", "trend"]
    domain_terms = [project.domain] if project.domain else ["method", "metric", "application"]

    keyword_groups = [
        QueryKeywordGroup(
            label="core-topic",
            keywords=list(dict.fromkeys([project.topic, *aliases])),
            rationale="核心主题词与常见中英文别名。",
        ),
        QueryKeywordGroup(
            label="research-goal",
            keywords=list(dict.fromkeys(goal_terms)),
            rationale="用研究目标限定综述、比较或趋势分析的检索方向。",
        ),
        QueryKeywordGroup(
            label="domain-context",
            keywords=list(dict.fromkeys(domain_terms)),
            rationale="保留学科上下文，减少跨领域噪声。",
        ),
    ]

    date_clause = ""
    if project.yearStart or project.yearEnd:
        start = project.yearStart or "any"
        end = project.yearEnd or "now"
        date_clause = f" ({start} to {end})"

    search_queries = [
        SearchQuery(
            source=source,
            query=f"{aliases[0]} AND {goal_terms[0]}{date_clause}",
            rationale="第一轮用核心主题词和目标词快速形成候选论文池。",
        )
        for source in project.sources
    ]

    source_strategy = [
        SourceStrategy(
            source="openalex",
            rationale="覆盖面广，适合首轮论文池扩充和元数据补全。",
            priority=1,
        ),
        SourceStrategy(
            source="semantic_scholar",
            rationale="便于补充引用信息与相关论文推荐。",
            priority=2,
        ),
    ]

    notes = [
        "当前 Query Planner 为启发式版本，后续替换为可编辑的结构化规划器。",
        "关键词组应在前端允许人工微调，再进入正式检索流程。",
    ]

    return QueryPlan(
        projectId=project.id,
        keywordGroups=keyword_groups,
        searchQueries=search_queries,
        sourceStrategy=source_strategy,
        notes=notes,
    )

