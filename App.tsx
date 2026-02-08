
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TrackingList } from './components/TrackingList';
import { WorldMap } from './components/WorldMap';
import { Bell, User, LayoutGrid, Zap, ShieldAlert, TrendingUp } from 'lucide-react';
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
            const nextProgress = Math.min(1, d.progress + 0.015);
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
        <header className="h-16 border-b border-neutral-900 flex items-center justify-between px-8 bg-[#080808] z-30">
          <div className="flex items-center gap-10">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-[0.2em]">Active Fleet Status</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-xs font-bold text-green-500"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> 12 Drivers Active</span>
                <span className="text-neutral-700">/</span>
                <span className="text-xs font-bold text-neutral-400">2 In Maintenance</span>
              </div>
            </div>
            
            <div className="h-8 w-[1px] bg-neutral-900" />

            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-neutral-500 uppercase">Avg SLA</span>
                <span className="text-xs font-bold text-neutral-200">98.4%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-neutral-500 uppercase">Revenue / HR</span>
                <span className="text-xs font-bold text-cyan-400">$1,420.00</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900/50 rounded-full border border-neutral-800">
              <TrendingUp size={14} className="text-cyan-400" />
              <span className="text-[10px] font-bold text-neutral-300">+12% vs Yesterday</span>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="relative p-2 text-neutral-500 hover:text-white transition-colors">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-cyan-500 rounded-full border-2 border-[#080808]" />
              </button>
              <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center cursor-pointer hover:border-neutral-600 transition-all">
                <LayoutGrid size={18} className="text-neutral-400" />
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-cyan-500/20 p-0.5">
                <img src="https://picsum.photos/seed/admin/64/64" alt="Manager" className="w-full h-full rounded-full object-cover" />
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <TrackingList deliveries={deliveries} onSelect={handleSelect} />
          
          <div className="flex-1 relative">
            {/* Fix: Pass deliveries with corrected prop name and remove unnecessary casting */}
            <WorldMap deliveries={deliveries} />

            {selected && (
              <div className="absolute top-8 left-8 z-40 w-[360px] bg-[#0c0c0c]/90 backdrop-blur-2xl border border-neutral-800/50 rounded-3xl p-6 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-left-8 duration-500">
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center">
                       <Zap size={24} className="text-cyan-400 fill-cyan-400/20" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white uppercase italic">{selected.id}</h3>
                      <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">{selected.driverName}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)} className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-500">
                    <span className="text-xs font-bold">CLOSE</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-neutral-900/50 p-4 rounded-2xl border border-neutral-800/50">
                    <p className="text-[9px] font-bold text-neutral-600 uppercase mb-1">Vehicle</p>
                    <p className="text-xs font-black text-white uppercase">{selected.vehicleType}</p>
                  </div>
                  <div className="bg-neutral-900/50 p-4 rounded-2xl border border-neutral-800/50">
                    <p className="text-[9px] font-bold text-neutral-600 uppercase mb-1">Priority</p>
                    <p className={`text-xs font-black uppercase ${selected.priority === 'high' ? 'text-red-500' : 'text-cyan-400'}`}>{selected.priority}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <ShieldAlert size={14} className="text-cyan-400" /> Operational Insights
                  </h4>

                  {loadingInsight ? (
                    <div className="space-y-3">
                      <div className="h-4 bg-neutral-900 rounded-lg animate-pulse" />
                      <div className="h-4 bg-neutral-900 rounded-lg animate-pulse w-3/4" />
                    </div>
                  ) : insight ? (
                    <div className="space-y-5">
                      <div className="flex items-center justify-between bg-neutral-900/40 p-3 rounded-xl border border-neutral-800">
                        <span className="text-[11px] font-bold text-neutral-400">Risk Assessment</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${insight.riskLevel === 'Low' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                          {insight.riskLevel}
                        </span>
                      </div>
                      
                      <div className="bg-cyan-500/5 border border-cyan-500/10 p-4 rounded-2xl">
                        <p className="text-[11px] text-neutral-300 leading-relaxed font-medium italic">
                          "{insight.summary}"
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <p className="text-[9px] font-bold text-neutral-600 uppercase mb-1">Efficiency Insight</p>
                          <p className="text-[10px] text-neutral-400 font-bold">{insight.efficiencyInsight}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-bold text-neutral-600 uppercase mb-1">Wellness</p>
                          <p className="text-sm font-black text-cyan-400">{insight.driverWellnessScore}%</p>
                        </div>
                      </div>

                      <button className="w-full bg-cyan-400 py-3 rounded-xl text-black text-[11px] font-black uppercase tracking-tighter hover:bg-cyan-300 transition-all">
                        Dispatch Override
                      </button>
                    </div>
                  ) : (
                    <p className="text-[11px] text-neutral-600 font-bold">Select an active delivery for real-time AI command.</p>
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
