
import React, { useState } from 'react';
import { Search, Filter, MoreVertical, Plane, Ship, MapPin, Clock } from 'lucide-react';
import { SHIPMENTS } from '../constants';
import { Shipment, ShipmentStatus } from '../types';

const StatusBadge: React.FC<{ status: ShipmentStatus }> = ({ status }) => {
  const colors = {
    'IN TRANSIT': 'text-cyan-400',
    'PENDING': 'text-neutral-500',
    'ARRIVED': 'text-green-500',
    'DELAYED': 'text-yellow-500'
  };
  return (
    <span className={`text-[9px] font-bold tracking-wider ${colors[status]}`}>
      {status}
    </span>
  );
};

export const TrackingList: React.FC<{ onSelect: (s: Shipment) => void }> = ({ onSelect }) => {
  const [search, setSearch] = useState('');

  const filteredShipments = SHIPMENTS.filter(s => 
    s.id.toLowerCase().includes(search.toLowerCase()) || 
    s.origin.name.toLowerCase().includes(search.toLowerCase()) ||
    s.destination.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-[320px] bg-[#0d0d0d] border-r border-neutral-900 flex flex-col h-full z-10">
      <div className="p-4 border-b border-neutral-900">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">Tracking list</h2>
          <div className="flex gap-2">
            <button className="p-1 hover:bg-neutral-800 rounded transition-colors">
              <Filter size={16} className="text-neutral-400" />
            </button>
            <button className="p-1 hover:bg-neutral-800 rounded transition-colors">
              <MoreVertical size={16} className="text-neutral-400" />
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" size={14} />
          <input 
            type="text" 
            placeholder="Order ID..." 
            className="w-full bg-[#141414] border border-neutral-800 rounded-lg py-2 pl-9 pr-4 text-xs text-neutral-300 focus:outline-none focus:border-neutral-700 transition-colors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredShipments.map((shipment) => (
          <div 
            key={shipment.id} 
            className="p-4 border-b border-neutral-900 hover:bg-neutral-900/40 cursor-pointer transition-colors group"
            onClick={() => onSelect(shipment)}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold tracking-tight text-neutral-200 group-hover:text-cyan-400 transition-colors">
                {shipment.id}
              </span>
              <StatusBadge status={shipment.status} />
            </div>

            <div className="flex items-center justify-between gap-1 mb-3">
              <div className="flex flex-col">
                <span className="text-[10px] text-neutral-600 font-bold uppercase">{shipment.origin.code}</span>
              </div>
              <div className="flex-1 flex items-center gap-2 px-2">
                <div className="h-[1px] flex-1 bg-neutral-800 relative">
                  <div className="absolute inset-y-0 left-0 bg-neutral-600" style={{ width: `${shipment.progress * 100}%` }}></div>
                </div>
                {shipment.type === 'air' ? (
                  <Plane size={14} className="text-neutral-600" />
                ) : (
                  <Ship size={14} className="text-neutral-600" />
                )}
                <div className="h-[1px] flex-1 bg-neutral-800"></div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-neutral-600 font-bold uppercase">{shipment.destination.code}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-neutral-400 leading-tight">{shipment.origin.name}</p>
                <p className="text-[9px] text-neutral-600 font-medium uppercase mt-0.5">{shipment.departureDate}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-neutral-400 leading-tight">{shipment.destination.name}</p>
                <p className="text-[9px] text-neutral-600 font-medium uppercase mt-0.5">{shipment.arrivalDate}</p>
              </div>
            </div>

            {shipment.duration && (
              <div className="mt-3 flex items-center justify-center">
                 <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-full px-2 py-0.5">
                   <Clock size={10} className="text-neutral-500" />
                   <span className="text-[9px] font-bold text-neutral-500 uppercase">{shipment.duration}</span>
                 </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
