
import React from 'react';
import { 
  LayoutDashboard, 
  MapPin, 
  MessageSquare, 
  CreditCard, 
  History, 
  Zap, 
  Settings, 
  HelpCircle, 
  LogOut,
  ChevronDown
} from 'lucide-react';

const NavItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; badge?: string; children?: React.ReactNode }> = ({ 
  icon, label, active, badge, children 
}) => {
  return (
    <div>
      <div className={`flex items-center justify-between px-4 py-2.5 rounded-lg cursor-pointer transition-colors ${active ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'}`}>
        <div className="flex items-center gap-3">
          {icon}
          <span className="text-sm font-medium">{label}</span>
        </div>
        {badge && (
          <span className="text-[10px] bg-neutral-700 text-neutral-300 px-1.5 py-0.5 rounded-md">
            {badge}
          </span>
        )}
        {children && <ChevronDown size={14} className="ml-2" />}
      </div>
    </div>
  );
};

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-[#0a0a0a] border-r border-neutral-900 flex flex-col h-full z-20">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-cyan-400 rounded-md flex items-center justify-center">
            <Zap size={18} className="text-black" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white">SMART</h1>
            <h2 className="text-[10px] font-semibold tracking-widest text-neutral-500 -mt-1 uppercase">Logistics</h2>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-neutral-900/50 p-3 rounded-xl mb-8 border border-neutral-800">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold">W</div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-semibold truncate text-neutral-200">Walmart, Inc.</p>
          </div>
          <ChevronDown size={14} className="text-neutral-500" />
        </div>

        <nav className="space-y-1">
          <NavItem icon={<LayoutDashboard size={18} />} label="Overview" />
          <NavItem icon={<MapPin size={18} />} label="Tracking" active />
          <div className="ml-6 space-y-1 mt-1 border-l border-neutral-800 pl-4 mb-4">
            <p className="text-[11px] text-neutral-300 py-1 bg-neutral-800/50 rounded px-2">My orders <span className="float-right text-neutral-500">23</span></p>
            <p className="text-[11px] text-neutral-500 hover:text-neutral-300 py-1 px-2 cursor-pointer transition-colors">Active routes</p>
            <p className="text-[11px] text-neutral-500 hover:text-neutral-300 py-1 px-2 cursor-pointer transition-colors">Popular routes</p>
            <p className="text-[11px] text-neutral-500 hover:text-neutral-300 py-1 px-2 cursor-pointer transition-colors">Danger zones</p>
            <p className="text-[11px] text-neutral-500 hover:text-neutral-300 py-1 px-2 cursor-pointer transition-colors">Weather forecast</p>
          </div>
          <NavItem icon={<MessageSquare size={18} />} label="Messages" />
          <NavItem icon={<CreditCard size={18} />} label="Payments" />
          <NavItem icon={<History size={18} />} label="History" />
          <NavItem icon={<Zap size={18} className="text-cyan-400" />} label="Smart routes" />
        </nav>

        <button className="w-full mt-6 bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-bold py-3 rounded-lg transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)]">
          New order
        </button>
      </div>

      <div className="mt-auto p-6 space-y-2">
        <NavItem icon={<Settings size={18} />} label="Settings" />
        <NavItem icon={<HelpCircle size={18} />} label="Support" />
        <NavItem icon={<LogOut size={18} />} label="Logout" />
      </div>
    </aside>
  );
};
