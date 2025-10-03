import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useAdventures } from '../../contexts/AdventureContext';

interface NetworkNode extends d3.SimulationNodeDatum {
  id: string;
  type: 'pc' | 'npc' | 'location' | 'quest' | 'magic_item' | 'encounter';
  label: string;
  metadata: any;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface NetworkEdge extends d3.SimulationLinkDatum<NetworkNode> {
  source: string | NetworkNode;
  target: string | NetworkNode;
  type: 'relationship' | 'ownership' | 'location_visit' | 'quest_involvement' | 'item_location' | 'character_location' | 'quest_location';
  strength: number;
  metadata: any;
}

interface NetworkData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

const NODE_COLORS = {
  pc: '#3b82f6',        // Blue
  npc: '#10b981',       // Green  
  location: '#f59e0b',  // Orange
  quest: '#8b5cf6',     // Purple
  magic_item: '#f59e0b', // Gold
  encounter: '#ef4444'   // Red
};

const NODE_SHAPES = {
  pc: 'circle',
  npc: 'circle',
  location: 'rect',
  quest: 'polygon',
  magic_item: 'star',
  encounter: 'triangle'
};

export const NetworkVisualization: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const adv = useAdventures();
  const [networkData, setNetworkData] = useState<NetworkData | null>(null);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch network data
  useEffect(() => {
    if (!adv.selectedId) return;

    const fetchNetworkData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/adventures/${adv.selectedId}/network`);
        if (!response.ok) throw new Error('Failed to fetch network data');
        const data = await response.json();
        setNetworkData(data);
      } catch (error) {
        console.error('Error fetching network data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNetworkData();
  }, [adv.selectedId]);

  // D3 visualization
  useEffect(() => {
    if (!networkData || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous

    const width = 800;
    const height = 600;
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };

    svg.attr('width', width).attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create force simulation
    const simulation = d3.forceSimulation<NetworkNode>(networkData.nodes)
      .force('link', d3.forceLink<NetworkNode, NetworkEdge>(networkData.edges)
        .id((d: NetworkNode) => d.id)
        .distance((d: NetworkEdge) => {
          // Adjust link distance based on relationship strength
          const strength = d.strength || 50;
          return Math.max(50, 150 - strength);
        }))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2 - margin.left, height / 2 - margin.top))
      .force('collision', d3.forceCollide().radius(30));

    // Create links
    const links = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(networkData.edges)
      .enter().append('line')
      .attr('stroke', (d: NetworkEdge) => {
        switch (d.type) {
          case 'relationship': return '#64748b';
          case 'ownership': return '#f59e0b';
          case 'location_visit': return '#06b6d4';
          case 'quest_involvement': return '#8b5cf6';
          case 'character_location': return '#10b981'; // Green for character-location
          case 'quest_location': return '#f97316';    // Orange for quest-location
          default: return '#94a3b8';
        }
      })
      .attr('stroke-width', (d: NetworkEdge) => Math.max(1, (d.strength || 50) / 25))
      .attr('stroke-dasharray', (d: NetworkEdge) => 
        d.type === 'location_visit' ? '5,5' : 
        d.type === 'quest_involvement' ? '3,3' :
        d.type === 'character_location' ? '2,2' :
        d.type === 'quest_location' ? '4,2' : null
      );

    // Create nodes
    const nodes = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(networkData.nodes)
      .enter().append('g')
      .attr('class', 'node');

    // Add node shapes
    nodes.each(function(this: SVGGElement, d: NetworkNode) {
      const node = d3.select(this);
      
      if (d.type === 'location') {
        node.append('rect')
          .attr('width', 24)
          .attr('height', 24)
          .attr('x', -12)
          .attr('y', -12)
          .attr('fill', NODE_COLORS[d.type]);
      } else if (d.type === 'quest') {
        node.append('polygon')
          .attr('points', '-12,8 0,-12 12,8 0,0')
          .attr('fill', NODE_COLORS[d.type]);
      } else if (d.type === 'magic_item') {
        // Create a star shape
        const starPath = d3.symbol().type(d3.symbolStar).size(300)();
        node.append('path')
          .attr('d', starPath)
          .attr('fill', NODE_COLORS[d.type]);
      } else {
        // Default circle for PCs, NPCs, encounters
        node.append('circle')
          .attr('r', d.type === 'encounter' ? 10 : 12)
          .attr('fill', NODE_COLORS[d.type]);
      }
    });

    // Add labels
    nodes.append('text')
      .attr('dx', 15)
      .attr('dy', 4)
      .style('font-size', '10px')
      .style('fill', '#374151')
      .text((d: NetworkNode) => d.label);

    // Add drag behavior
    const drag = d3.drag<SVGGElement, NetworkNode>()
      .on('start', (event: any, d: NetworkNode) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event: any, d: NetworkNode) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event: any, d: NetworkNode) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    nodes.call(drag);

    // Add click handler
    nodes.on('click', (event: any, d: NetworkNode) => {
      setSelectedNode(d);
    });

    // Update positions on tick
    simulation.on('tick', () => {
      links
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      nodes.attr('transform', (d: NetworkNode) => `translate(${d.x},${d.y})`);
    });

  }, [networkData]);

  if (!adv.selectedId) {
    return (
      <div className="text-center text-gray-500 py-8">
        Please select an adventure to view its relationship network
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="bg-base-200 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Legend</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500"></div>
            <span>Player Characters</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span>NPCs</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500"></div>
            <span>Locations</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <polygon points="2,12 8,2 14,12 8,8" fill="#8b5cf6"/>
            </svg>
            <span>Quests</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M8,2 L10,6 L14,6 L11,9 L12,13 L8,11 L4,13 L5,9 L2,6 L6,6 Z" fill="#f59e0b"/>
            </svg>
            <span>Magic Items</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-red-500"></div>
            <span>Encounters</span>
          </div>
        </div>
      </div>

      {/* Visualization */}
      <div className="bg-white border rounded-lg p-4">
        <svg ref={svgRef} className="w-full"></svg>
      </div>

      {/* Selected Node Panel */}
      {selectedNode && (
        <div className="bg-base-100 border rounded-lg p-4">
          <h3 className="font-semibold text-lg mb-2">{selectedNode.label}</h3>
          <p className="text-sm text-gray-600 mb-2">Type: {selectedNode.type.replace('_', ' ')}</p>
          {selectedNode.metadata.description && (
            <p className="text-sm">{selectedNode.metadata.description}</p>
          )}
          {selectedNode.metadata.role && (
            <p className="text-sm"><strong>Role:</strong> {selectedNode.metadata.role}</p>
          )}
          {selectedNode.metadata.class && (
            <p className="text-sm"><strong>Class:</strong> {selectedNode.metadata.class}</p>
          )}
        </div>
      )}
    </div>
  );
};