import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Building2, Mail, BarChart3, ArrowRight, Activity, Bot } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

export function DashboardOverview() {
  const [stats, setStats] = useState({ totalLeads: 0, premiumLeads: 0, totalEmails: 0 });
  const [recentRuns, setRecentRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { count: totalLeads } = await supabase.from('companies').select('*', { count: 'exact', head: true });
      const { count: premiumLeads } = await supabase.from('companies').select('*', { count: 'exact', head: true }).gte('quality_score', 3);
      const { count: totalEmails } = await supabase.from('email_tracking').select('*', { count: 'exact', head: true });
      
      const { data: runs } = await supabase.from('scraper_runs').select('*').order('started_at', { ascending: false }).limit(5);

      setStats({
        totalLeads: totalLeads || 0,
        premiumLeads: premiumLeads || 0,
        totalEmails: totalEmails || 0,
      });
      setRecentRuns(runs || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Command Center</h1>
        <p className="text-slate-400">Monitor your CAD LINK outreach pipeline and scraper health.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatCard icon={<Building2 className="text-[#2dd4bf]" />} title="Total Pipeline" value={loading ? '...' : stats.totalLeads} />
        <StatCard icon={<BarChart3 className="text-blue-400" />} title="Premium Leads" value={loading ? '...' : stats.premiumLeads} />
        <StatCard icon={<Mail className="text-purple-400" />} title="Emails Sent" value={loading ? '...' : stats.totalEmails} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Scraper Activity */}
        <div className="bg-[#0d1323]/60 border border-slate-800/60 rounded-2xl p-6 backdrop-blur-md">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-slate-400" />
              Recent Scraper Runs
            </h2>
            <Link to="/scrapers" className="text-sm text-[#2dd4bf] hover:text-[#1F7A62] flex items-center gap-1 font-medium transition-colors">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="space-y-4">
            {loading ? (
              <div className="text-slate-500 text-sm">Loading activity...</div>
            ) : recentRuns.length === 0 ? (
              <div className="text-slate-500 text-sm">No scraper runs recorded.</div>
            ) : (
              recentRuns.map((run) => (
                <div key={run.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                  <div>
                    <p className="font-medium text-slate-200">{run.scraper_name}</p>
                    <p className="text-xs text-slate-500">{formatDistanceToNow(new Date(run.started_at))} ago</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-400">+{run.new_leads_added} leads</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 uppercase tracking-wider">{run.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions Placeholder */}
        <div className="bg-[#1F7A62]/10 border border-[#1F7A62]/20 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1F7A62]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <h2 className="text-lg font-semibold mb-2 relative z-10 text-white">Need more leads?</h2>
          <p className="text-sm text-slate-400 mb-6 relative z-10">The automated scrapers run twice a day. You can also manually trigger them to hunt for new EPC companies right now.</p>
          <Link to="/scrapers" className="inline-flex items-center gap-2 bg-[#1F7A62] hover:bg-[#165a48] text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all relative z-10 shadow-lg shadow-[#1F7A62]/20">
            <Bot className="w-4 h-4" />
            Manage Scrapers
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value }: { icon: React.ReactNode, title: string, value: string | number }) {
  return (
    <div className="bg-[#0d1323]/60 border border-slate-800/60 p-6 rounded-2xl flex items-center gap-4 hover:border-slate-700 transition-colors">
      <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 shadow-inner">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-400">{title}</p>
        <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
      </div>
    </div>
  );
}
