export type ProjectStatus = "draft" | "planned" | "running" | "completed" | "failed";

export type Project = {
  id: string;
  topic: string;
  goal?: string | null;
  domain?: string | null;
  yearStart?: number | null;
  yearEnd?: number | null;
  sources: string[];
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
};

export type QueryKeywordGroup = {
  label: string;
  keywords: string[];
  rationale: string;
};

export type SearchQuery = {
  source: string;
  query: string;
  rationale: string;
};

export type SourceStrategy = {
  source: string;
  rationale: string;
  priority: number;
};

export type QueryPlan = {
  projectId: string;
  keywordGroups: QueryKeywordGroup[];
  searchQueries: SearchQuery[];
  sourceStrategy: SourceStrategy[];
  notes: string[];
};

export type ProjectRun = {
  id: string;
  projectId: string;
  stage: string;
  status: "queued" | "running" | "completed" | "failed";
  startedAt: string;
  finishedAt?: string | null;
  errorMessage?: string | null;
  stats: Record<string, string | number | boolean | null>;
};

export type Paper = {
  id: string;
  title: string;
  authors: string[];
  year?: number | null;
  venue?: string | null;
  doi?: string | null;
  abstract?: string | null;
  url?: string | null;
  citationCount?: number | null;
  sourceIds: string[];
  relevanceScore?: number | null;
  qualityScore?: number | null;
  isKept: boolean;
};

export type EvidenceSpan = {
  id: string;
  paperId: string;
  text: string;
  page?: number | null;
  section?: string | null;
  sourceType: "abstract" | "pdf" | "metadata";
};

export type GraphNode = {
  id: string;
  projectId: string;
  type:
    | "Paper"
    | "Method"
    | "Metric"
    | "Problem"
    | "Application"
    | "DatasetOrExperiment"
    | "Claim";
  label: string;
  properties: Record<string, unknown>;
};

export type GraphEdge = {
  id: string;
  projectId: string;
  sourceNodeId: string;
  targetNodeId: string;
  type: string;
  confidence: number;
  evidenceSpanIds: string[];
  extractionMethod: "model" | "rule" | "human";
};

export type GraphPayload = {
  projectId: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  evidenceSpans: EvidenceSpan[];
  stats: Record<string, number>;
  generatedAt: string;
};

export type CitationItem = {
  paperId: string;
  title: string;
  authors: string[];
  year?: number | null;
  venue?: string | null;
  doi?: string | null;
};

export type ReportSection = {
  id: string;
  title: string;
  content: string;
};

export type ReportPayload = {
  projectId: string;
  summary: string;
  sections: ReportSection[];
  researchGaps: string[];
  citations: CitationItem[];
  markdown: string;
  generatedAt: string;
};
