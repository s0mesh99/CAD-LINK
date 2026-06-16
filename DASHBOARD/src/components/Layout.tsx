import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Mail, Bot, LogOut } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { icon: LayoutDashboard, label: 'Overview', path: '/' },
  { icon: Users, label: 'Lead CRM', path: '/leads' },
  { icon: Mail, label: 'Campaigns', path: '/campaigns' },
  { icon: Bot, label: 'Scrapers', path: '/scrapers' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-slate-200 flex overflow-hidden font-sans selection:bg-[#1F7A62]/30">
      {/* Background Mesh */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-[#1F7A62]/10 rounded-full blur-[150px] pointer-events-none" />
      
      {/* Sidebar */}
      <aside className="w-64 bg-[#0d1323]/80 backdrop-blur-xl border-r border-slate-800 flex flex-col z-20">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1F7A62] to-[#0f3d31] flex items-center justify-center shadow-lg shadow-[#1F7A62]/20">
              <span className="font-bold text-white tracking-tighter">CL</span>
            </div>
            <span className="font-semibold text-lg tracking-tight text-white">CAD LINK</span>
          </div>
        </div>

        <div className="flex-1 px-4 py-6 flex flex-col gap-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">Menu</div>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-[#1F7A62]/10 text-[#2dd4bf]" 
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-[#2dd4bf]" : "text-slate-500")} />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-800">
          <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors w-full">
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        <div className="h-16 flex items-center justify-between px-8 border-b border-slate-800/50 bg-[#0d1323]/50 backdrop-blur-md sticky top-0 z-20">
          <div className="text-sm text-slate-400 font-medium capitalize">
            {location.pathname === '/' ? 'Overview' : location.pathname.substring(1)}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-slate-400 font-medium">System Online</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
              <span className="text-xs font-bold text-slate-300">SN</span>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}
