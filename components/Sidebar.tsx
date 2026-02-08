
import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  BarChart3, 
  Clock, 
  Zap, 
  Settings, 
  LogOut,
  Navigation2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  MapPin
} from 'lucide-react';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: string;
  isCollapsed?: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ 
  icon, label, active, badge, isCollapsed, onClick 
}) => {
  return (
    <div 
      onClick={onClick}
      className={`relative group flex items-center px-4 py-2.5 rounded-lg cursor-pointer transition-all duration-200 
        ${active ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]' : 'text-neutral-500 hover:text-neutral-200 hover:bg-neutral-900'}
        ${isCollapsed ? 'justify-center' : 'justify-between'}`}
    >
      <div className="flex items-center gap-3">
        <span className={`${active ? 'text-cyan-400' : 'text-neutral-500 group-hover:text-cyan-400'} transition-colors`}>
          {icon}
        </span>
        {!isCollapsed && <span className="text-sm font-semibold whitespace-nowrap overflow-hidden">{label}</span>}
      </div>
      
      {!isCollapsed && badge && (
        <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-md font-bold shrink-0">
          {badge}
        </span>
      )}

      {isCollapsed && (
        <div className="absolute left-full ml-4 px-2 py-1 bg-neutral-800 text-white text-[10px] font-black rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-[100] uppercase tracking-widest whitespace-nowrap border border-neutral-700">
          {label}
        </div>
      )}
    </div>
  );
};

interface SidebarProps {
  onViewChange: (view: string) => void;
  activeView: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  onViewChange, 
  activeView, 
  isCollapsed, 
  onToggleCollapse 
}) => {
  const [isLogoHovered, setIsLogoHovered] = useState(false);

  return (
    <aside className={`bg-[#080808] border-r border-neutral-900 flex flex-col h-full z-50 transition-all duration-300 ease-in-out relative ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="p-6 flex flex-col h-full">
        {/* Header Section */}
        <div className={`flex items-center mb-10 relative ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div 
            className="flex items-center gap-3 group relative cursor-pointer"
            onMouseEnter={() => setIsLogoHovered(true)}
            onMouseLeave={() => setIsLogoHovered(false)}
          >
            <div 
              className={`w-9 h-9 bg-cyan-400 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-all duration-300 
              ${isCollapsed && isLogoHovered ? 'scale-110 rotate-12' : ''}`}
            >
              <Navigation2 size={20} className="text-black fill-black" />
              {isCollapsed && (
                <div className={`absolute inset-0 bg-cyan-400/20 rounded-xl animate-ping ${isLogoHovered ? 'block' : 'hidden'}`} />
              )}
            </div>
            
            {!isCollapsed && (
              <div className="animate-in fade-in slide-in-from-left-2">
                <h1 className="text-sm font-black tracking-tighter text-white uppercase italic">HyperRoute</h1>
                <p className="text-[9px] font-bold tracking-[0.2em] text-cyan-500/60 uppercase">Command</p>
              </div>
            )}

            {/* Hover Trigger for Collapsed State */}
            {isCollapsed && isLogoHovered && (
              <button 
                onClick={onToggleCollapse}
                className="absolute left-12 bg-cyan-400 text-black p-1.5 rounded-lg shadow-xl animate-in zoom-in-50 duration-200 z-[100]"
              >
                <ChevronRight size={14} />
              </button>
            )}
          </div>

          {!isCollapsed && (
            <button 
              onClick={onToggleCollapse}
              className="w-7 h-7 bg-neutral-900 border border-neutral-800 rounded-lg flex items-center justify-center text-neutral-500 hover:text-cyan-400 transition-all shadow-lg hover:border-cyan-500/30"
            >
              <ChevronLeft size={14} />
            </button>
          )}
        </div>

        {/* Navigation Section */}
        <nav className="space-y-1.5 flex-1">
          <NavItem 
            icon={<LayoutDashboard size={18} />} 
            label="Ops Control" 
            active={activeView === 'ops'} 
            onClick={() => onViewChange('ops')}
            isCollapsed={isCollapsed}
          />
          <NavItem 
            icon={<Truck size={18} />} 
            label="Fleet Registry" 
            active={activeView === 'fleet'} 
            onClick={() => onViewChange('fleet')}
            isCollapsed={isCollapsed}
          />
          <NavItem 
            icon={<Users size={18} />} 
            label="Drivers" 
            badge="1 Live" 
            active={activeView === 'drivers'} 
            onClick={() => onViewChange('drivers')}
            isCollapsed={isCollapsed}
          />
          <NavItem 
            icon={<BarChart3 size={18} />} 
            label="Revenue" 
            active={activeView === 'revenue'} 
            onClick={() => onViewChange('revenue')}
            isCollapsed={isCollapsed}
          />
          <NavItem 
            icon={<MapPin size={18} />} 
            label="Geofencing" 
            active={activeView === 'geofencing'} 
            onClick={() => onViewChange('geofencing')}
            isCollapsed={isCollapsed}
          />
          <NavItem 
            icon={<Clock size={18} />} 
            label="SLA History" 
            active={activeView === 'sla'} 
            onClick={() => onViewChange('sla')}
            isCollapsed={isCollapsed}
          />
          
          <div className={`pt-6 pb-2 px-2 transition-opacity duration-200 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
            {!isCollapsed && <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Advanced</p>}
          </div>
          <NavItem 
            icon={<Zap size={18} className="text-amber-400" />} 
            label="AI Optimization" 
            active={activeView === 'ai'} 
            onClick={() => onViewChange('ai')}
            isCollapsed={isCollapsed}
          />
        </nav>

        {/* Action Button Section */}
        {!isCollapsed ? (
          <button className="w-full mt-8 bg-neutral-100 hover:bg-white text-black text-[11px] font-black py-3 rounded-xl transition-all shadow-xl uppercase tracking-tight">
            Dispatch Order
          </button>
        ) : (
          <button className="w-10 h-10 mt-8 mx-auto bg-cyan-400 text-black rounded-xl flex items-center justify-center hover:bg-white transition-all shadow-xl self-center">
            <Maximize2 size={16} />
          </button>
        )}

        {/* Footer Navigation */}
        <div className="mt-auto pt-6 border-t border-neutral-900/50">
          <NavItem 
            icon={<Settings size={18} />} 
            label="Settings" 
            onClick={() => {}} 
            isCollapsed={isCollapsed}
          />
          <NavItem 
            icon={<LogOut size={18} />} 
            label="Sign Out" 
            onClick={() => {}} 
            isCollapsed={isCollapsed}
          />
        </div>
      </div>
    </aside>
  );
};
