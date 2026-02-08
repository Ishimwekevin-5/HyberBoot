
import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Share2, Layers } from 'lucide-react';
import { Delivery } from '../types';
import * as h3 from 'h3-js';

const GEO_URL = "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson";

// Global cache to prevent re-fetching map data on remounts
let cachedGeoData: any = null;

interface WorldMapProps {
  deliveries: Delivery[];
}

export const WorldMap: React.FC<WorldMapProps> = ({ deliveries }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isMapReady, setIsMapReady] = useState(false);

  // 1. Memoize H3 Grouping to keep main thread free
  const h3Data = useMemo(() => {
    const resolution = Math.min(11, Math.max(6, Math.floor(6 + Math.log2(zoomLevel))));
    const groups: Record<string, { count: number, deliveries: Delivery[], lat: number, lng: number }> = {};
    
    deliveries.forEach(s => {
      const currentLat = s.pickup.lat + (s.dropoff.lat - s.pickup.lat) * s.progress;
      const currentLng = s.pickup.lng + (s.dropoff.lng - s.pickup.lng) * s.progress;
      const h3Index = h3.latLngToCell(currentLat, currentLng, resolution);
      
      if (!groups[h3Index]) {
        const [cellLat, cellLng] = h3.cellToLatLng(h3Index);
        groups[h3Index] = { count: 0, deliveries: [], lat: cellLat, lng: cellLng };
      }
      groups[h3Index].count++;
      groups[h3Index].deliveries.push(s);
    });
    return { groups, resolution };
  }, [deliveries, zoomLevel]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const svg = d3.select(svgRef.current).attr("viewBox", [0, 0, width, height] as any);
    
    svg.selectAll("*").remove();
    const g = svg.append("g");
    const projection = d3.geoMercator()
      .scale(width * 0.8)
      .center([-74.0060, 40.7128])
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 1000])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        setZoomLevel(event.transform.k);
      });

    svg.call(zoom);

    const draw = (data: any) => {
      // Landmass
      g.append("g")
        .selectAll("path")
        .data(data.features)
        .enter()
        .append("path")
        .attr("d", path as any)
        .attr("fill", "#0a0a0a")
        .attr("stroke", "#1a1a1a")
        .attr("stroke-width", 0.5);

      const updateContent = () => {
        g.selectAll(".dynamic-layer").remove();
        const contentLayer = g.append("g").attr("class", "dynamic-layer");

        // Hexagons
        // Renaming shadowed 'data' to 'groupData' and adding explicit cast to fix unknown property access error
        (Object.entries(h3Data.groups) as [string, { count: number, deliveries: Delivery[], lat: number, lng: number }][]).forEach(([index, groupData]) => {
          const boundary = h3.cellToBoundary(index);
          const points = boundary.map(p => projection([p[1], p[0]]));
          
          if (points.every(p => p)) {
            // Fix: groupData is now correctly typed, allowing access to .count
            const density = Math.min(1, groupData.count / 3);
            contentLayer.append("path")
              .datum(points)
              .attr("d", d3.line() as any)
              .attr("fill", `rgba(34, 211, 238, ${0.1 + density * 0.4})`)
              .attr("stroke", "rgba(34, 211, 238, 0.2)")
              .attr("stroke-width", 0.1 / zoomLevel);
          }
        });

        // Vehicles
        contentLayer.selectAll(".marker")
          .data(Object.values(h3Data.groups))
          .enter()
          .append("g")
          .attr("transform", (d: any) => {
            const loc = d.count === 1 
              ? [d.deliveries[0].pickup.lng + (d.deliveries[0].dropoff.lng - d.deliveries[0].pickup.lng) * d.deliveries[0].progress,
                 d.deliveries[0].pickup.lat + (d.deliveries[0].dropoff.lat - d.deliveries[0].pickup.lat) * d.deliveries[0].progress]
              : [d.lng, d.lat];
            const p = projection(loc as [number, number]);
            return p ? `translate(${p})` : null;
          })
          .each(function(d: any) {
            const el = d3.select(this);
            const size = Math.max(1, 4 / Math.sqrt(zoomLevel));
            
            if (d.count > 1 && zoomLevel < 50) {
              el.append("circle").attr("r", size * 2.5).attr("fill", "#0e7490").attr("stroke", "#22d3ee").attr("stroke-width", 0.5 / zoomLevel);
              el.append("text").attr("text-anchor", "middle").attr("dy", ".35em").attr("fill", "white").style("font-size", `${size * 2}px`).text(d.count);
            } else {
              const priority = d.deliveries[0].priority === 'high';
              el.append("circle").attr("r", size).attr("fill", priority ? '#ef4444' : '#22d3ee');
              if (['OUT_FOR_DELIVERY', 'PICKED_UP'].includes(d.deliveries[0].status)) {
                el.append("circle").attr("r", size).attr("fill", "none").attr("stroke", priority ? '#ef4444' : '#22d3ee').attr("stroke-width", 0.2 / zoomLevel)
                  .append("animate").attr("attributeName", "r").attr("from", size).attr("to", size * 5).attr("dur", "2s").attr("repeatCount", "indefinite");
              }
            }
          });
      };
      updateContent();
      setIsMapReady(true);
    };

    if (cachedGeoData) {
      draw(cachedGeoData);
    } else {
      d3.json(GEO_URL).then(data => {
        cachedGeoData = data;
        draw(data);
      });
    }
  }, [h3Data, zoomLevel]);

  return (
    <div ref={containerRef} className="relative flex-1 h-full bg-[#050505] overflow-hidden ui-shell-init">
      {!isMapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#050505] z-50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
            <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">Booting Geo-Core...</span>
          </div>
        </div>
      )}
      
      <div className="absolute top-6 left-6 z-10 pointer-events-none">
         <span className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em] block">Sector 7G-NYC</span>
         <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">H3 Grid: {h3Data.resolution}</span>
      </div>

      <div className="absolute top-6 right-6 z-10 flex gap-2">
        <button className="w-9 h-9 bg-black/60 backdrop-blur border border-neutral-800 rounded-lg flex items-center justify-center text-neutral-500 hover:text-white transition-all"><Share2 size={14} /></button>
        <button className="w-9 h-9 bg-black/60 backdrop-blur border border-neutral-800 rounded-lg flex items-center justify-center text-neutral-500 hover:text-white transition-all"><Layers size={14} /></button>
      </div>

      <svg ref={svgRef} className="w-full h-full cursor-crosshair" />
    </div>
  );
};
