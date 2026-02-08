
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Delivery, Geofence } from '../types';
import { RotateCcw, Crosshair, Layers, Share2, Plus } from 'lucide-react';
import * as h3 from 'h3-js';

// Declare google variable to resolve TypeScript errors for the globally loaded Google Maps script
declare var google: any;

interface WorldMapProps {
  deliveries: Delivery[];
  geofences?: Geofence[];
  onAddGeofence?: (lat: number, lng: number) => void;
  isAddingZone?: boolean;
}

export const WorldMap: React.FC<WorldMapProps> = ({ 
  deliveries, 
  geofences = [], 
  onAddGeofence,
  isAddingZone = false
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMap = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const circles = useRef<any[]>([]);
  const hexPolygons = useRef<any[]>([]);
  const [zoom, setZoom] = useState(14);

  // Initialize the Map
  useEffect(() => {
    if (!mapRef.current) return;

    const kigali = { lat: -1.9441, lng: 30.0619 };
    
    const darkStyle = [
      { elementType: "geometry", stylers: [{ color: "#0a0a0a" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#000000" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#444444" }] },
      { featureType: "road", elementType: "geometry", stylers: [{ color: "#1a1a1a" }] },
      { featureType: "water", elementType: "geometry", stylers: [{ color: "#050505" }] },
      { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#333333" }] },
    ];

    googleMap.current = new google.maps.Map(mapRef.current, {
      center: kigali,
      zoom: 14,
      styles: darkStyle,
      disableDefaultUI: true,
      zoomControl: false,
      scrollwheel: true, // Explicitly enable scroll wheel zoom
      gestureHandling: 'greedy', // Better UX for full-screen dashboards
      mapTypeId: 'roadmap'
    });

    // Handle Pan and Zoom events
    googleMap.current.addListener('zoom_changed', () => {
      setZoom(googleMap.current.getZoom());
    });

    if (onAddGeofence) {
      googleMap.current.addListener('click', (e: any) => {
        if (e.latLng) {
          onAddGeofence(e.latLng.lat(), e.latLng.lng());
        }
      });
    }

    return () => {
      if (googleMap.current && google.maps.event) {
        google.maps.event.clearInstanceListeners(googleMap.current);
      }
    };
  }, []);

  // Compute and Render H3 Clusters + Markers
  useEffect(() => {
    if (!googleMap.current || typeof google === 'undefined' || !google.maps) return;

    // 1. Clear previous overlays
    markers.current.forEach(m => m.setMap(null));
    markers.current = [];
    hexPolygons.current.forEach(p => p.setMap(null));
    hexPolygons.current = [];

    // 2. Determine H3 Resolution based on Zoom
    // Higher zoom = higher resolution (smaller hexes)
    let res = 7;
    if (zoom >= 18) res = 12;
    else if (zoom >= 16) res = 11;
    else if (zoom >= 14) res = 9;
    else if (zoom >= 12) res = 8;

    const clusters: Record<string, { count: number; deliveries: Delivery[]; lat: number; lng: number }> = {};

    deliveries.forEach(d => {
      const curLat = d.pickup.lat + (d.dropoff.lat - d.pickup.lat) * d.progress;
      const curLng = d.pickup.lng + (d.dropoff.lng - d.pickup.lng) * d.progress;
      
      const h3Index = h3.latLngToCell(curLat, curLng, res);
      
      if (!clusters[h3Index]) {
        const [lat, lng] = h3.cellToLatLng(h3Index);
        clusters[h3Index] = { count: 0, deliveries: [], lat, lng };
      }
      clusters[h3Index].count++;
      clusters[h3Index].deliveries.push(d);

      // 3. Draw Vehicle Markers
      const marker = new google.maps.Marker({
        position: { lat: curLat, lng: curLng },
        map: googleMap.current,
        title: `${d.id} - ${d.driverName}`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: zoom > 15 ? 10 : 7,
          fillColor: d.priority === 'high' ? '#ef4444' : '#22d3ee',
          fillOpacity: 1,
          strokeColor: '#000',
          strokeWeight: 2,
        },
      });
      markers.current.push(marker);
    });

    // 4. Draw H3 Hexagons for Clusters
    Object.entries(clusters).forEach(([index, cluster]) => {
      const boundary = h3.cellToBoundary(index);
      const paths = boundary.map(p => ({ lat: p[0], lng: p[1] }));

      const polygon = new google.maps.Polygon({
        paths: paths,
        strokeColor: '#22d3ee',
        strokeOpacity: 0.3,
        strokeWeight: 1,
        fillColor: '#22d3ee',
        fillOpacity: Math.min(0.1 + cluster.count * 0.1, 0.4),
        map: googleMap.current,
        zIndex: 1
      });

      hexPolygons.current.push(polygon);
    });
  }, [deliveries, zoom]);

  // Update Geofences
  useEffect(() => {
    if (!googleMap.current || typeof google === 'undefined' || !google.maps) return;

    circles.current.forEach(c => c.setMap(null));
    circles.current = [];

    geofences.forEach(g => {
      if (!g.active) return;
      
      const circle = new google.maps.Circle({
        strokeColor: g.type === 'RESTRICTED' ? '#ef4444' : '#22d3ee',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: g.type === 'RESTRICTED' ? '#ef4444' : '#22d3ee',
        fillOpacity: 0.15,
        map: googleMap.current,
        center: { lat: g.lat, lng: g.lng },
        radius: g.radius,
        clickable: false,
        zIndex: 5
      });

      circles.current.push(circle);
    });
  }, [geofences]);

  const resetView = () => {
    googleMap.current?.setCenter({ lat: -1.9441, lng: 30.0619 });
    googleMap.current?.setZoom(14);
    setZoom(14);
  };

  return (
    <div className="relative flex-1 h-full bg-[#050505] overflow-hidden ui-shell-init">
      <div ref={mapRef} className="w-full h-full" />
      
      {isAddingZone && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20 flex flex-col items-center gap-2">
           <div className="w-10 h-10 border-2 border-dashed border-cyan-400 rounded-full animate-pulse flex items-center justify-center">
              <Plus size={20} className="text-cyan-400" />
           </div>
           <span className="bg-black/80 px-4 py-2 rounded-full text-[10px] font-black text-white uppercase tracking-widest border border-cyan-400/30">Click on map to place zone</span>
        </div>
      )}

      <div className="absolute top-6 left-6 z-10 pointer-events-none">
         <span className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em] block">KIGALI SECTOR MATRIX</span>
         <span className="text-[10px] font-bold text-cyan-500 uppercase">Res {zoom > 15 ? 11 : 9} • H3 Telemetry Active</span>
      </div>

      <div className="absolute top-6 right-6 z-10 flex gap-2">
        <button onClick={resetView} className="w-10 h-10 bg-black/60 backdrop-blur-lg border border-neutral-800 rounded-2xl flex items-center justify-center text-neutral-400 hover:text-cyan-400 transition-all shadow-xl group" title="Reset to Global Perspective">
          <RotateCcw size={16} className="group-active:rotate-[-45deg] transition-transform" />
        </button>
        <button className="w-10 h-10 bg-black/60 backdrop-blur-lg border border-neutral-800 rounded-2xl flex items-center justify-center text-neutral-400 hover:text-white transition-all shadow-xl"><Crosshair size={16} /></button>
        <button className="w-10 h-10 bg-black/60 backdrop-blur-lg border border-neutral-800 rounded-2xl flex items-center justify-center text-neutral-400 hover:text-white transition-all shadow-xl"><Layers size={16} /></button>
        <button className="w-10 h-10 bg-black/60 backdrop-blur-lg border border-neutral-800 rounded-2xl flex items-center justify-center text-neutral-400 hover:text-white transition-all shadow-xl"><Share2 size={16} /></button>
      </div>

      <div className="absolute bottom-6 left-6 z-10 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-neutral-800/50 text-[10px] font-bold text-neutral-500 uppercase">
        Standard Pan/Zoom • H3 Resolution {zoom > 15 ? 11 : 9}
      </div>
    </div>
  );
};
