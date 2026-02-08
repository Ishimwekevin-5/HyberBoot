
import React from 'react';
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  BarChart3, 
  Clock, 
  Zap, 
  Settings, 
  HelpCircle, 
  LogOut,
  ChevronDown,
  Navigation2
} from 'lucide-react';

const NavItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; badge?: string }> = ({ 
  icon, label, active, badge 
}) => {
  return (
    <div className={`flex items-center justify-between px-4 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ${active ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-neutral-500 hover:text-neutral-200 hover:bg-neutral-900'}`}>
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm font-semibold">{label}</span>
      </div>
      {badge && (
        <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-md font-bold">
          {badge}
        </span>
      )}
    </div>
  );
};

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-[#080808] border-r border-neutral-900 flex flex-col h-full z-20">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 bg-cyan-400 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.4)]">
            <Navigation2 size={20} className="text-black fill-black" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tighter text-white uppercase italic">HyperRoute</h1>
            <p className="text-[9px] font-bold tracking-[0.2em] text-cyan-500/60 uppercase">Fleet Command</p>
          </div>
        </div>

        <nav className="space-y-1.5">
          <NavItem icon={<LayoutDashboard size={18} />} label="Ops Control" active />
          <NavItem icon={<Truck size={18} />} label="Fleet Registry" />
          <NavItem icon={<Users size={18} />} label="Drivers" badge="4 Live" />
          <NavItem icon={<BarChart3 size={18} />} label="Revenue" />
          <NavItem icon={<Clock size={18} />} label="SLA History" />
          
          <div className="pt-6 pb-2 px-2">
            <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Advanced</p>
          </div>
          <NavItem icon={<Zap size={18} className="text-amber-400" />} label="AI Optimization" />
        </nav>

        <button className="w-full mt-8 bg-neutral-100 hover:bg-white text-black text-[11px] font-black py-3 rounded-xl transition-all shadow-xl uppercase tracking-tight">
          Dispatch Order
        </button>
      </div>

      <div className="mt-auto p-6 border-t border-neutral-900/50">
        <NavItem icon={<Settings size={18} />} label="Settings" />
        <NavItem icon={<LogOut size={18} />} label="Sign Out" />
      </div>
    </aside>
  );
};
