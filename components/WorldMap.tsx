
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Plane, Ship, Truck, Train, Layers, Share2, Plus, Minus, AlertTriangle } from 'lucide-react';
// Fix: Import Delivery instead of non-existent Shipment member
import { Delivery } from '../types';
import * as h3 from 'h3-js';

const geoUrl = "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson";

interface WorldMapProps {
  // Fix: Use Delivery[] instead of Shipment[]
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

    const projection = d3.geoMercator()
      .scale(width / (2 * Math.PI))
      .translate([width / 2, height / 1.5]);

    const path = d3.geoPath().projection(projection);

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 20])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        setZoomLevel(event.transform.k);
      });

    svg.call(zoom);

    // Initial load
    d3.json(geoUrl).then((data: any) => {
      // Map base
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

        // 1. Determine H3 Resolution based on Zoom Level
        // Low zoom = low resolution (large hexagons), High zoom = high resolution (small hexagons)
        const resolution = Math.min(7, Math.max(1, Math.floor(zoomLevel * 0.8)));
        
        // 2. Group Deliveries by H3 Cell
        // Fix: Update type definition to use Delivery and rename key
        const h3Groups: Record<string, { count: number, deliveries: Delivery[], lat: number, lng: number }> = {};
        
        deliveries.forEach(s => {
          // Fix: Use pickup/dropoff instead of origin/destination
          // Current position estimation based on progress
          const currentLat = s.pickup.lat + (s.dropoff.lat - s.pickup.lat) * s.progress;
          const currentLng = s.pickup.lng + (s.dropoff.lng - s.pickup.lng) * s.progress;
          const h3Index = h3.latLngToCell(currentLat, currentLng, resolution);
          
          if (!h3Groups[h3Index]) {
            const [cellLat, cellLng] = h3.cellToLatLng(h3Index);
            h3Groups[h3Index] = {
              count: 0,
              deliveries: [],
              lat: cellLat,
              lng: cellLng
            };
          }
          h3Groups[h3Index].count++;
          h3Groups[h3Index].deliveries.push(s);
        });

        const h3Layer = g.append("g").attr("class", "h3-layer");
        const shipmentLayer = g.append("g").attr("class", "shipment-layer");

        // 3. Render H3 Density Hexagons
        Object.entries(h3Groups).forEach(([index, data]) => {
          const boundary = h3.cellToBoundary(index);
          const points = boundary.map(p => projection([p[1], p[0]]));
          
          if (points.every(p => p)) {
            const density = Math.min(1, data.count / 5); // Scale color by count
            h3Layer.append("path")
              .datum(points)
              .attr("d", d3.line() as any)
              .attr("fill", `rgba(34, 211, 238, ${0.05 + density * 0.2})`)
              .attr("stroke", "rgba(34, 211, 238, 0.2)")
              .attr("stroke-width", 0.5 / zoomLevel);
          }
        });

        // 4. Render Markers (Clusters or Individual)
        const markers = shipmentLayer.selectAll(".marker")
          .data(Object.values(h3Groups))
          .enter()
          .append("g")
          .attr("transform", (d: any) => {
            // For single deliveries, use actual position for better visual accuracy
            if (d.count === 1) {
              const s = d.deliveries[0];
              // Fix: Use pickup/dropoff instead of origin/destination
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
          if (d.count > 1) {
            // Render Cluster Marker
            el.append("circle")
              .attr("r", Math.max(8, 14 / Math.sqrt(zoomLevel)))
              .attr("fill", "#0e7490")
              .attr("stroke", "#22d3ee")
              .attr("stroke-width", 1.5 / Math.sqrt(zoomLevel))
              .style("filter", "drop-shadow(0 0 6px rgba(34, 211, 238, 0.4))");
            
            el.append("text")
              .attr("text-anchor", "middle")
              .attr("dy", ".35em")
              .attr("fill", "white")
              .style("font-size", `${Math.max(7, 10 / Math.sqrt(zoomLevel))}px`)
              .style("font-weight", "bold")
              .style("pointer-events", "none")
              .text(d.count);
          } else {
            // Render Single Delivery Marker
            const s = d.deliveries[0];
            const size = Math.max(3, 5 / Math.sqrt(zoomLevel));
            
            el.append("circle")
              .attr("r", size)
              .attr("fill", "#22d3ee")
              .style("filter", "drop-shadow(0 0 4px #22d3ee)");
            
            // Pulsing effect for active deliveries
            // Fix: Check for specific active statuses instead of 'IN TRANSIT'
            if (['OUT_FOR_DELIVERY', 'PICKED_UP'].includes(s.status)) {
              el.append("circle")
                .attr("r", size)
                .attr("fill", "none")
                .attr("stroke", "#22d3ee")
                .attr("stroke-width", 1 / zoomLevel)
                .append("animate")
                .attr("attributeName", "r")
                .attr("from", size)
                .attr("to", size * 3)
                .attr("dur", "2s")
                .attr("begin", "0s")
                .attr("repeatCount", "indefinite");

              el.append("circle")
                .attr("r", size)
                .attr("fill", "none")
                .attr("stroke", "#22d3ee")
                .attr("stroke-width", 0.5 / zoomLevel)
                .attr("opacity", 1)
                .append("animate")
                .attr("attributeName", "opacity")
                .attr("from", 1)
                .attr("to", 0)
                .attr("dur", "2s")
                .attr("begin", "0s")
                .attr("repeatCount", "indefinite");
            }
          }
        });

        // 5. Draw animated routes for active deliveries
        // Fix: Use actual DeliveryStatus values for filtering and use pickup/dropoff
        deliveries.filter(s => ['OUT_FOR_DELIVERY', 'PICKED_UP'].includes(s.status)).forEach(s => {
          const route = [
            [s.pickup.lng, s.pickup.lat],
            [s.dropoff.lng, s.dropoff.lat]
          ];
          
          const line = d3.line()
            .curve(d3.curveBasis)
            .x(d => projection(d as [number, number])![0])
            .y(d => projection(d as [number, number])![1]);

          shipmentLayer.append("path")
            .datum(route)
            .attr("d", line as any)
            .attr("fill", "none")
            .attr("stroke", "rgba(34, 211, 238, 0.15)")
            .attr("stroke-width", 0.8 / zoomLevel)
            .attr("stroke-dasharray", "4,4");
        });
      };

      updateMap();
    });

    // Fix: Add deliveries to dependency array
  }, [deliveries, zoomLevel]);

  return (
    <div ref={containerRef} className="relative flex-1 h-full bg-[#050505] overflow-hidden">
      <div className="absolute top-6 left-6 z-10 flex flex-col gap-1 pointer-events-none">
         <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">LIVE FLEET MONITOR</span>
         <span className="text-[10px] font-bold text-neutral-300 uppercase tracking-widest">H3 CLUSTERING ON</span>
         <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">ZOOM: {zoomLevel.toFixed(1)}x</span>
      </div>

      <div className="absolute top-6 right-6 z-10 flex gap-2">
        <button className="w-10 h-10 bg-neutral-900 border border-neutral-800 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white transition-colors">
          <Share2 size={18} />
        </button>
        <button className="w-10 h-10 bg-neutral-900 border border-neutral-800 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white transition-colors">
          <Layers size={18} />
        </button>
      </div>

      <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating Filter Bar */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-[#0d0d0d]/80 backdrop-blur-md border border-neutral-800 p-1 rounded-full px-4 py-2">
        <button className="bg-cyan-400 text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase">All</button>
        <button className="text-neutral-500 hover:text-neutral-300 p-2"><Plane size={14} /></button>
        <button className="text-neutral-500 hover:text-neutral-300 p-2"><Ship size={14} /></button>
        <button className="text-neutral-500 hover:text-neutral-300 p-2"><Truck size={14} /></button>
        <button className="text-neutral-500 hover:text-neutral-300 p-2"><Train size={14} /></button>
      </div>
    </div>
  );
};
