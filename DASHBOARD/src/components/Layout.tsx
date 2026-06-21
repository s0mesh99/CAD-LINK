import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Database, Users, LogOut, Settings, Mail } from 'lucide-react';
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
      <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-display font-extrabold tracking-tight">
              <span className="text-slate-900">CAD</span>
              <span className="text-cadlink-600">Link</span>
            </div>
            <div className="px-2 py-0.5 bg-cadlink-50 border border-cadlink-200 text-cadlink-700 text-[10px] font-bold rounded-full uppercase tracking-wider ml-1">
              ADMIN V1.4
            </div>
          </div>

          {setCurrentTab && (
            <nav className="hidden md:flex items-center gap-2">
              <button 
                onClick={() => setCurrentTab('dashboard')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                  currentTab === 'dashboard' ? "bg-white text-cadlink-700 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                )}
              >
                <Database className="w-4 h-4" />
                Dashboard
              </button>
              <button 
                onClick={() => setCurrentTab('crm')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                  currentTab === 'crm' ? "bg-white text-cadlink-700 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                )}
              >
                <Users className="w-4 h-4" />
                CRM (Outbound)
              </button>
              <button 
                onClick={() => setCurrentTab('inbox')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                  currentTab === 'inbox' ? "bg-white text-cadlink-700 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                )}
              >
                <Mail className="w-4 h-4" />
                AI Inbox
              </button>
              <button 
                onClick={() => setCurrentTab('leads')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                  currentTab === 'leads' ? "bg-white text-cadlink-700 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                )}
              >
                <Users className="w-4 h-4" />
                Inbound Leads
              </button>
              <button 
                onClick={() => setCurrentTab('scrapers')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                  currentTab === 'scrapers' ? "bg-white text-cadlink-700 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                )}
              >
                <Settings className="w-4 h-4" />
                Scrapers
              </button>
              <button 
                onClick={() => setCurrentTab('templates')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                  currentTab === 'templates' ? "bg-white text-cadlink-700 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                )}
              >
                <Mail className="w-4 h-4" />
                Templates
              </button>
            </nav>
          )}
        </div>

        <div>
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
      <main className="p-8 max-w-[1600px] mx-auto pb-24">
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
