"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ForwardRefExoticComponent, RefAttributes } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import type { GraphData, LinkObject, NodeObject } from "force-graph";
import type {
  ForceGraphMethods,
  ForceGraphProps as ForceGraph2DProps,
} from "react-force-graph-2d";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Orbit, RefreshCw, Target, ZoomIn, ZoomOut } from "lucide-react";

type GraphNode = {
  id: string;
  type:
    | "campaign"
    | "adventure"
    | "session"
    | "quest"
    | "character"
    | "location"
    | "npc"
    | "magicItem";
  name: string;
  href?: string | null;
  data?: Record<string, unknown>;
};

type GraphEdge = {
  id: string;
  source: string;
  target: string;
  relation: string;
  data?: Record<string, unknown>;
};

type GraphResponse = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

type CampaignNetworkProps = {
  campaignId: number;
  showRelationships?: boolean;
  onToggleRelationships?: (show: boolean) => void;
};

type GraphNodeWithVisuals = GraphNode & {
  color: string;
  val: number;
};

type GraphEdgeWithLabel = GraphEdge & {
  label: string;
  data?: {
    description?: string | null;
    bidirectional?: boolean | null;
    isRelationship?: boolean;
  };
};

type ForceGraphNode = NodeObject & GraphNodeWithVisuals;
type ForceGraphLink = LinkObject<ForceGraphNode> & GraphEdgeWithLabel;
type ForceGraphGraphData = GraphData<ForceGraphNode, ForceGraphLink>;

type ForceGraphInstance = ForceGraphMethods<
  GraphNodeWithVisuals,
  GraphEdgeWithLabel
> & {
  refresh?: () => void;
};

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
}) as ForwardRefExoticComponent<
  ForceGraph2DProps<GraphNodeWithVisuals, GraphEdgeWithLabel> &
    RefAttributes<ForceGraphInstance>
>;

const NODE_COLORS: Record<GraphNode["type"], string> = {
  campaign: "#6366f1",
  adventure: "#38bdf8",
  session: "#f97316",
  quest: "#facc15",
  character: "#22c55e",
  location: "#fb7185",
  npc: "#a855f7",
  magicItem: "#f472b6",
};

const NODE_COLOR_CLASSES: Record<GraphNode["type"], string> = {
  campaign: "bg-indigo-500",
  adventure: "bg-sky-500",
  session: "bg-orange-500",
  quest: "bg-yellow-500",
  character: "bg-green-500",
  location: "bg-rose-500",
  npc: "bg-purple-500",
  magicItem: "bg-pink-500",
};

const NODE_SIZES: Record<GraphNode["type"], number> = {
  campaign: 14,
  adventure: 10,
  session: 8,
  quest: 8,
  character: 9,
  location: 9,
  npc: 8,
  magicItem: 7,
};

const RELATIONSHIP_COLORS: Record<string, string> = {
  ally: "#22c55e",
  enemy: "#ef4444",
  mentor: "#3b82f6",
  family: "#eab308",
  parent: "#eab308",
  child: "#eab308",
  friend: "#22c55e",
  rival: "#ef4444",
  companion: "#8b5cf6",
  guardian: "#8b5cf6",
  ward: "#8b5cf6",
  leader: "#f59e0b",
  follower: "#f59e0b",
  owner: "#6b7280",
  property: "#6b7280",
  creator: "#ec4899",
  creation: "#ec4899",
  teacher: "#3b82f6",
  lover: "#ec4899",
  spouse: "#ec4899",
  "belongs-to": "#6b7280",
  "located-at": "#6b7280",
  "member-of": "#6b7280",
};

