
import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { TrackingList } from './components/TrackingList';
import { WorldMap } from './components/WorldMap';
import { 
  Bell, 
  TrendingUp, 
  Cpu, 
  Truck, 
  Users, 
  BarChart3, 
  Clock, 
  Zap,
  Search,
  X,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  Battery,
  MapPin,
  Trash2,
  Plus,
  PlusCircle,
  Hexagon,
  DollarSign,
  Timer,
  Navigation,
  Activity
} from 'lucide-react';
import { Delivery, Geofence, HexMetrics } from './types';
import { DELIVERIES as INITIAL_DELIVERIES } from './constants';
import { getDeliveryIntelligence, AIInsightResponse } from './services/geminiService';
import * as h3 from 'h3-js';

interface AppNotification {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  message: string;
}

const SecondaryPanel: React.FC<{ 
  title: string; 
  children: React.ReactNode; 
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
}> = ({ title, children, searchPlaceholder, searchValue, onSearchChange }) => (
  <div className="w-[340px] bg-[#0c0c0c] border-r border-neutral-900 flex flex-col h-full z-10 animate-in fade-in slide-in-from-left-4 duration-300">
    <div className="p-5 border-b border-neutral-900/50">
      <h2 className="text-xs font-black uppercase tracking-widest text-white mb-4">{title}</h2>
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-cyan-400 transition-colors" size={14} />
        <input 
          type="text" 
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder={searchPlaceholder || `Search ${title}...`} 
          className="w-full bg-[#121212] border border-neutral-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-neutral-300 focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-neutral-700"
        />
      </div>
    </div>
    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
      {children}
    </div>
  </div>
);

