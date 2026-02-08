
import React, { useEffect, useRef, useState } from 'react';
import { Delivery, Geofence } from '../types';
import { RotateCcw, Layers, Share2, Plus, BarChart2, Globe } from 'lucide-react';
import * as h3 from 'h3-js';

declare var google: any;

interface WorldMapProps {
  deliveries: Delivery[];
  geofences?: Geofence[];
  onAddGeofence?: (lat: number, lng: number) => void;
  onHexClick?: (h3Index: string) => void;
  isAddingZone?: boolean;
  viewMode?: 'ops' | 'analytics';
}

export const WorldMap: React.FC<WorldMapProps> = ({ 
  deliveries, 
  geofences = [], 
  onAddGeofence,
  onHexClick,
  isAddingZone = false,
  viewMode = 'ops'
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMap = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const hexPolygons = useRef<any[]>([]);
  const viewportHexes = useRef<any[]>([]);
  const [zoom, setZoom] = useState(14);

  useEffect(() => {
    if (!mapRef.current) return;
    const kigali = { lat: -1.9441, lng: 30.0619 };
    
    const darkStyle = [
      { elementType: "geometry", stylers: [{ color: "#080808" }] },
      { elementType: "labels.text.stroke", stylers: [{ visibility: "off" }] },
      { featureType: "road", elementType: "geometry", stylers: [{ color: "#121212" }] },
      { featureType: "water", elementType: "geometry", stylers: [{ color: "#050505" }] },
    ];

    googleMap.current = new google.maps.Map(mapRef.current, {
      center: kigali,
      zoom: 14,
      styles: darkStyle,
      disableDefaultUI: true,
      zoomControl: false,
      gestureHandling: 'greedy',
      backgroundColor: '#050505'
    });

    const updateZoom = () => setZoom(googleMap.current.getZoom());
    googleMap.current.addListener('zoom_changed', updateZoom);
    googleMap.current.addListener('idle', renderGlobalGrid);

    if (onAddGeofence || onHexClick) {
      googleMap.current.addListener('click', (e: any) => {
        if (!e.latLng) return;
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        
        if (isAddingZone && onAddGeofence) {
          onAddGeofence(lat, lng);
        } else if (onHexClick) {
          const res = googleMap.current.getZoom() >= 14 ? 9 : 7;
          const h3Index = h3.latLngToCell(lat, lng, res);
          onHexClick(h3Index);
        }
      });
    }

    return () => {
      if (googleMap.current && google.maps.event) {
        google.maps.event.clearInstanceListeners(googleMap.current);
      }
    };
  }, [isAddingZone]);

  const renderGlobalGrid = () => {
    if (!googleMap.current || !google.maps) return;
    
    // Clear old viewport hexes
    viewportHexes.current.forEach(h => h.setMap(null));
    viewportHexes.current = [];

    const bounds = googleMap.current.getBounds();
    if (!bounds) return;

    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    // Determine resolution based on zoom
    const currentZoom = googleMap.current.getZoom();
    const res = currentZoom >= 16 ? 10 : currentZoom >= 14 ? 9 : currentZoom >= 11 ? 7 : 5;

    // We use a simplified viewport polyfill logic to avoid overhead
    // For global visibility, we step through the bounds
    const polygon = [
      [ne.lat(), ne.lng()],
      [ne.lat(), sw.lng()],
      [sw.lat(), sw.lng()],
      [sw.lat(), ne.lng()],
      [ne.lat(), ne.lng()]
    ];

    try {
      // Limit number of cells to prevent hanging on very zoomed out views
      const hexes = h3.polygonToCells(polygon, res, true);
      const limitedHexes = hexes.slice(0, 400); // Performance cap

      limitedHexes.forEach(h3Index => {
        const boundary = h3.cellToBoundary(h3Index);
        const paths = boundary.map(p => ({ lat: p[0], lng: p[1] }));
        
        const poly = new google.maps.Polygon({
          paths,
          strokeColor: '#22d3ee',
          strokeOpacity: 0.1,
          strokeWeight: 0.5,
          fillColor: '#22d3ee',
          fillOpacity: 0.02,
          map: googleMap.current,
          clickable: false
        });
        viewportHexes.current.push(poly);
      });
    } catch (e) {
      console.warn("H3 Grid Gen failed", e);
    }
  };

  useEffect(() => {
    if (!googleMap.current || !google.maps) return;

    markers.current.forEach(m => m.setMap(null));
    markers.current = [];
    hexPolygons.current.forEach(p => p.setMap(null));
    hexPolygons.current = [];

    const res = zoom >= 16 ? 11 : zoom >= 14 ? 9 : 7;
    const clusters: Record<string, { count: number; status: string }> = {};

    deliveries.forEach(d => {
      const curLat = d.pickup.lat + (d.dropoff.lat - d.pickup.lat) * d.progress;
      const curLng = d.pickup.lng + (d.dropoff.lng - d.pickup.lng) * d.progress;
      const h3Index = h3.latLngToCell(curLat, curLng, res);
      
      if (!clusters[h3Index]) clusters[h3Index] = { count: 0, status: 'NORMAL' };
      clusters[h3Index].count++;
      if (d.status === 'DELAYED') clusters[h3Index].status = 'DELAYED';

      if (viewMode === 'ops') {
        const marker = new google.maps.Marker({
          position: { lat: curLat, lng: curLng },
          map: googleMap.current,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 5,
            fillColor: d.status === 'DELAYED' ? '#ef4444' : d.priority === 'high' ? '#f59e0b' : '#22d3ee',
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: '#000'
          },
        });
        markers.current.push(marker);
      }
    });

    Object.entries(clusters).forEach(([index, data]) => {
      const boundary = h3.cellToBoundary(index);
      const paths = boundary.map(p => ({ lat: p[0], lng: p[1] }));
      
      const hexColor = data.status === 'DELAYED' ? '#ef4444' : '#22d3ee';
      const intensity = Math.min(data.count * 0.15, 0.6);

      const polygon = new google.maps.Polygon({
        paths,
        strokeColor: hexColor,
        strokeOpacity: 0.3,
        strokeWeight: 1,
        fillColor: hexColor,
        fillOpacity: intensity + 0.05,
        map: googleMap.current,
        zIndex: 5
      });
      hexPolygons.current.push(polygon);
    });
  }, [deliveries, zoom, viewMode]);

  return (
    <div className="relative flex-1 h-full bg-[#050505] overflow-hidden">
      <div ref={mapRef} className="w-full h-full" />
      
      <div className="absolute top-6 left-6 z-10 pointer-events-none">
         <div className="flex items-center gap-2 mb-1">
            <Globe size={12} className="text-cyan-400 animate-spin-slow" />
            <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Global Spatial Network</span>
         </div>
         <span className="text-[9px] font-bold text-neutral-500 uppercase">H3 Res {zoom >= 14 ? 9 : 7} Live Grid</span>
      </div>

      <div className="absolute top-6 right-6 z-10 flex gap-2">
        <button onClick={() => googleMap.current.setCenter({lat: -1.9441, lng: 30.0619})} className="w-10 h-10 bg-black/80 backdrop-blur-md border border-neutral-800 rounded-2xl flex items-center justify-center text-neutral-400 hover:text-cyan-400 transition-all shadow-xl" title="Reset to Hub">
          <RotateCcw size={16} />
        </button>
        <button className="w-10 h-10 bg-black/80 backdrop-blur-md border border-neutral-800 rounded-2xl flex items-center justify-center text-neutral-400 hover:text-white transition-all shadow-xl"><Layers size={16} /></button>
        <button className="w-10 h-10 bg-black/80 backdrop-blur-md border border-neutral-800 rounded-2xl flex items-center justify-center text-cyan-400 hover:text-white transition-all shadow-xl border-cyan-500/30">
          <BarChart2 size={16} />
        </button>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 bg-black/60 backdrop-blur-lg px-6 py-2 rounded-full border border-neutral-800/50 flex gap-8 items-center shadow-2xl">
         <div className="flex flex-col items-center">
            <span className="text-[8px] font-black text-neutral-500 uppercase">Visibility</span>
            <span className="text-[10px] font-bold text-white uppercase">Full Coverage</span>
         </div>
         <div className="w-px h-6 bg-neutral-800" />
         <div className="flex flex-col items-center">
            <span className="text-[8px] font-black text-neutral-500 uppercase">Grid Sync</span>
            <span className="text-[10px] font-bold text-cyan-400 uppercase">Real-Time</span>
         </div>
      </div>
    </div>
  );
};
