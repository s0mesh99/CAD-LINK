import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Bot, Play, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function ScraperDiagnostics() {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [triggerResult, setTriggerResult] = useState<{success: boolean, msg: string} | null>(null);

  useEffect(() => {
    fetchRuns();
  }, []);

  async function fetchRuns() {
    const { data } = await supabase
      .from('scraper_runs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(50);
    setRuns(data || []);
    setLoading(false);
  }

  async function triggerGitHubAction() {
    // This requires a GitHub Personal Access Token in the env to trigger a workflow_dispatch
    const token = import.meta.env.VITE_GITHUB_TOKEN;
    if (!token) {
      setTriggerResult({ success: false, msg: 'VITE_GITHUB_TOKEN is missing in your .env file.' });
      return;
    }

    setTriggering(true);
    setTriggerResult(null);

    try {
      const response = await fetch('https://api.github.com/repos/s0mesh99/CAD-LINK/actions/workflows/scraper.yml/dispatches', {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ref: 'main' })
      });

      if (response.ok) {
        setTriggerResult({ success: true, msg: 'Scraper triggered successfully! It is now running in the cloud.' });
        // Refresh runs after a delay
        setTimeout(fetchRuns, 5000);
      } else {
        const err = await response.json();
        setTriggerResult({ success: false, msg: err.message || 'Failed to trigger scraper.' });
      }
    } catch (e: any) {
      setTriggerResult({ success: false, msg: e.message });
    }
    setTriggering(false);
  }

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Scraper Diagnostics</h1>
          <p className="text-slate-400">Monitor system health and manually trigger cloud scrapers.</p>
        </div>
        
        <button 
          onClick={triggerGitHubAction}
          disabled={triggering}
          className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white px-5 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
        >
          {triggering ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {triggering ? 'Triggering...' : 'Force Run Cloud Scrapers'}
        </button>
      </div>

      {triggerResult && (
        <div className={`mb-8 p-4 rounded-lg flex items-center gap-3 border ${triggerResult.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          {triggerResult.success ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p className="text-sm font-medium">{triggerResult.msg}</p>
        </div>
      )}

      <div className="bg-[#0d1323]/60 border border-slate-800/60 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/40 text-xs uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-800/60">
                <th className="p-4 pl-6">Scraper Module</th>
                <th className="p-4">Status</th>
                <th className="p-4">Leads Found</th>
                <th className="p-4">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr><td colSpan={4} className="p-12 text-center text-slate-500">Loading diagnostics...</td></tr>
              ) : runs.length === 0 ? (
                <tr><td colSpan={4} className="p-12 text-center text-slate-500">No scraper runs found.</td></tr>
              ) : (
                runs.map((run) => (
                  <tr key={run.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-800 rounded-lg">
                          <Bot className="w-4 h-4 text-slate-400" />
                        </div>
                        <span className="font-medium text-slate-200">{run.scraper_name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {run.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20" title={run.error_message}>
                          <XCircle className="w-3.5 h-3.5" /> Failed
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-slate-300">
                        <span className="font-semibold text-emerald-400">+{run.new_leads_added}</span> new 
                        <span className="text-slate-500 text-xs ml-2">({run.records_found} scanned)</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-400">
                      {formatDistanceToNow(new Date(run.started_at))} ago
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