export function CampaignNetwork({
  campaignId,
  showRelationships = false,
  onToggleRelationships,
}: CampaignNetworkProps) {
  const router = useRouter();
  const graphRef = useRef<ForceGraphInstance | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const storageKey = `campaign-network-layout-${campaignId}`;

  const [graphData, setGraphData] = useState<GraphResponse | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [simulationPaused, setSimulationPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const isDraggingRef = useRef(false);

  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  const [fixedPositions, setFixedPositions] = useState<
    Record<string, { x: number; y: number }>
  >(() => {
    if (typeof window === "undefined") return {};
    try {
      const stored = window.localStorage.getItem(storageKey);
      return stored
        ? (JSON.parse(stored) as Record<string, { x: number; y: number }>)
        : {};
    } catch {
      return {};
    }
  });

  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const persistPositions = useCallback(
    (positions: Record<string, { x: number; y: number }>) => {
      if (typeof window === "undefined") return;
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(positions));
      } catch {
        console.warn("Unable to persist network layout");
      }
    },
    [storageKey],
  );

  const fetchNetwork = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/campaigns/${campaignId}/network?includeRelationships=true`,
        { cache: "no-store" },
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Failed to load network data");
      }

      const payload = (await response.json()) as GraphResponse;
      setGraphData(payload);

      const preferredNode = payload.nodes.find((n) => n.type !== "campaign");
      setSelectedNode(preferredNode ?? payload.nodes[0] ?? null);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchNetwork();
  }, [campaignId]);

  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const updateSize = () =>
      setCanvasSize({
        width: container.clientWidth,
        height: container.clientHeight,
      });

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const processedData: ForceGraphGraphData = useMemo(() => {
    if (!graphData) return { nodes: [], links: [] };

    const nodes = graphData.nodes.map<ForceGraphNode>((node) => {
      const stored = fixedPositions[node.id];
      return {
        ...node,
        color: NODE_COLORS[node.type],
        val: NODE_SIZES[node.type],
        ...(stored ? { fx: stored.x, fy: stored.y, x: stored.x, y: stored.y } : {}),
      };
    });

    const links = graphData.edges
      .filter(
        (edge) => !edge.data?.isRelationship || (edge.data?.isRelationship && showRelationships),
      )
      .map<ForceGraphLink>((edge) => ({ ...edge, label: edge.relation }));

    return { nodes, links };
  }, [graphData, fixedPositions, showRelationships]);

  const nodeCanvasObject = useCallback(
    (node: ForceGraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const label = node.name;
      const fontSize = 12 / globalScale;
      const radius = Math.max(4, node.val);
      const isSelected = selectedNode?.id === node.id;

      if (isSelected) {
        ctx.beginPath();
        ctx.arc(node.x ?? 0, node.y ?? 0, radius + 3, 0, 2 * Math.PI);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(node.x ?? 0, node.y ?? 0, radius + 3, 0, 2 * Math.PI);
        ctx.strokeStyle = node.color;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(node.x ?? 0, node.y ?? 0, radius, 0, 2 * Math.PI);
      ctx.fillStyle = node.color;
      ctx.fill();

      ctx.font = `${fontSize}px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = "#1f2937";
      ctx.fillText(label, node.x ?? 0, (node.y ?? 0) + radius + 2);
    },
    [selectedNode],
  );

  // ✅ fixed: clicking always updates details
  const onNodeClick = useCallback((node: ForceGraphNode) => {
    // Only skip if currently dragging, not if in cooldown
    if (isDraggingRef.current) {
      return;
    }
    setSelectedNode(node as GraphNode);
  }, []);

  const onNodeHover = useCallback((node: ForceGraphNode | null) => {
    document.body.style.cursor = node ? "pointer" : "default";
  }, []);

  const handleEngineStop = useCallback(() => {
    const nodes = processedData.nodes;
    if (!nodes.length) return;

    const nextPositions: Record<string, { x: number; y: number }> = {};
    nodes.forEach((node) => {
      const x = node.x ?? 0;
      const y = node.y ?? 0;
      node.fx = x;
      node.fy = y;
      nextPositions[node.id] = { x, y };
    });

    graphRef.current?.pauseAnimation();
    setSimulationPaused(true);
    setFixedPositions(() => {
      persistPositions(nextPositions);
      return nextPositions;
    });
  }, [persistPositions, processedData]);

  const handleNodeDrag = useCallback(
    (node: ForceGraphNode) => {
      setIsDragging(true);
      // Update selection to the node being dragged
      setSelectedNode(node as GraphNode);
    },
    [],
  );

  const handleNodeDragEnd = useCallback(
    (node: ForceGraphNode) => {
      setIsDragging(false);

      node.fx = node.x;
      node.fy = node.y;
      node.vx = 0;
      node.vy = 0;

      const x = node.x ?? 0;
      const y = node.y ?? 0;

      setFixedPositions((prev) => {
        const next = { ...prev, [node.id]: { x, y } };
        persistPositions(next);
        return next;
      });

      graphRef.current?.pauseAnimation();
    },
    [persistPositions],
  );

  const handleResetLayout = useCallback(() => {
    const nodes = processedData.nodes;
    nodes.forEach((node) => {
      delete node.fx;
      delete node.fy;
      delete node.vx;
      delete node.vy;
    });

    setFixedPositions(() => {
      persistPositions({});
      return {};
    });

    setSimulationPaused(false);
    graphRef.current?.resumeAnimation();
    graphRef.current?.d3ReheatSimulation();
  }, [persistPositions, processedData]);

  const handleZoom = useCallback((multiplier: number) => {
    const instance = graphRef.current;
    if (!instance) return;
    const currentZoom = instance.zoom() ?? 1;
    instance.zoom(currentZoom * multiplier, 300);
  }, []);

  const handleZoomIn = useCallback(() => handleZoom(1.2), [handleZoom]);
  const handleZoomOut = useCallback(() => handleZoom(1 / 1.2), [handleZoom]);
  const handleCenterView = useCallback(() => graphRef.current?.zoomToFit(400, 40), []);

  const renderSelectedNodeDetails = () => {
    if (!selectedNode) {
      return <p className="text-sm text-base-content/70">Select a node to see details.</p>;
    }

    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span
              className={cn("inline-flex h-3 w-3 rounded-full", NODE_COLOR_CLASSES[selectedNode.type])}
            />
            {selectedNode.name}
          </h3>
          <Badge variant="outline" className="capitalize mt-2">
            {selectedNode.type}
          </Badge>
        </div>

        {selectedNode.href && (
          <Button size="sm" onClick={() => router.push(selectedNode.href!)}>
            Open detail view
          </Button>
        )}

        {selectedNode.data && Object.keys(selectedNode.data).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-base-content/80">Metadata</h4>
            <dl className="grid grid-cols-1 gap-2 text-sm">
              {Object.entries(selectedNode.data).map(([key, value]) => (
                <div key={key} className="flex flex-col">
                  <span className="text-xs uppercase text-base-content/60">{key}</span>
                  <span className="text-base-content/80">
                    {typeof value === "string" || typeof value === "number"
                      ? value
                      : JSON.stringify(value)}
                  </span>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 relative">
      {showRelationships && (
        <div className="absolute top-4 right-4 bg-base-100/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-base-200 z-10 max-w-xs">
          <h3 className="text-sm font-semibold mb-2">Relationship Legend</h3>
          <div className="grid grid-cols-1 gap-1 text-xs max-h-48 overflow-y-auto">
            {Object.entries(RELATIONSHIP_COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-2">
                <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor: color }}></div>
                <span className="capitalize text-base-content/80">
                  {type.replace("-", " ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <section className="rounded-2xl border border-base-200 bg-base-100 p-6 shadow-sm">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold">Campaign Network Map</h2>
          <p className="text-base-content/70">
            Explore the relationships between adventures, sessions, characters, and more. Drag nodes
            to rearrange the map and use the tools to refine the layout.
          </p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="flex flex-col border border-base-200 bg-base-100">
          <CardHeader className="gap-4 border-b border-base-200 pb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl">Network Overview</CardTitle>
                <p className="text-sm text-base-content/70">
                  Keep nodes in place with the layout tools or reset the simulation for a fresh view.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button
                  variant={showRelationships ? "default" : "outline"}
                  size="sm"
                  onClick={() => onToggleRelationships?.(!showRelationships)}
                  disabled={isLoading}
                >
                  {showRelationships ? "Hide" : "Show"} Relationships
                </Button>
                <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={isLoading}>
                  <ZoomOut className="mr-2 h-4 w-4" />
                  Zoom Out
                </Button>
                <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={isLoading}>
                  <ZoomIn className="mr-2 h-4 w-4" />
                  Zoom In
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCenterView}
                  disabled={isLoading || !graphData}
                >
                  <Target className="mr-2 h-4 w-4" />
                  Reset View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetLayout}
                  title="Re-run the layout simulation"
                  disabled={isLoading || !graphData}
                >
                  <Orbit className="mr-2 h-4 w-4" />
                  {simulationPaused ? "Adjust Layout" : "Running..."}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void fetchNetwork()}
                  title="Reload network data"
                  disabled={isLoading}
                >
                  <RefreshCw
                    className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")}
                  />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 min-h-[600px]">
            <div ref={canvasContainerRef} className="relative h-[600px] w-full">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-base-100/80">
                  <div className="flex flex-col items-center gap-2">
                    <RefreshCw className="h-6 w-6 animate-spin text-base-content/60" />
                    <p className="text-sm text-base-content/70">Loading network...</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-red-500 text-sm">{error}</p>
                </div>
              )}

              {!isLoading && !error && processedData && (
                <ForceGraph2D
                  ref={graphRef}
                  width={canvasSize.width}
                  height={canvasSize.height}
                  graphData={processedData}
                  nodeLabel="name"
                  nodeCanvasObject={nodeCanvasObject}
                  onNodeClick={onNodeClick}
                  onNodeHover={onNodeHover}
                  onNodeDrag={handleNodeDrag}
                  onNodeDragEnd={handleNodeDragEnd}
                  onEngineStop={handleEngineStop}
                  linkWidth={0.8}
                  linkDirectionalParticles={0}
                  linkDirectionalParticleWidth={0}
                  linkColor={(link) =>
                    RELATIONSHIP_COLORS[link.relation] || "#6b7280"
                  }
                  enableNodeDrag
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-base-200 bg-base-100">
          <CardHeader>
            <CardTitle>Node Details</CardTitle>
          </CardHeader>
          <CardContent>{renderSelectedNodeDetails()}</CardContent>
        </Card>
      </div>
    </div>
  );
}
