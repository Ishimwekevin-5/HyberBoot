
import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Share2, Layers, Crosshair, Map as MapIcon } from 'lucide-react';
import { Delivery } from '../types';
import * as h3 from 'h3-js';

const GEO_URL = "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson";
let globalGeoCache: any = null;

interface WorldMapProps {
  deliveries: Delivery[];
}

export const WorldMap: React.FC<WorldMapProps> = ({ deliveries }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);

  const clusterData = useMemo(() => {
    // Zoom-aware Resolution Scaling
    // Low Zoom (1-5): Resolution 3-5 (Big clusters)
    // High Zoom (10+): Resolution 9-11 (Individual buildings)
    const res = Math.min(11, Math.max(3, Math.floor(3 + Math.log2(zoomLevel) * 0.8)));
    const groups: Record<string, { count: number, deliveries: Delivery[], lat: number, lng: number }> = {};
    
    deliveries.forEach(d => {
      const curLat = d.pickup.lat + (d.dropoff.lat - d.pickup.lat) * d.progress;
      const curLng = d.pickup.lng + (d.dropoff.lng - d.pickup.lng) * d.progress;
      const index = h3.latLngToCell(curLat, curLng, res);
      
      if (!groups[index]) {
        const [cLat, cLng] = h3.cellToLatLng(index);
        groups[index] = { count: 0, deliveries: [], lat: cLat, lng: cLng };
      }
      groups[index].count++;
      groups[index].deliveries.push(d);
    });
    
    return { groups, res };
  }, [deliveries, zoomLevel]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    let width = containerRef.current.clientWidth;
    let height = containerRef.current.clientHeight;
    
    // Ensure we don't render on 0 dimensions
    if (width === 0 || height === 0) return;

    const svg = d3.select(svgRef.current).attr("viewBox", [0, 0, width, height] as any);
    svg.selectAll("*").remove();
    const g = svg.append("g");

    const projection = d3.geoMercator()
      .scale(width * 0.6) // Global view scale
      .center([-30, 20]) // Centered for global coverage
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 5000])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        setZoomLevel(event.transform.k);
      });

    svg.call(zoom);

    const render = (data: any) => {
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

      const drawUpdates = () => {
        g.selectAll(".content-layer").remove();
        const layer = g.append("g").attr("class", "content-layer");

        // H3 Hex Grid Layer
        (Object.entries(clusterData.groups) as [string, any][]).forEach(([index, group]) => {
          const boundary = h3.cellToBoundary(index);
          const pts = boundary.map(p => projection([p[1], p[0]]));
          
          if (pts.every(p => p)) {
            const opacity = Math.min(0.5, group.count * 0.15);
            layer.append("path")
              .datum(pts)
              .attr("d", d3.line() as any)
              .attr("fill", group.count > 1 ? `rgba(34, 211, 238, ${opacity})` : "none")
              .attr("stroke", "rgba(34, 211, 238, 0.1)")
              .attr("stroke-width", 0.1 / zoomLevel);
          }
        });

        // Markers
        const markers = layer.selectAll(".marker")
          .data(Object.values(clusterData.groups))
          .enter()
          .append("g")
          .attr("transform", (d: any) => {
            const p = projection([d.lng, d.lat]);
            return p ? `translate(${p})` : null;
          });

        markers.each(function(d: any) {
          const el = d3.select(this);
          const size = Math.max(0.5, 4 / Math.sqrt(zoomLevel));

          if (d.count > 1 && zoomLevel < 200) {
            el.append("circle").attr("r", size * 2.8).attr("fill", "#0891b2").attr("stroke", "#22d3ee").attr("stroke-width", 0.5 / zoomLevel);
            el.append("text").attr("text-anchor", "middle").attr("dy", ".35em").attr("fill", "white").style("font-size", `${size * 2.2}px`).style("font-weight", "900").text(d.count);
          } else {
            const s = d.deliveries[0];
            const isCritical = s.priority === 'high';
            el.append("circle").attr("r", size).attr("fill", isCritical ? '#ef4444' : '#22d3ee');
            if (['OUT_FOR_DELIVERY', 'PICKED_UP'].includes(s.status)) {
              el.append("circle").attr("r", size).attr("fill", "none").attr("stroke", isCritical ? '#ef4444' : '#22d3ee').attr("stroke-width", 0.2 / zoomLevel)
                .append("animate").attr("attributeName", "r").attr("from", size).attr("to", size * 6).attr("dur", "3s").attr("repeatCount", "indefinite");
            }
          }
        });
      };
      drawUpdates();
      setIsLoaded(true);
    };

    if (globalGeoCache) {
      render(globalGeoCache);
    } else {
      d3.json(GEO_URL).then(data => {
        globalGeoCache = data;
        render(data);
      }).catch(() => setIsLoaded(true));
    }
  }, [clusterData, zoomLevel]);

  return (
    <div ref={containerRef} className="relative flex-1 h-full bg-[#050505] map-loading-grid overflow-hidden ui-shell-init">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
          <div className="flex flex-col items-center gap-3">
             <div className="w-8 h-8 border-2 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin" />
             <span className="text-[10px] font-black text-cyan-400 tracking-[0.2em] uppercase">Syncing World View</span>
          </div>
        </div>
      )}
      
      <div className="absolute top-6 left-6 z-10 pointer-events-none">
         <span className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em] block">Operational Matrix v1.1</span>
         <span className="text-[10px] font-bold text-cyan-500 uppercase">H3 Level: {clusterData.res}</span>
      </div>

      <div className="absolute top-6 right-6 z-10 flex gap-2">
        <button className="w-10 h-10 bg-black/60 backdrop-blur-lg border border-neutral-800 rounded-2xl flex items-center justify-center text-neutral-400 hover:text-white transition-all"><Crosshair size={16} /></button>
        <button className="w-10 h-10 bg-black/60 backdrop-blur-lg border border-neutral-800 rounded-2xl flex items-center justify-center text-neutral-400 hover:text-white transition-all"><Layers size={16} /></button>
        <button className="w-10 h-10 bg-black/60 backdrop-blur-lg border border-neutral-800 rounded-2xl flex items-center justify-center text-neutral-400 hover:text-white transition-all"><Share2 size={16} /></button>
      </div>

      <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  );
};
