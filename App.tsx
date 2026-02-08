
import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { TrackingList } from './components/TrackingList';
import { WorldMap } from './components/WorldMap';
// Fix: Added missing 'Zap' icon import from lucide-react
import { Bell, Moon, Sun, User, Info, Users, Phone, Zap } from 'lucide-react';
import { Shipment } from './types';
import { getSmartRouteInsight } from './services/geminiService';

const App: React.FC = () => {
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [insight, setInsight] = useState<any>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  const handleSelectShipment = async (s: Shipment) => {
    setSelectedShipment(s);
    setLoadingInsight(true);
    const data = await getSmartRouteInsight(s.origin.name, s.destination.name);
    setInsight(data);
    setLoadingInsight(false);
  };

  return (
    <div className="flex h-screen w-full bg-[#050505] text-white overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-neutral-900 flex items-center justify-between px-8 bg-[#0a0a0a] z-30">
          <div className="flex items-center gap-6">
            <button className="text-xs font-semibold text-neutral-400 hover:text-white transition-colors flex items-center gap-2">
              <Info size={14} /> Prohibited goods
            </button>
            <button className="text-xs font-semibold text-neutral-400 hover:text-white transition-colors flex items-center gap-2">
              <Users size={14} /> Partners
            </button>
            <button className="text-xs font-semibold text-neutral-400 hover:text-white transition-colors flex items-center gap-2">
              <Phone size={14} /> Contact
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex bg-neutral-900 rounded-lg p-1">
              <button className="p-1.5 text-neutral-500 hover:text-neutral-300"><Sun size={14} /></button>
              <button className="p-1.5 bg-neutral-800 text-white rounded shadow-sm"><Moon size={14} /></button>
            </div>
            <button className="relative p-2 text-neutral-400 hover:text-white transition-colors">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-[#0a0a0a]"></span>
            </button>
            <div className="h-8 w-[1px] bg-neutral-800 mx-2"></div>
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 overflow-hidden">
                <img src="https://picsum.photos/seed/user1/64/64" alt="Profile" className="w-full h-full object-cover" />
              </div>
              <User size={16} className="text-neutral-500 group-hover:text-white transition-colors" />
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <TrackingList onSelect={handleSelectShipment} />
          
          <div className="flex-1 relative">
            <WorldMap />

            {/* Smart Route Detail Panel (Gemini Powered) */}
            {selectedShipment && (
              <div className="absolute top-6 left-6 z-40 w-80 bg-black/90 backdrop-blur-xl border border-neutral-800 rounded-2xl p-5 shadow-2xl animate-in fade-in slide-in-from-left-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest">{selectedShipment.id}</h3>
                    <p className="text-[10px] text-neutral-500 font-medium">Route Intelligence</p>
                  </div>
                  <button onClick={() => setSelectedShipment(null)} className="text-neutral-500 hover:text-white text-xs">Close</button>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></div>
                      <p className="text-[11px] font-bold text-neutral-200">{selectedShipment.origin.name}</p>
                   </div>
                   <div className="ml-0.5 border-l border-neutral-800 pl-4 py-2 flex flex-col gap-2">
                      <div className="text-[10px] font-semibold text-neutral-600">MODALITY: <span className="text-neutral-300 uppercase">{selectedShipment.type}</span></div>
                      <div className="text-[10px] font-semibold text-neutral-600">EST. ARRIVAL: <span className="text-neutral-300 uppercase">{selectedShipment.arrivalDate}</span></div>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-neutral-600"></div>
                      <p className="text-[11px] font-bold text-neutral-200">{selectedShipment.destination.name}</p>
                   </div>
                </div>

                <div className="mt-6 pt-6 border-t border-neutral-800">
                  <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Zap size={10} className="text-cyan-400" /> AI Optimization
                  </h4>
                  
                  {loadingInsight ? (
                    <div className="space-y-2 animate-pulse">
                      <div className="h-3 bg-neutral-800 rounded w-full"></div>
                      <div className="h-3 bg-neutral-800 rounded w-3/4"></div>
                    </div>
                  ) : insight ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-neutral-400">Risk Level</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${insight.riskLevel === 'Low' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>{insight.riskLevel}</span>
                      </div>
                      <p className="text-[10px] text-neutral-300 leading-relaxed italic">"{insight.summary}"</p>
                      <div>
                        <p className="text-[9px] font-bold text-neutral-500 uppercase mb-1">Danger Zones Identified:</p>
                        <div className="flex flex-wrap gap-1">
                          {insight.dangerZones.map((zone: string, i: number) => (
                            <span key={i} className="text-[8px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded">{zone}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-neutral-600">Select a route to generate AI insights.</p>
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