const App: React.FC = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>(INITIAL_DELIVERIES);
  const [selected, setSelected] = useState<Delivery | null>(null);
  const [selectedHex, setSelectedHex] = useState<HexMetrics | null>(null);
  const [insight, setInsight] = useState<AIInsightResponse | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [currentView, setCurrentView] = useState('ops');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isAddingZone, setIsAddingZone] = useState(false);

  const [geofences, setGeofences] = useState<Geofence[]>([
    { id: 'GF-01', name: 'Kigali Logistics Hub', lat: -1.9441, lng: 30.0619, radius: 500, active: true, type: 'HUB' },
    { id: 'GF-02', name: 'Nyabugogo Market', lat: -1.9392, lng: 30.0445, radius: 300, active: true, type: 'RESTRICTED' }
  ]);

  const prevInZones = useRef<Record<string, Set<string>>>({});

  // Simulation loop for movement and metrics
  useEffect(() => {
    const interval = setInterval(() => {
      setDeliveries(current => 
        current.map(d => {
          if (['OUT_FOR_DELIVERY', 'PICKED_UP', 'DELAYED'].includes(d.status)) {
            const nextProgress = Math.min(1, d.progress + 0.002);
            const curLat = d.pickup.lat + (d.dropoff.lat - d.pickup.lat) * nextProgress;
            const curLng = d.pickup.lng + (d.dropoff.lng - d.pickup.lng) * nextProgress;
            const currentH3 = h3.latLngToCell(curLat, curLng, 9);

            const pickupH3 = h3.latLngToCell(d.pickup.lat, d.pickup.lng, 9);
            const gridDist = h3.gridDistance(pickupH3, currentH3);
            
            // ETA Logic: Based on H3 grid distance and average traversal speed
            const remainingHexes = h3.gridDistance(currentH3, h3.latLngToCell(d.dropoff.lat, d.dropoff.lng, 9));
            const timeToDestination = remainingHexes * 3.5; // Avg 3.5 mins per Res 9 hex

            return {
              ...d,
              progress: nextProgress,
              h3Current: currentH3,
              metrics: {
                hexDistance: gridDist,
                congestionScore: Math.random() > 0.8 ? 0.7 : 0.2,
                basePrice: gridDist * 220, // 220 RF per hex unit
                timeToDestination
              },
              status: nextProgress >= 1 ? 'DELIVERED' : d.status
            };
          }
          return d;
        })
      );
    }, 4000); 
    return () => clearInterval(interval);
  }, []);

  const addNotification = (message: string, type: AppNotification['type'] = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
  };

  const handleHexSelect = (h3Index: string) => {
    const res = h3.getResolution(h3Index);
    const edgeLength = h3.getHexagonEdgeLengthAvg(res, 'km');
    const avgDistanceKm = edgeLength * 1.732; // Approx distance across hex center to center
    
    // Dynamic charge calculation: Base + Congestion penalty
    const baseCharge = 500; // Base RF
    const congestionFactor = Math.random();
    const chargePerKm = baseCharge * (1 + congestionFactor);
    
    // Traversal time based on avg city speed (25km/h)
    const timeToCrossMins = (avgDistanceKm / 25) * 60;

    setSelectedHex({
      h3Index,
      chargePerKm,
      timeToCrossMins,
      avgDistanceKm,
      congestionFactor
    });
  };

  const renderSecondaryContent = () => {
    switch (currentView) {
      case 'ops':
        return <TrackingList deliveries={deliveries} onSelect={(d) => setSelected(d)} />;
      case 'geofencing':
        return (
          <SecondaryPanel title="Spatial Constraints">
            <div className="space-y-4">
              <div className="bg-black/40 border border-neutral-800 p-4 rounded-2xl">
                 <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black text-white uppercase italic">Active Zones</span>
                    {/* Fixed: Use Plus icon which is now imported */}
                    <button onClick={() => setIsAddingZone(!isAddingZone)} className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center text-black">
                       <Plus size={16} />
                    </button>
                 </div>
                 <div className="space-y-2">
                    {geofences.map(g => (
                      <div key={g.id} className="flex items-center justify-between p-2 bg-neutral-900/50 rounded-xl border border-neutral-800">
                         <div className="flex items-center gap-2">
                            <MapPin size={12} className={g.type === 'RESTRICTED' ? 'text-red-400' : 'text-cyan-400'} />
                            <span className="text-[10px] font-bold text-neutral-300">{g.name}</span>
                         </div>
                         <div className={`w-2 h-2 rounded-full ${g.active ? 'bg-green-500' : 'bg-neutral-600'}`} />
                      </div>
                    ))}
                 </div>
              </div>

              {selectedHex ? (
                <div className="bg-cyan-500/5 border border-cyan-500/20 p-5 rounded-3xl animate-in zoom-in-95 duration-300">
                  <div className="flex items-center gap-2 mb-4">
                    <Hexagon size={18} className="text-cyan-400" />
                    <span className="text-xs font-black text-white uppercase italic tracking-tighter">Hex Intelligence</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-[9px] font-black text-neutral-500 uppercase mb-1">Charge Rate (KM/Hex)</p>
                      <div className="flex items-end gap-2">
                        <span className="text-xl font-black text-white italic">RF {Math.round(selectedHex.chargePerKm).toLocaleString()}</span>
                        <span className="text-[9px] text-cyan-400 font-bold mb-1">+{Math.round(selectedHex.congestionFactor * 100)}% Surge</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                       <div className="bg-neutral-900/40 p-3 rounded-2xl border border-neutral-800">
                          <Timer size={14} className="text-neutral-500 mb-2" />
                          <p className="text-[8px] font-black text-neutral-600 uppercase">Cross Time</p>
                          <p className="text-[11px] font-bold text-white">{selectedHex.timeToCrossMins.toFixed(1)} mins</p>
                       </div>
                       <div className="bg-neutral-900/40 p-3 rounded-2xl border border-neutral-800">
                          <Navigation size={14} className="text-neutral-500 mb-2" />
                          <p className="text-[8px] font-black text-neutral-600 uppercase">Distance</p>
                          <p className="text-[11px] font-bold text-white">~{selectedHex.avgDistanceKm.toFixed(3)} km</p>
                       </div>
                    </div>

                    <div className="bg-black/60 p-3 rounded-2xl border border-neutral-800 flex items-center justify-between">
                       <div>
                          <p className="text-[8px] font-black text-neutral-600 uppercase">H3 Index</p>
                          <p className="text-[10px] font-mono text-neutral-400">{selectedHex.h3Index}</p>
                       </div>
                       <Activity size={16} className="text-cyan-500/40" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-10 border-2 border-dashed border-neutral-800 rounded-3xl text-center">
                   <p className="text-[10px] font-black text-neutral-600 uppercase leading-relaxed">Select a hexagon on the global grid to view local pricing & traversal metrics</p>
                </div>
              )}
            </div>
          </SecondaryPanel>
        );
      default:
        return <TrackingList deliveries={deliveries} onSelect={(d) => setSelected(d)} />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#050505] text-white overflow-hidden">
      <Sidebar 
        onViewChange={setCurrentView} 
        activeView={currentView} 
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-neutral-900 flex items-center justify-between px-6 bg-[#080808] z-40 shrink-0">
          <div className="flex items-center gap-8">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">Global Ops</span>
              <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                <Activity size={12} className="animate-pulse" /> NETWORK ACTIVE
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="bg-neutral-900 px-3 py-1 rounded-full border border-neutral-800 text-[10px] font-black text-neutral-500 uppercase italic">
                {deliveries.filter(d => d.status === 'OUT_FOR_DELIVERY').length} En Route
             </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden relative">
          {renderSecondaryContent()}
          
          <div className="flex-1 relative">
            <WorldMap 
              deliveries={deliveries} 
              geofences={geofences}
              isAddingZone={isAddingZone}
              onHexClick={handleHexSelect}
              viewMode={currentView === 'ai' ? 'analytics' : 'ops'}
            />

            {selected && (
              <div className="absolute top-6 left-6 z-40 w-[350px] bg-black/95 backdrop-blur-xl border border-neutral-800/80 rounded-[2rem] p-6 shadow-2xl animate-in fade-in slide-in-from-left-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                       <Truck size={22} className="text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white italic tracking-tighter">{selected.id}</h3>
                      <p className="text-[9px] text-neutral-500 font-black uppercase">{selected.driverName}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-neutral-600 hover:text-white transition-colors">
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-4">
                   <div className="bg-neutral-900/50 p-4 rounded-2xl border border-neutral-800 flex justify-between">
                      <div>
                         <p className="text-[8px] font-black text-neutral-600 uppercase mb-1">Live ETA</p>
                         <p className="text-sm font-black text-cyan-400">{Math.round(selected.metrics?.timeToDestination || 0)} Mins Remaining</p>
                      </div>
                      <div className="text-right">
                         <p className="text-[8px] font-black text-neutral-600 uppercase mb-1">Status</p>
                         <span className="text-[9px] font-black px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded-md">LIVE</span>
                      </div>
                   </div>

                   <div className="flex items-center gap-3 text-[10px] font-bold text-neutral-400">
                      <Clock size={14} className="text-neutral-600" />
                      Started {selected.startTime} • Dest: {selected.dropoff.name}
                   </div>

                   <div className="bg-neutral-900/30 p-4 rounded-2xl border border-neutral-800/50">
                      <p className="text-[9px] font-black text-neutral-500 uppercase mb-2">Spatial Context</p>
                      <p className="text-[11px] text-neutral-300 italic leading-relaxed">Currently traversing H3 {selected.h3Current}. Delay risk is minimal at this resolution.</p>
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {notifications.map(n => (
          <div key={n.id} className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border bg-black/90 backdrop-blur-xl border-neutral-800 text-neutral-300 shadow-2xl animate-in slide-in-from-right-10">
            <Zap size={18} className="text-cyan-400" />
            <span className="text-[11px] font-bold">{n.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
