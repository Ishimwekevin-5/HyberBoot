
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Plane, Ship, Truck, Train, Layers, Share2, Plus, Minus, AlertTriangle } from 'lucide-react';

const geoUrl = "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson";

export const WorldMap: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 1200;
    const height = 800;

    const svg = d3.select(svgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("background-color", "#050505");

    const projection = d3.geoMercator()
      .scale(180)
      .translate([width / 2, height / 2 + 50]);

    const path = d3.geoPath().projection(projection);

    const g = svg.append("g");

    // Map base
    d3.json(geoUrl).then((data: any) => {
      g.selectAll("path")
        .data(data.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill", "#111111")
        .attr("stroke", "#222222")
        .attr("stroke-width", 0.5);

      // Add some grid lines
      const graticule = d3.geoGraticule();
      g.append("path")
        .datum(graticule())
        .attr("class", "graticule")
        .attr("d", path)
        .attr("fill", "none")
        .attr("stroke", "#1a1a1a")
        .attr("stroke-width", 0.3);

      // Mock Markers (Aircraft/Ships)
      const points = [
        { lat: 40.71, lng: -74, type: 'plane', label: 'JFK-12' },
        { lat: 31.23, lng: 121.47, type: 'ship', label: 'SH-44' },
        { lat: 51.5, lng: -0.12, type: 'plane', label: 'LHR-09' },
        { lat: 25.2, lng: 55.27, type: 'warning', label: 'DELAY' },
        { lat: -23.55, lng: -46.63, type: 'ship', label: 'SAO-01' },
      ];

      g.selectAll(".marker")
        .data(points)
        .enter()
        .append("circle")
        .attr("cx", d => projection([d.lng, d.lat])![0])
        .attr("cy", d => projection([d.lng, d.lat])![1])
        .attr("r", 4)
        .attr("fill", d => d.type === 'warning' ? '#fbbf24' : '#22d3ee')
        .attr("class", "marker")
        .style("filter", "drop-shadow(0 0 4px #22d3ee)");

      // Animated paths (simulated routes)
      const routes = [
        [[-118.24, 34.05], [121.47, 31.23]],
        [[55.27, 25.2], [4.47, 51.92]],
      ];

      routes.forEach(route => {
        const line = d3.line()
          .curve(d3.curveBasis)
          .x(d => projection(d as [number, number])![0])
          .y(d => projection(d as [number, number])![1]);

        g.append("path")
          .datum(route)
          .attr("d", line as any)
          .attr("fill", "none")
          .attr("stroke", "#22d3ee")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "4,4")
          .style("opacity", 0.3);
      });
    });

    return () => {
      svg.selectAll("*").remove();
    };
  }, []);

  return (
    <div className="relative flex-1 h-full bg-[#050505] overflow-hidden">
      <div className="absolute top-6 left-6 z-10 flex flex-col gap-1">
         <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">OCT 28, 2024</span>
         <span className="text-[10px] font-bold text-neutral-300 uppercase tracking-widest">02:48 (UTC)</span>
      </div>

      <div className="absolute top-6 right-6 z-10 flex gap-2">
        <button className="w-10 h-10 bg-neutral-900 border border-neutral-800 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white transition-colors">
          <Share2 size={18} />
        </button>
        <button className="w-10 h-10 bg-neutral-900 border border-neutral-800 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white transition-colors">
          <Layers size={18} />
        </button>
      </div>

      <div className="absolute right-6 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2">
        <button className="w-10 h-10 bg-neutral-900 border border-neutral-800 rounded-t-lg flex items-center justify-center text-neutral-400 hover:text-white transition-colors">
          <Plus size={18} />
        </button>
        <button className="w-10 h-10 bg-neutral-900 border border-neutral-800 rounded-b-lg flex items-center justify-center text-neutral-400 hover:text-white border-t-0 transition-colors">
          <Minus size={18} />
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

      {/* Timeline */}
      <div className="absolute bottom-0 inset-x-0 h-12 bg-neutral-950/50 border-t border-neutral-900 flex items-center px-4 gap-4">
        <div className="text-[9px] font-bold text-neutral-600 w-16">11:00 AM</div>
        <div className="flex-1 h-px bg-neutral-800 relative">
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-0.5 h-6 bg-cyan-400"></div>
          <div className="absolute -top-6 left-1/4 -translate-x-1/2 text-[9px] font-bold text-cyan-400">NOW</div>
        </div>
        <div className="text-[9px] font-bold text-neutral-600 w-16 text-right">05:10 PM</div>
      </div>

      {/* Warning markers overlay (Simulated) */}
      <div className="absolute left-[30%] top-[40%] group pointer-events-none">
        <div className="relative">
           <AlertTriangle size={20} className="text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)] animate-pulse" />
           <div className="absolute top-6 left-0 bg-black/80 border border-yellow-500/30 backdrop-blur p-2 rounded text-[10px] w-32 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="font-bold text-yellow-500 mb-1">STORM WARNING</p>
              <p className="text-neutral-400">Severe weather in North Atlantic routes.</p>
           </div>
        </div>
      </div>
    </div>
  );
};
