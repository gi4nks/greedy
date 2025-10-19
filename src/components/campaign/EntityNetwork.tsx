"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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

type D3Node = GraphNode & {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
};

type D3Link = {
  id: string;
  relation: string;
  source: D3Node;
  target: D3Node;
  data?: Record<string, unknown>;
};

// Node colors
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

// Relationship colors
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
  includes: "#94a3b8",
  hosts: "#94a3b8",
  contains: "#94a3b8",
  "participates_in": "#94a3b8",
  "takes_place_in": "#94a3b8",
  introduces: "#94a3b8",
  owns: "#94a3b8",
  features: "#94a3b8",
};

interface EntityNetworkProps {
  campaignId: number;
}

export function EntityNetwork({ campaignId }: EntityNetworkProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const simulationRef = useRef<d3.Simulation<D3Node, D3Link> | null>(null);
  const selectedNodeRef = useRef<GraphNode | null>(null);
  const [graphData, setGraphData] = useState<GraphResponse | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [showRelationships, setShowRelationships] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Fetch network data
  const fetchNetwork = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/campaigns/${campaignId}/network?includeRelationships=true`,
        { cache: "no-store" }
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
      console.error("Failed to fetch network:", err);
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setIsLoading(false);
    }
  }, [campaignId]);

  // Handle resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      setCanvasSize({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Fetch data on mount
  useEffect(() => {
    void fetchNetwork();
  }, [campaignId, fetchNetwork]);

  // Sync selected node ref to state
  useEffect(() => {
    selectedNodeRef.current = selectedNode;
  }, [selectedNode]);

  // Setup D3 visualization
  useEffect(() => {
    if (
      !svgRef.current ||
      !graphData ||
      canvasSize.width === 0 ||
      canvasSize.height === 0
    ) {
      return;
    }

    // Filter edges based on showRelationships
    const filteredEdges = graphData.edges.filter((edge) => {
      if (!edge.data?.isRelationship) return true;
      return showRelationships;
    });

    // If graph already exists, only update edge visibility
    if (simulationRef.current) {
      const svg = d3.select(svgRef.current);
      const links = svg.selectAll(".link");
      
      const d3Nodes = simulationRef.current.nodes();
      const nodeMap = new Map(d3Nodes.map((n: D3Node) => [n.id, n]));
      const d3Links = filteredEdges.map((edge) => ({
        id: edge.id,
        relation: edge.relation,
        data: edge.data,
        source: nodeMap.get(edge.source)!,
        target: nodeMap.get(edge.target)!,
      }));

      // Update links data
      const updatedLinks = links.data(d3Links, (d: unknown) => (d as D3Link).id);
      updatedLinks.exit().remove();
      updatedLinks.enter().append("line")
        .attr("class", "link")
        .attr("stroke", (d: D3Link) => RELATIONSHIP_COLORS[d.relation] || "#94a3b8")
        .attr("stroke-width", (d: D3Link) => (d.data?.isRelationship ? 2 : 1))
        .attr("opacity", (d: D3Link) => (d.data?.isRelationship ? 0.8 : 0.5))
        .attr("marker-end", (d: D3Link) => (d.data?.isRelationship ? "" : "url(#arrowhead)"));

      return;
    }

    // Create D3 nodes and links
    const d3Nodes: D3Node[] = graphData.nodes.map((node) => ({
      ...node,
      x: Math.random() * canvasSize.width,
      y: Math.random() * canvasSize.height,
    }));

    const nodeMap = new Map(d3Nodes.map(n => [n.id, n]));
    const d3Links: D3Link[] = filteredEdges.map((edge) => ({
      id: edge.id,
      relation: edge.relation,
      data: edge.data,
      source: nodeMap.get(edge.source)!,
      target: nodeMap.get(edge.target)!,
    }));

    // Clear previous simulation
    if (simulationRef.current !== null) {
      (simulationRef.current as d3.Simulation<D3Node, D3Link>).stop();
    }

    // Create force simulation
    const simulation = d3
      .forceSimulation<D3Node>(d3Nodes)
      .force("link", d3.forceLink<D3Node, D3Link>(d3Links).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(canvasSize.width / 2, canvasSize.height / 2))
      .force("collision", d3.forceCollide().radius(40));

    simulationRef.current = simulation;

    // Select SVG
    const svg = d3.select(svgRef.current);

    // Clear previous content
    svg.selectAll("*").remove();

    // Add background
    svg
      .append("rect")
      .attr("width", canvasSize.width)
      .attr("height", canvasSize.height)
      .attr("fill", "#f8fafc")
      .attr("class", "bg");

    // Create container group
    const g = svg.append("g");

    // Add links
    const links = g
      .selectAll(".link")
      .data(d3Links, (d: unknown) => (d as D3Link).id)
      .enter()
      .append("line")
      .attr("class", "link")
      .attr("stroke", (d: D3Link) => RELATIONSHIP_COLORS[d.relation] || "#94a3b8")
      .attr("stroke-width", (d: D3Link) => (d.data?.isRelationship ? 2 : 1))
      .attr("opacity", (d: D3Link) => (d.data?.isRelationship ? 0.8 : 0.5))
      .attr("marker-end", (d: D3Link) => (d.data?.isRelationship ? "" : "url(#arrowhead)"));

    // Add arrowhead marker for network edges
    svg
      .append("defs")
      .append("marker")
      .attr("id", "arrowhead")
      .attr("markerWidth", 10)
      .attr("markerHeight", 10)
      .attr("refX", 9)
      .attr("refY", 3)
      .attr("orient", "auto")
      .append("polygon")
      .attr("points", "0 0, 10 3, 0 6")
      .attr("fill", "#94a3b8");

    // Add nodes
    const nodes = g
      .selectAll(".node")
      .data(d3Nodes, (d: unknown) => (d as D3Node).id)
      .enter()
      .append("circle")
      .attr("class", "node")
      .attr("r", 14)
      .attr("fill", (d: D3Node) => NODE_COLORS[d.type])
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2)
      .attr("cursor", "pointer")
      .attr("data-id", (d: D3Node) => d.id);

    // Add node labels
    const labels = g
      .selectAll(".label")
      .data(d3Nodes, (d: unknown) => (d as D3Node).id)
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("font-size", "11px")
      .attr("fill", "#1f2937")
      .attr("pointer-events", "none")
      .text((d: D3Node) => d.name);

    // Add tooltip on hover
    nodes.on("mouseenter", function (event: MouseEvent, d: D3Node) {
      d3.select(this as SVGCircleElement)
        .attr("r", 20)
        .attr("stroke-width", 3);

      labels
        .filter((label: D3Node) => label.id === d.id)
        .attr("font-weight", "bold")
        .attr("font-size", "12px");

      document.body.style.cursor = "pointer";
    });

    nodes.on("mouseleave", function (event: MouseEvent, d: D3Node) {
      const isSelected = selectedNodeRef.current?.id === d.id;
      d3.select(this as SVGCircleElement)
        .attr("r", isSelected ? 16 : 14)
        .attr("stroke-width", isSelected ? 3 : 2);

      labels
        .filter((label: D3Node) => label.id === d.id)
        .attr("font-weight", isSelected ? "bold" : "normal")
        .attr("font-size", isSelected ? "12px" : "11px");

      document.body.style.cursor = "default";
    });

    // Click handler - independent from drag
    let isDragging = false;

    nodes.on("mousedown", function () {
      isDragging = false;
    });

    nodes.on("mousemove", function () {
      isDragging = true;
    });

    nodes.on("click", function (event: MouseEvent, d: D3Node) {
      if (!isDragging) {
        setSelectedNode(d);

        // Update visual state
        nodes
          .attr("r", (node: D3Node) => (node.id === d.id ? 16 : 14))
          .attr("stroke-width", (node: D3Node) => (node.id === d.id ? 3 : 2));

        labels
          .attr("font-weight", (label: D3Node) => (label.id === d.id ? "bold" : "normal"))
          .attr("font-size", (label: D3Node) => (label.id === d.id ? "12px" : "11px"));
      }
    });

    // Drag behavior
    const drag = d3
      .drag<SVGCircleElement, D3Node>()
      .on("start", (event: d3.D3DragEvent<SVGCircleElement, D3Node, D3Node>, d: D3Node) => {
        isDragging = true;
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event: d3.D3DragEvent<SVGCircleElement, D3Node, D3Node>, d: D3Node) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event: d3.D3DragEvent<SVGCircleElement, D3Node, D3Node>, d: D3Node) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
        isDragging = false;
      });

    nodes.call(drag);

    // Update positions on simulation tick
    simulation.on("tick", () => {
      links
        .attr("x1", (d: D3Link) => ((d.source as D3Node).x || 0))
        .attr("y1", (d: D3Link) => ((d.source as D3Node).y || 0))
        .attr("x2", (d: D3Link) => ((d.target as D3Node).x || 0))
        .attr("y2", (d: D3Link) => ((d.target as D3Node).y || 0));

      nodes
        .attr("cx", (d: D3Node) => d.x || 0)
        .attr("cy", (d: D3Node) => d.y || 0);

      labels
        .attr("x", (d: D3Node) => d.x || 0)
        .attr("y", (d: D3Node) => d.y || 0);
    });

    // Cleanup
    return () => {
      simulation.stop();
      simulationRef.current = null;
    };
  }, [graphData, showRelationships, canvasSize]);

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
                NODE_COLOR_CLASSES[selectedNode.type]
              )}
            />
            {selectedNode.name}
          </h3>
          <Badge variant="outline" className="capitalize mt-2">
            {selectedNode.type}
          </Badge>
        </div>

        {selectedNode.href && (
          <Button size="sm" onClick={() => window.location.href = selectedNode.href!}>
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
    <div className="space-y-6">
      <section className="rounded-2xl border border-base-200 bg-base-100 p-6 shadow-sm">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold">Campaign Network Map</h2>
          <p className="text-base-content/70">
            Explore the relationships between adventures, sessions, characters,
            and more. Drag nodes to rearrange the map.
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
                  Drag nodes to explore relationships.
                </p>
              </div>
              <Button
                variant={showRelationships ? "default" : "outline"}
                size="sm"
                onClick={() => setShowRelationships(!showRelationships)}
                disabled={isLoading}
              >
                {showRelationships ? "Hide" : "Show"} Relationships
              </Button>
            </div>
            {error && (
              <div className="rounded-lg bg-error/10 p-4 text-sm text-error">
                {error}
              </div>
            )}
          </CardHeader>

          <CardContent className="flex-1 min-h-[600px] p-0">
            <div
              ref={containerRef}
              className="relative w-full h-[600px] bg-base-100 rounded-lg overflow-hidden"
            >
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-base-100/80">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p className="text-sm text-base-content/70">Loading network...</p>
                  </div>
                </div>
              )}

              {!isLoading && !error && (
                <>
                  <svg
                    ref={svgRef}
                    width={canvasSize.width}
                    height={canvasSize.height}
                    style={{ background: "#f8fafc" }}
                  />

                  {/* Legend */}
                  <div className="absolute bottom-4 left-4 bg-base-100/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-base-200 max-w-xs max-h-64 overflow-y-auto">
                    <h3 className="text-sm font-semibold mb-3">Legend</h3>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs font-medium text-base-content/70 mb-2">
                          Entity Types
                        </p>
                        <div className="space-y-1">
                          {Object.entries(NODE_COLORS).map(([type, color]) => (
                            <div key={type} className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: color }}
                              />
                              <span className="text-xs capitalize text-base-content/80">
                                {type}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {showRelationships && (
                        <div>
                          <p className="text-xs font-medium text-base-content/70 mb-2 mt-4">
                            Relationships
                          </p>
                          <div className="space-y-1">
                            {Object.entries(RELATIONSHIP_COLORS)
                              .filter(([key]) => graphData?.edges.some((e) => e.relation === key))
                              .map(([type, color]) => (
                                <div key={type} className="flex items-center gap-2">
                                  <div
                                    className="w-4 h-0.5"
                                    style={{ backgroundColor: color }}
                                  />
                                  <span className="text-xs capitalize text-base-content/80">
                                    {type.replace(/-/g, " ")}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-base-200 bg-base-100">
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
