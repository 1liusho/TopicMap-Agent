"use client";

import { useMemo, useState } from "react";

import { GraphNode, GraphPayload, Project } from "@/lib/types";
import { SiteHeader } from "@/components/site-header";

type PlacedNode = GraphNode & {
  left: number;
  top: number;
  radius: number;
  color: string;
};

const typeMeta: Record<GraphNode["type"], { color: string; label: string; radius: number }> = {
  Paper: { color: "#06b6d4", label: "论文", radius: 16 },
  Method: { color: "#6366f1", label: "方法", radius: 22 },
  Metric: { color: "#10b981", label: "指标", radius: 18 },
  Problem: { color: "#f59e0b", label: "问题", radius: 18 },
  Application: { color: "#8b5cf6", label: "应用", radius: 18 },
  DatasetOrExperiment: { color: "#0ea5e9", label: "实验", radius: 16 },
  Claim: { color: "#f43f5e", label: "结论", radius: 16 }
};

export function KnowledgeGraphView({
  project,
  graph
}: {
  project: Project;
  graph: GraphPayload;
}) {
  const [zoom, setZoom] = useState(1);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(graph.nodes[0]?.id ?? null);

  const placedNodes = useMemo(() => buildNodeLayout(graph.nodes), [graph.nodes]);
  const nodeById = useMemo(
    () => new Map(placedNodes.map((node) => [node.id, node])),
    [placedNodes]
  );

  const selectedNode = selectedNodeId ? nodeById.get(selectedNodeId) ?? null : null;
  const relatedNodeIds = useMemo(() => {
    if (!selectedNode) {
      return new Set<string>();
    }
    const related = new Set<string>([selectedNode.id]);
    for (const edge of graph.edges) {
      if (edge.sourceNodeId === selectedNode.id) {
        related.add(edge.targetNodeId);
      }
      if (edge.targetNodeId === selectedNode.id) {
        related.add(edge.sourceNodeId);
      }
    }
    return related;
  }, [graph.edges, selectedNode]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader
        active="graph"
        initialQuery={project.topic}
        projectId={project.id}
        backHref={`/projects/${project.id}/papers`}
        backLabel="返回文献页"
      />

      <div className="flex min-h-[calc(100vh-60px)] flex-1 flex-col md:flex-row">
        <section className="relative min-h-[60vh] flex-1 overflow-hidden bg-[#fafbfd] md:min-h-0">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_95%,rgba(228,230,237,0.6)_100%),linear-gradient(90deg,transparent_95%,rgba(228,230,237,0.6)_100%)] bg-[size:40px_40px]" />

          <div className="absolute bottom-5 left-5 z-10 flex flex-col gap-2 rounded-xl border border-[var(--border2)] bg-white/90 px-4 py-3 text-xs text-[var(--text2)] shadow-[0_2px_12px_rgba(0,0,0,0.04)] backdrop-blur-xl">
            <LegendItem color="#6366f1" label="方法 / 主题节点" />
            <LegendItem color="#06b6d4" label="论文节点" />
            <LegendItem color="#10b981" label="指标 / 应用节点" />
            <LegendItem color="#f59e0b" label="问题节点" />
          </div>

          <div className="absolute bottom-5 right-5 z-10 flex flex-col gap-2">
            <ControlButton onClick={() => setZoom((current) => Math.min(current + 0.1, 1.6))}>
              +
            </ControlButton>
            <ControlButton onClick={() => setZoom((current) => Math.max(current - 0.1, 0.7))}>
              -
            </ControlButton>
            <ControlButton onClick={() => setZoom(1)}>⟳</ControlButton>
          </div>

          <div className="absolute inset-0 overflow-auto">
            <div
              className="relative mx-auto h-[860px] min-w-[820px] origin-center transition"
              style={{ transform: `scale(${zoom})` }}
            >
              <svg className="absolute inset-0 h-full w-full">
                {graph.edges.map((edge) => {
                  const source = nodeById.get(edge.sourceNodeId);
                  const target = nodeById.get(edge.targetNodeId);
                  if (!source || !target) {
                    return null;
                  }
                  const highlighted =
                    selectedNode &&
                    (edge.sourceNodeId === selectedNode.id || edge.targetNodeId === selectedNode.id);
                  return (
                    <line
                      key={edge.id}
                      x1={`${source.left}%`}
                      y1={`${source.top}%`}
                      x2={`${target.left}%`}
                      y2={`${target.top}%`}
                      stroke={highlighted ? "rgba(99,102,241,0.45)" : "rgba(180,185,200,0.38)"}
                      strokeWidth={highlighted ? 2.6 : 1.2}
                    />
                  );
                })}
              </svg>

              {placedNodes.map((node) => {
                const selected = selectedNode?.id === node.id;
                const dimmed = selectedNode && !relatedNodeIds.has(node.id);
                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full text-white shadow-[0_8px_24px_rgba(0,0,0,0.14)] transition ${
                      dimmed ? "opacity-40" : "opacity-100"
                    } ${selected ? "ring-4 ring-white/80" : ""}`}
                    style={{
                      left: `${node.left}%`,
                      top: `${node.top}%`,
                      width: `${node.radius * 2 + 24}px`,
                      height: `${node.radius * 2 + 24}px`,
                      background: `radial-gradient(circle at 35% 35%, ${lighten(node.color)}, ${node.color})`
                    }}
                  >
                    <span className="mx-auto block max-w-[90px] px-2 text-center text-[11px] font-semibold leading-4">
                      {node.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <aside className="w-full shrink-0 border-l border-[var(--border2)] bg-white px-7 py-7 md:w-[340px]">
          {selectedNode ? (
            <>
              <h2 className="text-xl font-bold leading-8 text-[var(--text)]">{selectedNode.label}</h2>
              <span
                className="mt-3 inline-block rounded-full px-3 py-1 text-xs font-semibold"
                style={{
                  backgroundColor: `${selectedNode.color}18`,
                  color: selectedNode.color
                }}
              >
                {typeMeta[selectedNode.type].label}
              </span>

              <div className="mt-6 rounded-2xl border border-[var(--border2)] bg-[var(--surface2)] px-4 py-4">
                <div className="text-sm font-semibold text-[var(--text)]">节点属性</div>
                <dl className="mt-3 grid gap-3 text-sm text-[var(--text2)]">
                  {Object.entries(selectedNode.properties).length > 0 ? (
                    Object.entries(selectedNode.properties).map(([key, value]) => (
                      <div key={key}>
                        <dt className="text-[11px] uppercase tracking-[0.08em] text-[var(--text3)]">
                          {key}
                        </dt>
                        <dd className="mt-1 break-words">
                          {Array.isArray(value) ? value.join(", ") : String(value)}
                        </dd>
                      </div>
                    ))
                  ) : (
                    <div>当前节点还没有更多结构化属性。</div>
                  )}
                </dl>
              </div>

              <section className="mt-6 border-t border-[var(--border2)] pt-5">
                <h3 className="text-xs font-semibold tracking-[0.08em] text-[var(--text3)]">
                  关联节点
                </h3>
                <div className="mt-3 grid gap-2">
                  {placedNodes
                    .filter((node) => node.id !== selectedNode.id && relatedNodeIds.has(node.id))
                    .map((node) => (
                      <button
                        key={node.id}
                        type="button"
                        onClick={() => setSelectedNodeId(node.id)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-[var(--text2)] transition hover:bg-[var(--bg)] hover:text-[var(--text)]"
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: node.color }}
                        />
                        {node.label}
                      </button>
                    ))}
                </div>
              </section>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center text-[var(--text3)]">
              <p>点击图谱中的节点</p>
              <p className="mt-1">查看详细信息</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function buildNodeLayout(nodes: GraphNode[]): PlacedNode[] {
  const groups = new Map<GraphNode["type"], GraphNode[]>();
  for (const node of nodes) {
    const current = groups.get(node.type) ?? [];
    current.push(node);
    groups.set(node.type, current);
  }

  const centers: Record<GraphNode["type"], [number, number]> = {
    Method: [50, 24],
    Paper: [50, 52],
    Metric: [22, 76],
    Problem: [78, 74],
    Application: [50, 82],
    DatasetOrExperiment: [18, 48],
    Claim: [82, 46]
  };

  const result: PlacedNode[] = [];
  for (const [type, items] of groups.entries()) {
    const [centerX, centerY] = centers[type] ?? [50, 50];
    const spread = type === "Paper" ? 24 : 12;
    items.forEach((node, index) => {
      const angle = (Math.PI * 2 * index) / Math.max(items.length, 1);
      const ring = items.length > 5 && index % 2 === 0 ? spread * 0.55 : spread;
      result.push({
        ...node,
        left: centerX + Math.cos(angle) * ring,
        top: centerY + Math.sin(angle) * ring,
        radius: typeMeta[node.type].radius,
        color: typeMeta[node.type].color
      });
    });
  }
  return result;
}

function lighten(color: string) {
  const normalized = color.replace("#", "");
  const value = Number.parseInt(normalized, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgb(${Math.min(255, r + 55)} ${Math.min(255, g + 55)} ${Math.min(255, b + 55)})`;
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </div>
  );
}

function ControlButton({
  children,
  onClick
}: {
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[var(--border)] bg-white text-sm font-semibold text-[var(--text2)] shadow-sm transition hover:border-[var(--teal)] hover:text-[var(--teal)]"
    >
      {children}
    </button>
  );
}
