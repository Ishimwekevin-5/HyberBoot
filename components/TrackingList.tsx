
import React, { useState } from 'react';
import { Search, Filter, Truck, Bike, Zap, AlertCircle, CheckCircle2, MoreHorizontal } from 'lucide-react';
import { Delivery, DeliveryStatus } from '../types';

const StatusTag: React.FC<{ status: DeliveryStatus }> = ({ status }) => {
  const styles = {
    'OUT_FOR_DELIVERY': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    'PICKED_UP': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'PENDING': 'bg-neutral-500/10 text-neutral-500 border-neutral-800',
    'DELIVERED': 'bg-green-500/10 text-green-500 border-green-500/20',
    'DELAYED': 'bg-red-500/10 text-red-400 border-red-500/20'
  };
  return (
    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider ${styles[status]}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
};

interface TrackingListProps {
  deliveries: Delivery[];
  onSelect: (d: Delivery) => void;
}

export const TrackingList: React.FC<TrackingListProps> = ({ deliveries, onSelect }) => {
  const [search, setSearch] = useState('');

  const filtered = deliveries.filter(d => 
    d.id.toLowerCase().includes(search.toLowerCase()) || 
    d.driverName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-[340px] bg-[#0c0c0c] border-r border-neutral-900 flex flex-col h-full z-10">
      <div className="p-5 border-b border-neutral-900/50">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xs font-black uppercase tracking-widest text-white">Live Operations</h2>
          <span className="text-[10px] font-bold text-neutral-600 bg-neutral-900 px-2 py-0.5 rounded-full">{deliveries.length} ACTIVE</span>
        </div>

        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-cyan-400 transition-colors" size={14} />
          <input 
            type="text" 
            placeholder="Search driver or ID..." 
            className="w-full bg-[#121212] border border-neutral-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-neutral-300 focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-neutral-700"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filtered.map((d) => (
          <div 
            key={d.id} 
            className="p-5 border-b border-neutral-900/40 hover:bg-neutral-900/40 cursor-pointer transition-all group relative overflow-hidden"
            onClick={() => onSelect(d)}
          >
            {d.priority === 'high' && (
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
            )}

            <div className="flex items-center justify-between mb-3">
              <div className="flex flex-col">
                <span className="text-[11px] font-black text-neutral-200 group-hover:text-cyan-400 transition-colors">{d.id}</span>
                <span className="text-[9px] font-bold text-neutral-500 uppercase">{d.driverName}</span>
              </div>
              <StatusTag status={d.status} />
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 space-y-1">
                 <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-neutral-700" />
                    <span className="text-[10px] text-neutral-400 font-medium truncate">{d.dropoff.name}</span>
                 </div>
                 <div className="h-4 border-l border-neutral-800 ml-[2.5px]" />
                 <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span className="text-[10px] text-white font-bold truncate">ETA {d.estimatedArrival}</span>
                 </div>
              </div>
              <div className="flex flex-col items-center justify-center bg-neutral-800/50 rounded-lg p-2 min-w-[50px]">
                {d.vehicleType === 'bike' ? <Bike size={16} className="text-cyan-400" /> : <Truck size={16} className="text-cyan-400" />}
                <span className="text-[8px] font-black uppercase text-neutral-500 mt-1">{d.vehicleType}</span>
              </div>
            </div>

            <div className="w-full bg-neutral-900 h-1 rounded-full overflow-hidden">
               <div 
                className={`h-full transition-all duration-1000 ${d.status === 'DELAYED' ? 'bg-red-500' : 'bg-cyan-400'}`}
                style={{ width: `${d.progress * 100}%` }}
               />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
