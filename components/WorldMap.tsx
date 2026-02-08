
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Share2, Layers, Navigation } from 'lucide-react';
import { Delivery } from '../types';
import * as h3 from 'h3-js';

const geoUrl = "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson";

interface WorldMapProps {
  deliveries: Delivery[];
}

export const WorldMap: React.FC<WorldMapProps> = ({ deliveries }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height] as any)
      .style("background-color", "#050505");

    svg.selectAll("*").remove();
    const g = svg.append("g");

    // Center on NYC (where mock data is located) for a better initial view
    const projection = d3.geoMercator()
      .scale(width * 0.8) 
      .center([-74.0060, 40.7128]) 
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 500]) // High zoom depth for last-mile visibility
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        setZoomLevel(event.transform.k);
      });

    svg.call(zoom);

    d3.json(geoUrl).then((data: any) => {
      // Map base (Landmass)
      g.append("g")
        .selectAll("path")
        .data(data.features)
        .enter()
        .append("path")
        .attr("d", path as any)
        .attr("fill", "#0a0a0a")
        .attr("stroke", "#1a1a1a")
        .attr("stroke-width", 0.5);

      const updateMap = () => {
        g.selectAll(".h3-layer").remove();
        g.selectAll(".shipment-layer").remove();

        // Dynamically adjust H3 resolution based on zoom (NYC scale)
        const resolution = Math.min(11, Math.max(6, Math.floor(6 + Math.log2(zoomLevel))));
        
        const h3Groups: Record<string, { count: number, deliveries: Delivery[], lat: number, lng: number }> = {};
        
        deliveries.forEach(s => {
          const currentLat = s.pickup.lat + (s.dropoff.lat - s.pickup.lat) * s.progress;
          const currentLng = s.pickup.lng + (s.dropoff.lng - s.pickup.lng) * s.progress;
          const h3Index = h3.latLngToCell(currentLat, currentLng, resolution);
          
          if (!h3Groups[h3Index]) {
            const [cellLat, cellLng] = h3.cellToLatLng(h3Index);
            h3Groups[h3Index] = { count: 0, deliveries: [], lat: cellLat, lng: cellLng };
          }
          h3Groups[h3Index].count++;
          h3Groups[h3Index].deliveries.push(s);
        });

        const h3Layer = g.append("g").attr("class", "h3-layer");
        const shipmentLayer = g.append("g").attr("class", "shipment-layer");

        // Render H3 Density Hexagons
        Object.entries(h3Groups).forEach(([index, data]) => {
          const boundary = h3.cellToBoundary(index);
          const points = boundary.map(p => projection([p[1], p[0]]));
          
          if (points.every(p => p)) {
            const density = Math.min(1, data.count / 3);
            h3Layer.append("path")
              .datum(points)
              .attr("d", d3.line() as any)
              .attr("fill", `rgba(34, 211, 238, ${0.1 + density * 0.4})`)
              .attr("stroke", "rgba(34, 211, 238, 0.3)")
              .attr("stroke-width", 0.2 / zoomLevel);
          }
        });

        // Render Markers
        const markers = shipmentLayer.selectAll(".marker")
          .data(Object.values(h3Groups))
          .enter()
          .append("g")
          .attr("transform", (d: any) => {
            if (d.count === 1) {
              const s = d.deliveries[0];
              const lat = s.pickup.lat + (s.dropoff.lat - s.pickup.lat) * s.progress;
              const lng = s.pickup.lng + (s.dropoff.lng - s.pickup.lng) * s.progress;
              const projected = projection([lng, lat]);
              return projected ? `translate(${projected})` : null;
            }
            const projectedGroup = projection([d.lng, d.lat]);
            return projectedGroup ? `translate(${projectedGroup})` : null;
          });

        markers.each(function(d: any) {
          const el = d3.select(this);
          if (d.count > 1 && zoomLevel < 50) {
            // Cluster circle
            el.append("circle")
              .attr("r", Math.max(5, 12 / Math.sqrt(zoomLevel)))
              .attr("fill", "#0e7490")
              .attr("stroke", "#22d3ee")
              .attr("stroke-width", 1 / Math.sqrt(zoomLevel));
            
            el.append("text")
              .attr("text-anchor", "middle")
              .attr("dy", ".35em")
              .attr("fill", "white")
              .style("font-size", `${Math.max(5, 9 / Math.sqrt(zoomLevel))}px`)
              .style("font-weight", "bold")
              .text(d.count);
          } else {
            // Single delivery marker
            const s = d.deliveries[0];
            const size = Math.max(1, 4 / Math.sqrt(zoomLevel));
            
            el.append("circle")
              .attr("r", size)
              .attr("fill", s.priority === 'high' ? '#ef4444' : '#22d3ee')
              .style("filter", `drop-shadow(0 0 ${size * 2}px ${s.priority === 'high' ? '#ef4444' : '#22d3ee'})`);
            
            if (['OUT_FOR_DELIVERY', 'PICKED_UP'].includes(s.status)) {
              el.append("circle")
                .attr("r", size)
                .attr("fill", "none")
                .attr("stroke", s.priority === 'high' ? '#ef4444' : '#22d3ee')
                .attr("stroke-width", 0.5 / zoomLevel)
                .append("animate")
                .attr("attributeName", "r")
                .attr("from", size)
                .attr("to", size * 4)
                .attr("dur", "2s")
                .attr("repeatCount", "indefinite");
            }
          }
        });
      };

      updateMap();
    });
  }, [deliveries, zoomLevel]);

  return (
    <div ref={containerRef} className="relative flex-1 h-full bg-[#050505] overflow-hidden">
      <div className="absolute top-6 left-6 z-10 flex flex-col gap-1 pointer-events-none">
         <span className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em]">Sector 7G-NYC</span>
         <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">H3 Grid Active: Res-{Math.min(11, Math.max(6, Math.floor(6 + Math.log2(zoomLevel))))}</span>
      </div>

      <div className="absolute top-6 right-6 z-10 flex gap-2">
        <button className="w-10 h-10 bg-[#0d0d0d] border border-neutral-800 rounded-xl flex items-center justify-center text-neutral-400 hover:text-white transition-all hover:bg-neutral-800">
          <Share2 size={16} />
        </button>
        <button className="w-10 h-10 bg-[#0d0d0d] border border-neutral-800 rounded-xl flex items-center justify-center text-neutral-400 hover:text-white transition-all hover:bg-neutral-800">
          <Layers size={16} />
        </button>
      </div>

      <svg ref={svgRef} className="w-full h-full cursor-crosshair" />

      <div className="absolute bottom-8 right-8 z-10 bg-black/80 backdrop-blur-md border border-neutral-800 p-4 rounded-2xl">
         <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
               <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Active Delivery</span>
            </div>
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
               <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">High Priority</span>
            </div>
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-neutral-800 border border-neutral-700" />
               <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Hub Location</span>
            </div>
         </div>
      </div>
    </div>
  );
};
