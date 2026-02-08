
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TrackingList } from './components/TrackingList';
import { WorldMap } from './components/WorldMap';
import { Bell, LayoutGrid, Zap, ShieldAlert, TrendingUp, Cpu } from 'lucide-react';
import { Delivery } from './types';
import { DELIVERIES as INITIAL_DELIVERIES } from './constants';
import { getDeliveryIntelligence } from './services/geminiService';

const App: React.FC = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>(INITIAL_DELIVERIES);
  const [selected, setSelected] = useState<Delivery | null>(null);
  const [insight, setInsight] = useState<any>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  // Real-time Fleet Simulation Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setDeliveries(current => 
        current.map(d => {
          if (['OUT_FOR_DELIVERY', 'PICKED_UP'].includes(d.status)) {
            const nextProgress = Math.min(1, d.progress + 0.008); // Steady progression
            return {
              ...d,
              progress: nextProgress,
              status: nextProgress >= 1 ? 'DELIVERED' : d.status
            };
          }
          return d;
        })
      );
    }, 15000); 

    return () => clearInterval(interval);
  }, []);

  const handleSelect = async (d: Delivery) => {
    setSelected(d);
    setLoadingInsight(true);
    const data = await getDeliveryIntelligence(d.id, d.driverName, d.vehicleType);
    setInsight(data);
    setLoadingInsight(false);
  };

  return (
    <div className="flex h-screen w-full bg-[#050505] text-white overflow-hidden selection:bg-cyan-500/30">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Management KPI Header */}
        <header className="h-16 border-b border-neutral-900 flex items-center justify-between px-8 bg-[#080808] z-30">
          <div className="flex items-center gap-10">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.3em]">Fleet Status</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-xs font-bold text-green-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> 
                  12 Active
                </span>
                <span className="text-neutral-800">/</span>
                <span className="text-xs font-bold text-neutral-400">2 Idle</span>
              </div>
            </div>
            
            <div className="h-8 w-[1px] bg-neutral-900" />

            <div className="flex items-center gap-8">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">SLA Score</span>
                <span className="text-xs font-black text-white">99.2%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Est. Revenue</span>
                <span className="text-xs font-black text-cyan-400">$2.4k / hr</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900/50 rounded-xl border border-neutral-800">
              <TrendingUp size={14} className="text-cyan-400" />
              <span className="text-[10px] font-black text-neutral-300">+4% Vol</span>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="relative p-2.5 bg-neutral-900/40 rounded-xl border border-neutral-800 text-neutral-500 hover:text-white transition-all hover:bg-neutral-800">
                <Bell size={18} />
                <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-cyan-500 rounded-full" />
              </button>
              <div className="w-10 h-10 rounded-full border-2 border-neutral-800 p-0.5 hover:border-cyan-500/40 transition-all cursor-pointer">
                <img src="https://picsum.photos/seed/manager/64/64" alt="Manager" className="w-full h-full rounded-full object-cover grayscale hover:grayscale-0 transition-all" />
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <TrackingList deliveries={deliveries} onSelect={handleSelect} />
          
          <div className="flex-1 relative">
            <WorldMap deliveries={deliveries} />

            {/* AI Command Intelligence Overlay */}
            {selected && (
              <div className="absolute top-8 left-8 z-40 w-[380px] bg-black/95 backdrop-blur-2xl border border-neutral-800/80 rounded-[2.5rem] p-8 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9)] animate-in fade-in slide-in-from-left-12 duration-700">
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 flex items-center justify-center border border-cyan-500/20">
                       <Cpu size={28} className="text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white uppercase italic tracking-tighter">{selected.id}</h3>
                      <p className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.2em]">{selected.driverName}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)} className="p-2 hover:bg-neutral-800 rounded-full text-neutral-500">
                    <span className="text-[10px] font-black">X</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-neutral-900/40 p-5 rounded-3xl border border-neutral-800/40">
                    <p className="text-[10px] font-black text-neutral-600 uppercase mb-2">Fleet Asset</p>
                    <p className="text-xs font-black text-white uppercase tracking-wider">{selected.vehicleType}</p>
                  </div>
                  <div className="bg-neutral-900/40 p-5 rounded-3xl border border-neutral-800/40">
                    <p className="text-[10px] font-black text-neutral-600 uppercase mb-2">SLA Priority</p>
                    <p className={`text-xs font-black uppercase ${selected.priority === 'high' ? 'text-red-500' : 'text-cyan-400'}`}>{selected.priority}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em] flex items-center gap-3">
                    <Zap size={14} className="text-cyan-400 animate-pulse" /> Operational Command
                  </h4>

                  {loadingInsight ? (
                    <div className="space-y-4">
                      <div className="h-5 bg-neutral-900 rounded-xl animate-pulse" />
                      <div className="h-16 bg-neutral-900 rounded-xl animate-pulse" />
                    </div>
                  ) : insight ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between bg-cyan-400/5 p-4 rounded-2xl border border-cyan-400/10">
                        <span className="text-[11px] font-bold text-neutral-400">System Risk</span>
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${insight.riskLevel === 'Low' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                          {insight.riskLevel}
                        </span>
                      </div>
                      
                      <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-3xl blur opacity-25" />
                        <div className="relative bg-neutral-900/60 p-5 rounded-3xl border border-neutral-800/80">
                          <p className="text-xs text-neutral-300 leading-relaxed font-medium italic">
                            "{insight.summary}"
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between px-2">
                        <div>
                          <p className="text-[10px] font-black text-neutral-600 uppercase mb-1">Efficiency Node</p>
                          <p className="text-[11px] text-cyan-400 font-bold">{insight.efficiencyInsight}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-neutral-600 uppercase mb-1">Wellness</p>
                          <p className="text-lg font-black text-white">{insight.driverWellnessScore}%</p>
                        </div>
                      </div>

                      <button className="w-full bg-cyan-400 hover:bg-white py-4 rounded-2xl text-black text-[11px] font-black uppercase tracking-widest transition-all active:scale-[0.98]">
                        Dispatch Override
                      </button>
                    </div>
                  ) : (
                    <div className="p-8 text-center border-2 border-dashed border-neutral-800 rounded-3xl">
                      <p className="text-xs text-neutral-600 font-black uppercase tracking-widest">Awaiting AI Context...</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
