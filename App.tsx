
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
  PlusCircle
} from 'lucide-react';
import { Delivery, Geofence } from './types';
import { DELIVERIES as INITIAL_DELIVERIES } from './constants';
import { getDeliveryIntelligence, AIInsightResponse } from './services/geminiService';

// Notification System
interface AppNotification {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  message: string;
}

// Mock Secondary View Components
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
  const [insight, setInsight] = useState<AIInsightResponse | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [currentView, setCurrentView] = useState('ops');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [registrySearch, setRegistrySearch] = useState('');
  const [driverSearch, setDriverSearch] = useState('');
  const [geofenceSearch, setGeofenceSearch] = useState('');
  const [isAddingZone, setIsAddingZone] = useState(false);

  const [geofences, setGeofences] = useState<Geofence[]>([
    { id: 'GF-01', name: 'Downtown Kigali Hub', lat: -1.9441, lng: 30.0619, radius: 500, active: true, type: 'HUB' },
    { id: 'GF-02', name: 'Nyabugogo High-Risk', lat: -1.9392, lng: 30.0445, radius: 300, active: true, type: 'RESTRICTED' }
  ]);

  const prevInZones = useRef<Record<string, Set<string>>>({});

  useEffect(() => {
    const interval = setInterval(() => {
      setDeliveries(current => 
        current.map(d => {
          if (['OUT_FOR_DELIVERY', 'PICKED_UP'].includes(d.status)) {
            const nextProgress = Math.min(1, d.progress + 0.005);
            
            // Geofence checking logic
            const curLat = d.pickup.lat + (d.dropoff.lat - d.pickup.lat) * nextProgress;
            const curLng = d.pickup.lng + (d.dropoff.lng - d.pickup.lng) * nextProgress;

            geofences.forEach(g => {
              if (!g.active) return;
              
              // Simple dist calculation
              const dx = (curLat - g.lat) * 111320;
              const dy = (curLng - g.lng) * 40075000 * Math.cos(g.lat * Math.PI / 180) / 360;
              const dist = Math.sqrt(dx * dx + dy * dy);
              
              const vehicleZones = prevInZones.current[d.id] || new Set();
              const isInside = dist <= g.radius;
              const wasInside = vehicleZones.has(g.id);

              if (isInside && !wasInside) {
                addNotification(`${d.driverName} entered ${g.name}`, g.type === 'RESTRICTED' ? 'warning' : 'info');
                vehicleZones.add(g.id);
              } else if (!isInside && wasInside) {
                addNotification(`${d.driverName} exited ${g.name}`, 'info');
                vehicleZones.delete(g.id);
              }
              prevInZones.current[d.id] = vehicleZones;
            });

            return {
              ...d,
              progress: nextProgress,
              status: nextProgress >= 1 ? 'DELIVERED' : d.status
            };
          }
          return d;
        })
      );
    }, 5000); 
    return () => clearInterval(interval);
  }, [geofences]);

  const addNotification = (message: string, type: AppNotification['type'] = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const handleAddGeofence = (lat: number, lng: number) => {
    if (!isAddingZone) return;
    const newG: Geofence = {
      id: `GF-${Date.now()}`,
      name: `Custom Zone ${geofences.length + 1}`,
      lat,
      lng,
      radius: 400,
      active: true,
      type: 'CUSTOMER_ZONE'
    };
    setGeofences(prev => [...prev, newG]);
    setIsAddingZone(false);
    addNotification("New zone defined in matrix", "success");
  };

  const removeGeofence = (id: string) => {
    setGeofences(prev => prev.filter(g => g.id !== id));
    addNotification("Zone removed from command", "info");
  };

  const handleSelect = async (d: Delivery) => {
    setSelected(d);
    setLoadingInsight(true);
    const data = await getDeliveryIntelligence(d.id, d.driverName, d.vehicleType);
    
    if (data.error) {
      addNotification(data.error, data.errorType === 'AUTH' ? 'error' : 'warning');
    }
    
    setInsight(data);
    setLoadingInsight(false);
  };

  const renderSecondaryContent = () => {
    switch (currentView) {
      case 'ops':
        return <TrackingList deliveries={deliveries} onSelect={handleSelect} />;
      case 'geofencing':
        const filteredZones = geofences.filter(g => g.name.toLowerCase().includes(geofenceSearch.toLowerCase()));
        return (
          <SecondaryPanel 
            title="Geofencing Matrix" 
            searchPlaceholder="Search zones..."
            searchValue={geofenceSearch}
            onSearchChange={setGeofenceSearch}
          >
            <button 
              onClick={() => setIsAddingZone(true)}
              className="w-full flex items-center justify-center gap-2 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-[10px] font-black text-cyan-400 uppercase tracking-widest hover:bg-cyan-500/20 transition-all mb-4"
            >
              <PlusCircle size={14} /> Define New Zone
            </button>
            {filteredZones.map(g => (
              <div key={g.id} className="bg-neutral-900/40 p-4 rounded-xl border border-neutral-800/50 flex flex-col gap-3 group">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className={g.type === 'RESTRICTED' ? "text-red-500" : "text-cyan-400"} />
                    <span className="text-[11px] font-black text-white">{g.name}</span>
                  </div>
                  <button onClick={() => removeGeofence(g.id)} className="text-neutral-600 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="flex justify-between items-end">
                   <div className="flex flex-col">
                      <span className="text-[8px] font-bold text-neutral-600 uppercase">Radius</span>
                      <span className="text-[10px] font-black text-neutral-300">{g.radius}m</span>
                   </div>
                   <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${g.type === 'RESTRICTED' ? 'bg-red-500/10 text-red-500' : 'bg-cyan-500/10 text-cyan-500'}`}>
                      {g.type}
                   </div>
                </div>
              </div>
            ))}
          </SecondaryPanel>
        );
      case 'fleet':
        const fleetData = [
          { vin: 'VIN-RW-9901', plate: 'RAE 101 A', status: 'Optimal', battery: 92 },
          { vin: 'VIN-RW-8822', plate: 'RAE 442 B', status: 'Optimal', battery: 78 },
          { vin: 'VIN-RW-7731', plate: 'RAB 919 C', status: 'Maintenance', battery: 12 },
          { vin: 'VIN-RW-4412', plate: 'RAC 001 D', status: 'Charging', battery: 45 },
          { vin: 'VIN-RW-5520', plate: 'RAD 555 E', status: 'Optimal', battery: 88 }
        ].filter(v => v.vin.includes(registrySearch) || v.plate.includes(registrySearch));

        return (
          <SecondaryPanel 
            title="Fleet Registry" 
            searchPlaceholder="Search VIN or Plate..."
            searchValue={registrySearch}
            onSearchChange={setRegistrySearch}
          >
            {fleetData.map(v => (
              <div key={v.vin} className="bg-neutral-900/40 p-4 rounded-xl border border-neutral-800/50 hover:border-cyan-500/30 transition-all cursor-pointer group">
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 rounded-lg bg-cyan-500/5 group-hover:bg-cyan-500/10 transition-colors">
                    <Truck size={16} className="text-cyan-400" />
                  </div>
                  <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${v.status === 'Maintenance' ? 'text-amber-500 border-amber-500/20 bg-amber-500/5' : v.status === 'Charging' ? 'text-blue-500 border-blue-500/20 bg-blue-500/5' : 'text-green-500 border-green-500/20 bg-green-500/5'}`}>
                    {v.status}
                  </span>
                </div>
                <div className="flex flex-col">
                  <p className="text-[10px] font-bold text-white uppercase tracking-wider">{v.plate}</p>
                  <p className="text-[8px] font-medium text-neutral-600 uppercase">{v.vin}</p>
                </div>
                <div className="flex gap-2 mt-3 items-center">
                  <Battery size={12} className={v.battery < 20 ? "text-red-500" : "text-cyan-500"} />
                  <div className="h-1 flex-1 bg-neutral-800 rounded-full overflow-hidden">
                    <div className={`h-full ${v.battery < 20 ? 'bg-red-500' : 'bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.5)]'}`} style={{ width: `${v.battery}%` }} />
                  </div>
                  <span className="text-[8px] font-black text-neutral-500">{v.battery}%</span>
                </div>
              </div>
            ))}
          </SecondaryPanel>
        );
      case 'drivers':
        const drivers = [
          { name: 'Jean-Luc Habimana', status: 'On-Shift', score: 98, hours: '4h 20m' },
          { name: 'Alice Mutoni', status: 'On-Shift', score: 95, hours: '2h 15m' },
          { name: 'David Kagame', status: 'Off-Shift', score: 99, hours: '0h 0m' },
          { name: 'Grace Uwase', status: 'On-Shift', score: 88, hours: '6h 45m' }
        ].filter(d => d.name.toLowerCase().includes(driverSearch.toLowerCase()));

        return (
          <SecondaryPanel 
            title="Driver Management" 
            searchValue={driverSearch}
            onSearchChange={setDriverSearch}
          >
            {drivers.map(d => (
              <div key={d.name} className="bg-neutral-900/40 p-4 rounded-xl border border-neutral-800/50 flex items-center gap-4 hover:border-cyan-500/20 transition-all cursor-pointer">
                <div className="w-10 h-10 rounded-full border border-neutral-700 p-0.5 bg-neutral-800 overflow-hidden shrink-0">
                  <img src={`https://picsum.photos/seed/${d.name}/64/64`} className="w-full h-full rounded-full grayscale hover:grayscale-0 transition-all" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-white truncate">{d.name}</p>
                  <p className={`text-[9px] font-bold uppercase tracking-tighter ${d.status === 'On-Shift' ? 'text-cyan-500' : 'text-neutral-600'}`}>
                    {d.status === 'On-Shift' ? `Active: ${d.hours}` : 'Offline'}
                  </p>
                </div>
                <div className="text-right">
                   <div className="text-[10px] font-black text-white flex items-center justify-end gap-1">
                      <ShieldCheck size={10} className="text-green-500" />
                      {d.score}%
                   </div>
                   <div className="text-[7px] font-bold text-neutral-600 uppercase">SAFETY</div>
                </div>
              </div>
            ))}
          </SecondaryPanel>
        );
      case 'revenue':
        return (
          <SecondaryPanel title="Market Performance">
             <div className="bg-cyan-500/5 border border-cyan-500/10 p-5 rounded-2xl mb-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <BarChart3 size={40} className="text-cyan-400" />
                </div>
                <p className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-1">Projected Gross (Daily)</p>
                <p className="text-2xl font-black text-white tracking-tighter">RF 842,910</p>
                <div className="mt-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[9px] font-bold text-green-500 flex items-center gap-1">
                    <ArrowUpRight size={10} /> +12.4% vs prev week
                  </span>
                </div>
             </div>

             <div className="mb-6">
                <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest mb-3">Zone Performance (Last 24h)</p>
                <div className="space-y-1">
                  {[
                    { zone: 'Nyarugenge', val: '240k', grow: true },
                    { zone: 'Gasabo', val: '410k', grow: true },
                    { zone: 'Kicukiro', val: '192k', grow: false },
                    { zone: 'Remote/Special', val: '12k', grow: true }
                  ].map((z) => (
                    <div key={z.zone} className="flex justify-between items-center p-3 rounded-lg hover:bg-neutral-900 transition-colors border-b border-neutral-900/50">
                        <span className="text-[10px] font-bold text-neutral-400">{z.zone}</span>
                        <div className="text-right">
                          <span className="text-[10px] font-black text-white block">RF {z.val}</span>
                          <span className={`text-[7px] font-black uppercase ${z.grow ? 'text-green-500' : 'text-red-500'}`}>
                            {z.grow ? 'Stable' : 'Volatile'}
                          </span>
                        </div>
                    </div>
                  ))}
                </div>
             </div>
          </SecondaryPanel>
        );
      case 'sla':
        return (
          <SecondaryPanel title="SLA Compliance Log">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-neutral-900/20 p-4 rounded-xl border border-neutral-800/50 hover:bg-neutral-900/40 transition-colors cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className={i === 2 ? "text-red-500" : "text-amber-500"} />
                    <span className="text-[10px] font-black text-white uppercase">Log #RW-{i}08</span>
                  </div>
                  <span className="text-[8px] text-neutral-600 font-bold">2m ago</span>
                </div>
                <p className="text-[10px] text-neutral-400 leading-relaxed font-medium">
                  {i === 2 ? "CRITICAL: Delivery RW-KGL-002 exceeded threshold by 12min." : "Operational Adjustment: Reroute successful in Kicukiro Sector 3."}
                </p>
              </div>
            ))}
          </SecondaryPanel>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#050505] text-white overflow-hidden selection:bg-cyan-500/30">
      <Sidebar 
        onViewChange={setCurrentView} 
        activeView={currentView} 
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      
      <main className="flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out">
        {/* Persistent Header */}
        <header className="h-14 border-b border-neutral-900 flex items-center justify-between px-6 bg-[#080808] z-40 shrink-0">
          <div className="flex items-center gap-8">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">Fleet Connectivity</span>
              <span className="text-xs font-bold text-green-500 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> 1 Operational Node
              </span>
            </div>
            <div className="flex flex-col border-l border-neutral-800 pl-8">
              <span className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">Daily Forecast</span>
              <span className="text-xs font-black text-cyan-400">RF 842k</span>
            </div>
            <div className="hidden lg:flex flex-col border-l border-neutral-800 pl-8">
              <span className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">Global Status</span>
              <span className="text-xs font-black text-white tracking-tighter">RWANDA-OPS</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-neutral-900/40 rounded-full border border-neutral-800 text-[10px] font-bold text-neutral-400">
              <TrendingUp size={12} className="text-cyan-400" /> +12.4% Growth
            </div>
            <button className="p-2 text-neutral-500 hover:text-white transition-colors relative">
              <Bell size={18} />
              <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-cyan-500 rounded-full" />
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-neutral-800">
               <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-black text-white">Cmdr. Nexus</p>
                  <p className="text-[8px] font-bold text-cyan-500 uppercase tracking-tighter">East Africa Tier 1</p>
               </div>
               <div className="w-8 h-8 rounded-full border border-neutral-800 p-0.5 grayscale hover:grayscale-0 transition-all cursor-pointer">
                 <img src="https://picsum.photos/seed/commander/32/32" alt="Avatar" className="w-full h-full rounded-full object-cover" />
               </div>
            </div>
          </div>
        </header>

        {/* Dynamic Navigation Area */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Secondary Panel */}
          {renderSecondaryContent()}
          
          {/* Main Map Content */}
          <div className="flex-1 relative">
            <WorldMap 
              deliveries={deliveries} 
              geofences={geofences}
              isAddingZone={isAddingZone}
              onAddGeofence={handleAddGeofence}
            />

            {/* AI Insights Card */}
            {selected && (
              <div className="absolute top-6 left-6 z-40 w-[350px] bg-black/95 backdrop-blur-xl border border-neutral-800/80 rounded-[2rem] p-6 shadow-2xl animate-in fade-in slide-in-from-left-8 duration-500">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                       <Cpu size={22} className="text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white italic tracking-tighter">{selected.id}</h3>
                      <p className="text-[9px] text-neutral-500 font-black uppercase tracking-widest">{selected.driverName}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-neutral-600 hover:text-white transition-colors p-1 rounded hover:bg-neutral-900">
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-4">
                  {loadingInsight ? (
                    <div className="space-y-4">
                      <div className="h-4 bg-neutral-900 rounded-lg animate-pulse" />
                      <div className="h-12 bg-neutral-900 rounded-lg animate-pulse" />
                      <div className="h-20 bg-neutral-900 rounded-lg animate-pulse" />
                    </div>
                  ) : insight && (
                    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                      <div className="bg-neutral-900/50 p-3 rounded-xl border border-neutral-800/60 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-neutral-500">Risk Profile</span>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${insight.riskLevel === 'Low' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                          {insight.riskLevel}
                        </span>
                      </div>
                      
                      <div className="bg-cyan-500/5 p-4 rounded-2xl border border-cyan-500/10 relative group">
                        <Zap size={14} className="absolute top-4 right-4 text-cyan-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                        <p className="text-[11px] text-neutral-300 leading-relaxed">"{insight.summary}"</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-neutral-900/30 p-3 rounded-xl border border-neutral-800/50">
                          <p className="text-[8px] font-black text-neutral-600 uppercase mb-1">Fleet Sync</p>
                          <p className="text-[10px] text-cyan-400 font-bold leading-tight">{insight.efficiencyInsight}</p>
                        </div>
                        <div className="bg-neutral-900/30 p-3 rounded-xl border border-neutral-800/50 text-right">
                          <p className="text-[8px] font-black text-neutral-600 uppercase mb-1">Safety Index</p>
                          <p className="text-xl font-black text-white">{insight.driverWellnessScore}%</p>
                        </div>
                      </div>
                      
                      <button className="w-full bg-cyan-400 hover:bg-white py-3 rounded-xl text-black text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                        Dispatch Override
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Notifications Portal */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {notifications.map(n => (
          <div key={n.id} className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border bg-black/90 backdrop-blur-xl shadow-2xl animate-in slide-in-from-right-10 duration-300 min-w-[280px] ${n.type === 'error' ? 'border-red-500/50 text-red-400' : n.type === 'warning' ? 'border-amber-500/50 text-amber-500' : 'border-neutral-800 text-neutral-300'}`}>
            {n.type === 'error' || n.type === 'warning' ? <AlertTriangle size={18} /> : <Zap size={18} />}
            <span className="text-[11px] font-bold">{n.message}</span>
            <button onClick={() => setNotifications(prev => prev.filter(nn => nn.id !== n.id))} className="ml-auto p-1 hover:bg-white/10 rounded">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
