from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class ProjectStatus(str, Enum):
    DRAFT = "draft"
    PLANNED = "planned"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class RunStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class ProjectCreate(BaseModel):
    topic: str = Field(min_length=2)
    goal: str | None = None
    domain: str | None = None
    yearStart: int | None = None
    yearEnd: int | None = None
    sources: list[str] = Field(
        default_factory=lambda: ["openalex", "semantic_scholar"]
    )


class ProjectUpdate(BaseModel):
    goal: str | None = None
    domain: str | None = None
    yearStart: int | None = None
    yearEnd: int | None = None
    sources: list[str] | None = None
    status: ProjectStatus | None = None


class Project(BaseModel):
    id: str
    topic: str
    goal: str | None = None
    domain: str | None = None
    yearStart: int | None = None
    yearEnd: int | None = None
    sources: list[str]
    status: ProjectStatus
    createdAt: str
    updatedAt: str


class QueryKeywordGroup(BaseModel):
    label: str
    keywords: list[str]
    rationale: str


class SearchQuery(BaseModel):
    source: str
    query: str
    rationale: str


class SourceStrategy(BaseModel):
    source: str
    rationale: str
    priority: int


class QueryPlan(BaseModel):
    projectId: str
    keywordGroups: list[QueryKeywordGroup]
    searchQueries: list[SearchQuery]
    sourceStrategy: list[SourceStrategy]
    notes: list[str] = Field(default_factory=list)


class ProjectRun(BaseModel):
    id: str
    projectId: str
    stage: str
    status: RunStatus
    startedAt: str
    finishedAt: str | None = None
    errorMessage: str | None = None
    stats: dict[str, Any] = Field(default_factory=dict)


class Paper(BaseModel):
    id: str
    title: str
    authors: list[str]
    year: int | None = None
    venue: str | None = None
    doi: str | None = None
    abstract: str | None = None
    url: str | None = None
    citationCount: int | None = None
    sourceIds: list[str]
    relevanceScore: float | None = None
    qualityScore: float | None = None
    isKept: bool = True


class PaperUpdate(BaseModel):
    isKept: bool


class EvidenceSourceType(str, Enum):
    ABSTRACT = "abstract"
    PDF = "pdf"
    METADATA = "metadata"


class EvidenceSpan(BaseModel):
    id: str
    paperId: str
    text: str
    page: int | None = None
    section: str | None = None
    sourceType: EvidenceSourceType


class GraphNodeType(str, Enum):
    PAPER = "Paper"
    METHOD = "Method"
    METRIC = "Metric"
    PROBLEM = "Problem"
    APPLICATION = "Application"
    DATASET_OR_EXPERIMENT = "DatasetOrExperiment"
    CLAIM = "Claim"


class ExtractionMethod(str, Enum):
    MODEL = "model"
    RULE = "rule"
    HUMAN = "human"


class GraphNode(BaseModel):
    id: str
    projectId: str
    type: GraphNodeType
    label: str
    properties: dict[str, Any] = Field(default_factory=dict)


class GraphEdge(BaseModel):
    id: str
    projectId: str
    sourceNodeId: str
    targetNodeId: str
    type: str
    confidence: float
    evidenceSpanIds: list[str] = Field(default_factory=list)
    extractionMethod: ExtractionMethod


class GraphPayload(BaseModel):
    projectId: str
    nodes: list[GraphNode] = Field(default_factory=list)
    edges: list[GraphEdge] = Field(default_factory=list)
    evidenceSpans: list[EvidenceSpan] = Field(default_factory=list)
    stats: dict[str, int] = Field(default_factory=dict)
    generatedAt: str


class CitationItem(BaseModel):
    paperId: str
    title: str
    authors: list[str]
    year: int | None = None
    venue: str | None = None
    doi: str | None = None


class ReportSection(BaseModel):
    id: str
    title: str
    content: str


class ReportPayload(BaseModel):
    projectId: str
    summary: str
    sections: list[ReportSection] = Field(default_factory=list)
    researchGaps: list[str] = Field(default_factory=list)
    citations: list[CitationItem] = Field(default_factory=list)
    markdown: str
    generatedAt: str
