
import React, { useState, useEffect, Suspense } from 'react';
import { Sidebar } from './components/Sidebar';
import { TrackingList } from './components/TrackingList';
import { WorldMap } from './components/WorldMap';
import { Bell, Zap, ShieldAlert, TrendingUp, Cpu } from 'lucide-react';
import { Delivery } from './types';
import { DELIVERIES as INITIAL_DELIVERIES } from './constants';
import { getDeliveryIntelligence } from './services/geminiService';

const App: React.FC = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>(INITIAL_DELIVERIES);
  const [selected, setSelected] = useState<Delivery | null>(null);
  const [insight, setInsight] = useState<any>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setDeliveries(current => 
        current.map(d => {
          if (['OUT_FOR_DELIVERY', 'PICKED_UP'].includes(d.status)) {
            const nextProgress = Math.min(1, d.progress + 0.005);
            return {
              ...d,
              progress: nextProgress,
              status: nextProgress >= 1 ? 'DELIVERED' : d.status
            };
          }
          return d;
        })
      );
    }, 10000); 
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
      {/* Sidebar and Header are prioritized for Instant Load */}
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-neutral-900 flex items-center justify-between px-6 bg-[#080808] z-30 ui-shell-init">
          <div className="flex items-center gap-8">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">Fleet Active</span>
              <span className="text-xs font-bold text-green-500 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> 12 Drivers
              </span>
            </div>
            <div className="flex flex-col border-l border-neutral-800 pl-8">
              <span className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">Est. Revenue</span>
              <span className="text-xs font-black text-cyan-400">$2.4k / HR</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-neutral-900/40 rounded-full border border-neutral-800 text-[10px] font-bold text-neutral-400">
              <TrendingUp size={12} className="text-cyan-400" /> +4% Volume
            </div>
            <button className="p-2 text-neutral-500 hover:text-white transition-colors relative">
              <Bell size={18} />
              <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-cyan-500 rounded-full" />
            </button>
            <div className="w-8 h-8 rounded-full border border-neutral-800 p-0.5 grayscale hover:grayscale-0 transition-all cursor-pointer">
              <img src="https://picsum.photos/seed/m-02/32/32" alt="M" className="w-full h-full rounded-full object-cover" />
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <TrackingList deliveries={deliveries} onSelect={handleSelect} />
          
          <div className="flex-1 relative">
            <WorldMap deliveries={deliveries} />

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
                  <button onClick={() => setSelected(null)} className="text-neutral-600 hover:text-white transition-colors font-black text-[10px]">CLOSE</button>
                </div>

                <div className="space-y-4">
                  {loadingInsight ? (
                    <div className="space-y-3">
                      <div className="h-4 bg-neutral-900 rounded-lg animate-pulse" />
                      <div className="h-12 bg-neutral-900 rounded-lg animate-pulse" />
                    </div>
                  ) : insight && (
                    <div className="space-y-4">
                      <div className="bg-neutral-900/50 p-3 rounded-xl border border-neutral-800/60 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-neutral-500">Risk Profile</span>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${insight.riskLevel === 'Low' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                          {insight.riskLevel}
                        </span>
                      </div>
                      <div className="bg-cyan-500/5 p-4 rounded-2xl border border-cyan-500/10 italic text-[11px] text-neutral-300">
                        "{insight.summary}"
                      </div>
                      <div className="flex justify-between items-end px-1">
                        <div>
                          <p className="text-[8px] font-black text-neutral-600 uppercase mb-1">Fleet Efficiency</p>
                          <p className="text-[10px] text-cyan-400 font-bold">{insight.efficiencyInsight}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] font-black text-neutral-600 uppercase mb-1">Safety</p>
                          <p className="text-base font-black text-white">{insight.driverWellnessScore}%</p>
                        </div>
                      </div>
                      <button className="w-full bg-cyan-400 hover:bg-white py-3 rounded-xl text-black text-[10px] font-black uppercase tracking-widest transition-all">
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
    </div>
  );
};

export default App;
