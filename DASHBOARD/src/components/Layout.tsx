import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f4f5f7] text-slate-800 font-sans selection:bg-[#0F766E]/20">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold tracking-tight">
            <span className="text-slate-900">CAD</span>
            <span className="text-[#0F766E]">Link</span>
          </div>
          <div className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase tracking-wider ml-1">
            ADMIN
          </div>
        </div>

        <div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-8 max-w-[1600px] mx-auto pb-24">
        {children}
      </main>
    </div>
  );
}
