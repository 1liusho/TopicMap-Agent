"use client";

import { useMemo, useState } from "react";

import { GraphEdge, GraphNode, GraphPayload } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";

type GraphWorkbenchProps = {
  graph: GraphPayload;
};

const nodeTypes: GraphNode["type"][] = [
  "Paper",
  "Method",
  "Metric",
  "Problem",
  "Application"
];

const toneByType: Record<GraphNode["type"], string> = {
  Paper: "border-slate-300 bg-slate-50 text-slate-900",
  Method: "border-emerald-200 bg-emerald-50 text-emerald-900",
  Metric: "border-sky-200 bg-sky-50 text-sky-900",
  Problem: "border-amber-200 bg-amber-50 text-amber-900",
  Application: "border-violet-200 bg-violet-50 text-violet-900",
  DatasetOrExperiment: "border-teal-200 bg-teal-50 text-teal-900",
  Claim: "border-rose-200 bg-rose-50 text-rose-900"
};

export function GraphWorkbench({ graph }: GraphWorkbenchProps) {
  const [activeTypes, setActiveTypes] = useState<GraphNode["type"][]>(nodeTypes);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    graph.nodes[0]?.id ?? null
  );
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  const filteredNodes = useMemo(
    () => graph.nodes.filter((node) => activeTypes.includes(node.type)),
    [activeTypes, graph.nodes]
  );

  const visibleNodeIds = useMemo(
    () => new Set(filteredNodes.map((node) => node.id)),
    [filteredNodes]
  );

  const filteredEdges = useMemo(
    () =>
      graph.edges.filter(
        (edge) =>
          visibleNodeIds.has(edge.sourceNodeId) && visibleNodeIds.has(edge.targetNodeId)
      ),
    [graph.edges, visibleNodeIds]
  );

  const groupedNodes = useMemo(
    () =>
      nodeTypes.map((type) => ({
        type,
        items: filteredNodes.filter((node) => node.type === type)
      })),
    [filteredNodes]
  );

  const selectedNode =
    filteredNodes.find((node) => node.id === selectedNodeId) ?? filteredNodes[0] ?? null;
  const selectedEdge = selectedEdgeId
    ? filteredEdges.find((edge) => edge.id === selectedEdgeId) ?? null
    : null;

  const evidenceLookup = useMemo(
    () => new Map(graph.evidenceSpans.map((span) => [span.id, span])),
    [graph.evidenceSpans]
  );
  const nodeLookup = useMemo(
    () => new Map(graph.nodes.map((node) => [node.id, node])),
    [graph.nodes]
  );

  function toggleType(type: GraphNode["type"]) {
    setActiveTypes((current) =>
      current.includes(type)
        ? current.filter((item) => item !== type)
        : [...current, type]
    );
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[240px_minmax(0,1fr)_320px]">
      <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
        <h2 className="text-base font-semibold text-ink">图谱过滤</h2>
        <p className="mt-1 text-sm leading-6 text-steel">
          按节点类型筛选当前图谱，并查看核心统计。
        </p>

        <div className="mt-5 grid gap-2">
          {nodeTypes.map((type) => {
            const enabled = activeTypes.includes(type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleType(type)}
                className={`rounded-md border px-3 py-2 text-left text-sm transition ${
                  enabled
                    ? "border-slate-900 bg-slate-950 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>

        <div className="mt-6 grid gap-3">
          <MetricTile label="节点数" value={String(filteredNodes.length)} />
          <MetricTile label="关系数" value={String(filteredEdges.length)} />
          <MetricTile label="证据数" value={String(graph.evidenceSpans.length)} />
        </div>
      </aside>

      <div className="grid gap-6">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-ink">图谱主视图</h2>
              <p className="mt-1 text-sm leading-6 text-steel">
                这一版先用结构化节点带和关系列表承载图谱数据，下一步可以切换到 React
                Flow。
              </p>
            </div>
            <StatusBadge tone="neutral">{graph.generatedAt}</StatusBadge>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {groupedNodes.map((group) => (
              <div key={group.type} className="grid gap-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {group.type}
                </div>
                {group.items.length === 0 ? (
                  <div className="rounded-md border border-dashed border-slate-300 px-3 py-5 text-sm text-slate-500">
                    当前筛选下没有 {group.type} 节点。
                  </div>
                ) : (
                  group.items.map((node) => (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => {
                        setSelectedNodeId(node.id);
                        setSelectedEdgeId(null);
                      }}
                      className={`rounded-md border px-3 py-3 text-left text-sm transition ${
                        selectedNode?.id === node.id
                          ? "border-slate-900 bg-slate-950 text-white"
                          : toneByType[node.type]
                      }`}
                    >
                      <div className="font-medium">{node.label}</div>
                      {node.type === "Paper" ? (
                        <div className="mt-1 text-xs opacity-80">
                          {String(node.properties.year ?? "-")} ·{" "}
                          {String(node.properties.venue ?? "Unknown")}
                        </div>
                      ) : null}
                    </button>
                  ))
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
          <h2 className="text-base font-semibold text-ink">关系视图</h2>
          <div className="mt-4 grid gap-3">
            {filteredEdges.map((edge) => {
              const source = nodeLookup.get(edge.sourceNodeId);
              const target = nodeLookup.get(edge.targetNodeId);
              return (
                <button
                  key={edge.id}
                  type="button"
                  onClick={() => {
                    setSelectedEdgeId(edge.id);
                    setSelectedNodeId(null);
                  }}
                  className={`rounded-md border px-4 py-3 text-left text-sm transition ${
                    selectedEdge?.id === edge.id
                      ? "border-slate-900 bg-slate-950 text-white"
                      : "border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300"
                  }`}
                >
                  <div className="font-medium">
                    {source?.label ?? edge.sourceNodeId} → {target?.label ?? edge.targetNodeId}
                  </div>
                  <div className="mt-1 text-xs opacity-80">
                    关系：{edge.type} · 置信度：{edge.confidence.toFixed(2)} · 证据：
                    {edge.evidenceSpanIds.length}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
        <h2 className="text-base font-semibold text-ink">详情面板</h2>
        {selectedEdge ? (
          <div className="mt-4 grid gap-4">
            <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="text-sm font-medium text-slate-900">
                {nodeLookup.get(selectedEdge.sourceNodeId)?.label} →{" "}
                {nodeLookup.get(selectedEdge.targetNodeId)?.label}
              </div>
              <div className="mt-2 text-sm leading-6 text-slate-600">
                关系类型：{selectedEdge.type}
                <br />
                置信度：{selectedEdge.confidence.toFixed(2)}
                <br />
                抽取方式：{selectedEdge.extractionMethod}
              </div>
            </div>

            <div className="grid gap-3">
              <div className="text-sm font-semibold text-slate-900">证据片段</div>
              {selectedEdge.evidenceSpanIds.map((evidenceId) => {
                const evidence = evidenceLookup.get(evidenceId);
                if (!evidence) {
                  return null;
                }
                return (
                  <article
                    key={evidence.id}
                    className="rounded-md border border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-700"
                  >
                    {evidence.text}
                    <div className="mt-2 text-xs text-slate-500">
                      {evidence.sourceType} · {evidence.section || "unknown section"}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ) : selectedNode ? (
          <div className="mt-4 grid gap-4">
            <div
              className={`rounded-md border px-4 py-4 ${
                toneByType[selectedNode.type]
              }`}
            >
              <div className="text-sm font-semibold">{selectedNode.label}</div>
              <div className="mt-2 text-xs uppercase tracking-wide opacity-80">
                {selectedNode.type}
              </div>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="text-sm font-semibold text-slate-900">节点属性</div>
              <dl className="mt-3 grid gap-3 text-sm">
                {Object.entries(selectedNode.properties).map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">{key}</dt>
                    <dd className="mt-1 break-words text-slate-700">
                      {Array.isArray(value) ? value.join(", ") : String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm leading-6 text-slate-600">
            选择一个节点或关系后，这里会展示更详细的信息。
          </p>
        )}
      </aside>
    </section>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-semibold text-slate-950">{value}</div>
    </div>
  );
}
