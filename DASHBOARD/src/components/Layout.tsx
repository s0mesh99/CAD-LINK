import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Database, Users, LogOut, Settings, Mail, Send, Server, LayoutTemplate } from 'lucide-react';
import { motion } from 'motion/react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type TabType = 'dashboard' | 'crm' | 'inbox' | 'leads' | 'scrapers' | 'templates';

export function Layout({ 
  children, 
  currentTab = 'dashboard', 
  setCurrentTab,
  onLogout
}: { 
  children: React.ReactNode,
  currentTab?: TabType,
  setCurrentTab?: (tab: TabType) => void,
  onLogout?: () => void
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-cadlink-600/20">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 py-3 md:h-16 flex flex-col md:flex-row items-start md:items-center justify-between px-4 md:px-6 sticky top-0 z-50 shadow-sm gap-3 md:gap-8">
        
        {/* Logo and Mobile Logout Row */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="text-xl md:text-2xl font-display font-extrabold tracking-tight">
              <span className="text-slate-900">CAD</span>
              <span className="text-cadlink-600">Link</span>
            </div>
            <div className="px-2 py-0.5 bg-cadlink-50 border border-cadlink-200 text-cadlink-700 text-[9px] md:text-[10px] font-bold rounded-full uppercase tracking-wider ml-1 whitespace-nowrap">
              ADMIN V1.4
            </div>
          </div>

          <div className="md:hidden">
            {onLogout && (
              <button 
                onClick={onLogout}
                className="flex items-center justify-center p-2 rounded-lg text-slate-600 bg-white border border-slate-200 shadow-sm"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs (Scrollable on Mobile) */}
        {setCurrentTab && (
          <div className="w-full md:w-auto overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
            <nav className="flex items-center gap-2 min-w-max">
              <button 
                onClick={() => setCurrentTab('dashboard')}
                className={cn(
                  "flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm font-bold transition-all",
                  currentTab === 'dashboard' ? "bg-white text-cadlink-700 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                )}
              >
                <Database className="w-4 h-4" />
                Dashboard
              </button>
              <button 
                onClick={() => setCurrentTab('crm')}
                className={cn(
                  "flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm font-bold transition-all",
                  currentTab === 'crm' ? "bg-white text-cadlink-700 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                )}
              >
                <Users className="w-4 h-4" />
                CRM
              </button>
              <button 
                onClick={() => setCurrentTab('inbox')}
                className={cn(
                  "flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm font-bold transition-all",
                  currentTab === 'inbox' ? "bg-white text-cadlink-700 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                )}
              >
                <Send className="w-4 h-4" />
                Daily Dispatched
              </button>
              <button 
                onClick={() => setCurrentTab('leads')}
                className={cn(
                  "flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm font-bold transition-all",
                  currentTab === 'leads' ? "bg-white text-cadlink-700 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                )}
              >
                <Users className="w-4 h-4" />
                Inbound
              </button>
              <button 
                onClick={() => setCurrentTab('scrapers')}
                className={cn(
                  "flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm font-bold transition-all",
                  currentTab === 'scrapers' ? "bg-white text-cadlink-700 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                )}
              >
                <Server className="w-4 h-4" />
                Automations
              </button>
              <button 
                onClick={() => setCurrentTab('templates')}
                className={cn(
                  "flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm font-bold transition-all",
                  currentTab === 'templates' ? "bg-white text-cadlink-700 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                )}
              >
                <LayoutTemplate className="w-4 h-4" />
                Templates
              </button>
            </nav>
          </div>
        )}

        {/* Desktop Logout Row */}
        <div className="hidden md:block">
          {onLogout && (
            <button 
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 md:p-8 max-w-[1600px] mx-auto pb-24">
        <motion.div
          key={currentTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
