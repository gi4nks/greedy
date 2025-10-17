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
};

type GraphNodeWithVisuals = GraphNode & {
  color: string;
  val: number;
};

type GraphEdgeWithLabel = GraphEdge & {
  label: string;
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

const NODE_COLOR_CLASSES: Record<GraphNode["type"], string> = {
  campaign: "bg-indigo-500",
  adventure: "bg-sky-400",
  session: "bg-orange-400",
  quest: "bg-amber-300",
  character: "bg-emerald-500",
  location: "bg-rose-400",
  npc: "bg-violet-500",
  magicItem: "bg-pink-400",
};

export function CampaignNetwork({ campaignId }: CampaignNetworkProps) {
  const router = useRouter();
  const graphRef = useRef<ForceGraphInstance | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const storageKey = `campaign-network-layout-${campaignId}`;
  const [graphData, setGraphData] = useState<GraphResponse | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fixedPositions, setFixedPositions] = useState<
    Record<string, { x: number; y: number }>
  >(() => {
    if (typeof window === "undefined") {
      return {};
    }

    try {
      const stored = window.localStorage.getItem(storageKey);
      return stored
        ? (JSON.parse(stored) as Record<string, { x: number; y: number }>)
        : {};
    } catch (err) {
      console.warn("Failed to read stored network layout", err);
      return {};
    }
  });
  const [simulationPaused, setSimulationPaused] = useState(false);
  const [canvasSize, setCanvasSize] = useState<{
    width: number;
    height: number;
  }>(() => ({ width: 0, height: 0 }));

  const persistPositions = useCallback(
    (positions: Record<string, { x: number; y: number }>) => {
      if (typeof window === "undefined") {
        return;
      }

      try {
        window.localStorage.setItem(storageKey, JSON.stringify(positions));
      } catch (err) {
        console.warn("Unable to persist network layout", err);
      }
    },
    [storageKey],
  );

  const fetchNetwork = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/campaigns/${campaignId}/network`, {
        cache: "no-store",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Failed to load network data");
      }

      const payload = (await response.json()) as GraphResponse;
      setGraphData(payload);

      // Prefer a non-campaign node as initial selection when available
      const preferredNode = payload.nodes.find((n) => n.type !== "campaign");
      setSelectedNode(preferredNode ?? payload.nodes[0] ?? null);
    } catch (err) {
      console.error("Failed to fetch campaign network:", err);
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchNetwork();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const container = canvasContainerRef.current;

    if (!container) {
      return;
    }

    const updateSize = () => {
      setCanvasSize({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };

    updateSize();

    const observer = new ResizeObserver(() => {
      updateSize();
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);

  const processedData: ForceGraphGraphData = useMemo(() => {
    if (!graphData) {
      return { nodes: [], links: [] };
    }

    const nodes = graphData.nodes.map<ForceGraphNode>((node) => {
      const stored = fixedPositions[node.id];
      const storedX = stored?.x;
      const storedY = stored?.y;

      return {
        ...node,
        color: NODE_COLORS[node.type],
        val: NODE_SIZES[node.type],
        ...(storedX !== undefined && storedY !== undefined
          ? { fx: storedX, fy: storedY, x: storedX, y: storedY }
          : {}),
      };
    });

    const links = graphData.edges.map<ForceGraphLink>((edge) => ({
      ...edge,
      label: edge.relation,
    }));

    return { nodes, links };
  }, [graphData, fixedPositions]);

  // Memoize expensive callback functions
  const nodeCanvasObject = useCallback(
    (
      node: ForceGraphNode,
      ctx: CanvasRenderingContext2D,
      globalScale: number,
    ) => {
      const label = node.name;
      const fontSize = 12 / globalScale;
      const radius = Math.max(4, node.val);
      const isSelected = selectedNode?.id === node.id;

      // Draw selection ring if selected
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(node.x ?? 0, node.y ?? 0, radius + 3, 0, 2 * Math.PI, false);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(node.x ?? 0, node.y ?? 0, radius + 3, 0, 2 * Math.PI, false);
        ctx.strokeStyle = node.color;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(node.x ?? 0, node.y ?? 0, radius, 0, 2 * Math.PI, false);
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

  const onNodeClick = useCallback(
    (node: ForceGraphNode) => {
      if (graphData) {
        const canonicalNode =
          graphData.nodes.find((n) => n.id === node.id) ?? null;
        setSelectedNode(canonicalNode);
      }
    },
    [graphData],
  );

  const onNodeHover = useCallback(
    (node: ForceGraphNode | null) => {
      document.body.style.cursor = node ? "pointer" : "default";
    },
    [],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        setFixedPositions(
          JSON.parse(stored) as Record<string, { x: number; y: number }>,
        );
      } else {
        setFixedPositions({});
      }
    } catch (err) {
      console.warn("Failed to refresh stored network layout", err);
      setFixedPositions({});
    }
  }, [storageKey]);

  const handleEngineStop = useCallback(() => {
    const nodes = processedData.nodes;

    if (!nodes.length) {
      return;
    }

    const nextPositions: Record<string, { x: number; y: number }> = {};

    nodes.forEach((node) => {
      const x = typeof node.x === "number" ? node.x : 0;
      const y = typeof node.y === "number" ? node.y : 0;

      node.fx = x;
      node.fy = y;
      node.vx = 0;
      node.vy = 0;

      nextPositions[node.id] = { x, y };
    });

    graphRef.current?.pauseAnimation();
    setSimulationPaused(true);

    setFixedPositions(() => {
      persistPositions(nextPositions);
      return nextPositions;
    });
  }, [persistPositions, processedData]);

  const handleNodeDrag = useCallback((node: ForceGraphNode) => {
    // Allow continuous dragging by unfixing at the start of drag.
    delete node.fx;
    delete node.fy;
    graphRef.current?.resumeAnimation();

    node.fx = node.x;
    node.fy = node.y;
  }, []);

  const handleNodeDragEnd = useCallback(
    (node: ForceGraphNode) => {
      node.fx = node.x;
      node.fy = node.y;
      node.vx = 0;
      node.vy = 0;

      const x = typeof node.x === "number" ? node.x : 0;
      const y = typeof node.y === "number" ? node.y : 0;

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

    if (nodes.length) {
      nodes.forEach((node) => {
        delete node.fx;
        delete node.fy;
        delete node.vx;
        delete node.vy;
      });
    }

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

    if (!instance) {
      return;
    }

    const currentZoom = instance.zoom() ?? 1;
    const nextZoom = currentZoom * multiplier;
    instance.zoom(nextZoom, 300);
  }, []);

  const handleZoomIn = useCallback(() => {
    handleZoom(1.2);
  }, [handleZoom]);

  const handleZoomOut = useCallback(() => {
    handleZoom(1 / 1.2);
  }, [handleZoom]);

  const handleCenterView = useCallback(() => {
    graphRef.current?.zoomToFit(400, 40);
  }, []);

  const renderSelectedNodeDetails = () => {
    if (!selectedNode) {
      return (
        <p className="text-sm text-base-content/70">
          Select a node to see details.
        </p>
      );
    }

    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span
              className={cn(
                "inline-flex h-3 w-3 rounded-full",
                NODE_COLOR_CLASSES[selectedNode.type],
              )}
            />
            {selectedNode.name}
          </h3>
          <Badge variant="outline" className="capitalize mt-2">
            {selectedNode.type.replace(/([A-Z])/g, " $1")}
          </Badge>
        </div>

        {selectedNode.href && (
          <Button size="sm" onClick={() => router.push(selectedNode.href!)}>
            Open detail view
          </Button>
        )}

        {selectedNode.data && Object.keys(selectedNode.data).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-base-content/80">
              Metadata
            </h4>
            <dl className="grid grid-cols-1 gap-2 text-sm">
              {Object.entries(selectedNode.data).map(([key, value]) => (
                <div key={key} className="flex flex-col">
                  <span className="text-xs uppercase text-base-content/60">
                    {key}
                  </span>
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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <section className="rounded-2xl border border-base-200 bg-base-100 p-6 shadow-sm">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold">Campaign Network Map</h2>
          <p className="text-base-content/70">
            Explore the relationships between adventures, sessions, characters,
            and more. Drag nodes to rearrange the map and use the tools to
            refine the layout.
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
                  Keep nodes in place with the layout tools or reset the
                  simulation for a fresh view.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={isLoading}
                >
                  <ZoomOut className="mr-2 h-4 w-4" />
                  Zoom Out
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={isLoading}
                >
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
                  disabled={isLoading}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </div>
            {error && (
              <div className="rounded-lg bg-error/10 p-4 text-sm text-error">
                {error}
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl bg-base-200 p-4 shadow-lg">
              <div
                ref={canvasContainerRef}
                className="relative h-[400px] w-full rounded-xl bg-base-100 sm:h-[500px] lg:h-[600px]"
              >
                <ForceGraph2D
                  ref={graphRef}
                  width={canvasSize.width || undefined}
                  height={canvasSize.height || 600}
                  graphData={processedData}
                  backgroundColor="transparent"
                  nodeLabel={(node: ForceGraphNode) =>
                    `${node.name} (${node.type})`
                  }
                  nodeCanvasObject={nodeCanvasObject}
                  linkColor={() => "rgba(148, 163, 184, 0.7)"}
                  linkLabel={(link: ForceGraphLink) => link.label}
                  linkDirectionalArrowLength={4}
                  linkDirectionalArrowRelPos={1}
                  linkDirectionalParticles={1}
                  linkDirectionalParticleSpeed={0.005}
                  cooldownTicks={100}
                  d3AlphaDecay={0.02}
                  d3VelocityDecay={0.3}
                  onNodeClick={onNodeClick}
                  onNodeHover={onNodeHover}
                  onNodeDrag={handleNodeDrag}
                  onNodeDragEnd={handleNodeDragEnd}
                  onEngineStop={handleEngineStop}
                />

                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-base-100/80">
                    <span className="loading loading-spinner loading-lg text-primary" />
                  </div>
                )}

                {!isLoading && processedData.nodes.length === 0 && !error && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl bg-base-100/80 text-center text-base-content/70">
                    <p className="text-lg font-semibold text-base-content">
                      No entities connected yet
                    </p>
                    <p className="text-sm">
                      Add adventures, characters, or sessions to see them mapped
                      here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full border border-base-200 bg-base-100">
          <CardHeader className="border-b border-base-200 pb-4">
            <CardTitle>Node Details</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {renderSelectedNodeDetails()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
