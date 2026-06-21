import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Bot, Play, CheckCircle2, XCircle, 
  BarChart3, Info
} from 'lucide-react';
import { motion } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';

export function DashboardOverview() {
  const [stats, setStats] = useState({ totalLeads: 0, premiumLeads: 0, totalEmails: 0, bouncedEmails: 0, enrichedEmails: 0 });
  const [runs, setRuns] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [emails, setEmails] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  // Scraper Trigger State
  const [triggering, setTriggering] = useState(false);
  const [triggerResult, setTriggerResult] = useState<{success: boolean, msg: string} | null>(null);

  useEffect(() => {
    fetchAllData().finally(() => setLoading(false));
  }, []);

  async function fetchAllData() {
    // Scrapers
    const { data: runsData } = await supabase.from('scraper_runs').select('*').order('started_at', { ascending: false }).limit(5);
    setRuns(runsData || []);

    // Leads (Bypass Supabase 1000-row API limit using pagination)
    let allLeads: any[] = [];
    let from = 0;
    const step = 1000;
    while(true) {
      const { data } = await supabase.from('companies').select('*').order('created_at', { ascending: false }).range(from, from + step - 1);
      if (!data || data.length === 0) break;
      allLeads = [...allLeads, ...data];
      if (data.length < step) break; // Reached the end
      from += step;
    }
    setLeads(allLeads);

    // Emails (Download a chunk for A/B testing analytics)
    const { data: emailsData } = await supabase.from('email_tracking').select(`*, companies ( name, domain )`).order('sent_at', { ascending: false }).limit(2000);
    const emailsArr = emailsData || [];
    setEmails(emailsArr);

    // KPI Stats (Calculated directly from loaded data to ensure perfect matching with the UI tables)
    setStats({
      totalLeads: allLeads.length,
      premiumLeads: allLeads.filter(l => l.quality_score >= 3).length,
      totalEmails: emailsArr.length,
      bouncedEmails: emailsArr.filter(e => e.bounced === 1 || e.bounced === true).length,
      enrichedEmails: allLeads.filter(l => !!l.email_1 || !!l.contact_email || !!l.email).length
    });
  }

  // --- SCRAPER ACTIONS ---
  async function triggerGitHubAction() {
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
        headers: { 'Accept': 'application/vnd.github.v3+json', 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref: 'main' })
      });
      if (response.ok) {
        setTriggerResult({ success: true, msg: 'Scraper triggered successfully!' });
      } else {
        const err = await response.json();
        setTriggerResult({ success: false, msg: err.message || 'Failed to trigger scraper.' });
      }
    } catch (e: any) {
      setTriggerResult({ success: false, msg: e.message });
    }
    setTriggering(false);
  }

  const scraperStats = useMemo(() => {
    const stats: Record<string, { name: string; count: number; totalScore: number }> = {};
    leads.forEach(l => {
      const source = l.source_method || l.source || 'unknown';
      if (!stats[source]) {
        stats[source] = { name: source, count: 0, totalScore: 0 };
      }
      stats[source].count += 1;
      stats[source].totalScore += (l.quality_score || 0);
    });
    
    return Object.values(stats)
      .map(s => ({
        ...s,
        avgScore: s.count > 0 ? (s.totalScore / s.count).toFixed(1) : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [leads]);

  const abTestStats = useMemo(() => {
    const stats: Record<string, { name: string; sends: number; opens: number; replies: number }> = {};
    emails.forEach(e => {
      const tName = e.template_name || 'Unknown Template';
      if (!stats[tName]) {
        stats[tName] = { name: tName, sends: 0, opens: 0, replies: 0 };
      }
      stats[tName].sends += 1;
      if (e.open_count > 0) stats[tName].opens += 1;
      if (e.replied === 1) stats[tName].replies += 1;
    });
    return Object.values(stats)
      .map(s => ({
        ...s,
        openRate: s.sends > 0 ? ((s.opens / s.sends) * 100).toFixed(1) : '0.0',
        replyRate: s.sends > 0 ? ((s.replies / s.sends) * 100).toFixed(1) : '0.0',
      }))
      .sort((a, b) => b.sends - a.sends);
  }, [emails]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* KPI Tabs (Compact) */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <StatTab title="Total Leads" value={loading ? '...' : stats.totalLeads} valueColor="text-slate-800" tooltip="Total number of companies scraped." />
        <StatTab title="Premium Leads" value={loading ? '...' : stats.premiumLeads} valueColor="text-[#0F766E]" tooltip="Leads with a Quality Score of 3 or higher." />
        <StatTab title="Emails Verified" value={loading ? '...' : stats.enrichedEmails} valueColor="text-emerald-600" tooltip="Leads that have a valid email address." />
        <StatTab title="Emails Sent" value={loading ? '...' : stats.totalEmails} valueColor="text-indigo-600" tooltip="Total number of outreach emails sent." />
        <StatTab title="Bounced" value={loading ? '...' : stats.bouncedEmails} valueColor="text-red-500" tooltip="Emails that bounced or were rejected." />
      </div>

      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Quality vs Quantity Analytics</h3>
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <StatTab 
          title="Data Center Leads" 
          value={leads.filter(l => l.sector?.toLowerCase().includes('data center') || l.sub_sector?.toLowerCase().includes('data center') || (l.name && l.name.toLowerCase().includes('data center'))).length} 
          valueColor="text-emerald-600" 
        />
        <StatTab 
          title="Renewable Energy Leads" 
          value={leads.filter(l => l.sector?.toLowerCase().includes('renew') || l.sector?.toLowerCase().includes('solar') || l.sector?.toLowerCase().includes('wind') || (l.name && (l.name.toLowerCase().includes('solar') || l.name.toLowerCase().includes('wind')))).length} 
          valueColor="text-emerald-600" 
        />
        <StatTab 
          title="Oil & Gas Leads" 
          value={leads.filter(l => l.sector?.toLowerCase().includes('oil') || l.sector?.toLowerCase().includes('gas') || (l.name && l.name.toLowerCase().includes('oil'))).length} 
          valueColor="text-slate-600" 
        />
      </div>

      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">A/B Testing & Email Performance</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {abTestStats.length > 0 ? abTestStats.map(stat => (
          <div key={stat.name} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-2 h-full bg-indigo-500/20 group-hover:bg-indigo-500/40 transition-colors"></div>
            <h4 className="text-slate-800 font-bold mb-3 truncate pr-4" title={stat.name}>{stat.name}</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Sends</span>
                <span className="text-lg font-semibold text-slate-700">{stat.sends}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Open Rate</span>
                <span className="text-lg font-semibold text-blue-600">{stat.openRate}%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Reply Rate</span>
                <span className="text-lg font-semibold text-emerald-600">{stat.replyRate}%</span>
              </div>
            </div>
          </div>
        )) : (
          <div className="col-span-full p-6 text-center text-slate-500 bg-white border border-dashed border-slate-300 rounded-xl">
            No email tracking data yet. Send an email campaign to see A/B testing analytics!
          </div>
        )}
      </div>

      <div className="space-y-8">
        
        {/* Split Grid for Bottom Section: Outreach & Diagnostics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* 3. EMAILS TABLE */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Recent Outreach</h2>
            </div>
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                  <tr className="text-slate-500 font-semibold tracking-wide">
                    <th className="p-3 pl-5">Company</th>
                    <th className="p-3">Sent At</th>
                    <th className="p-3 text-right pr-5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {emails.map(email => (
                    <tr key={email.id} className="hover:bg-slate-50">
                      <td className="p-3 pl-5 font-medium text-slate-700">{email.companies?.name || email.recipient_email}</td>
                      <td className="p-3 text-slate-500">{formatDistanceToNow(new Date(email.sent_at))} ago</td>
                      <td className="p-3 pr-5 text-right">
                        {email.bounced === 1 ? (
                          <span className="inline-flex text-red-600 font-medium items-center gap-1"><XCircle className="w-4 h-4"/> Bounced</span>
                        ) : (
                          <span className="inline-flex text-emerald-600 font-medium items-center gap-1"><CheckCircle2 className="w-4 h-4"/> Delivered</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. SCRAPER ANALYTICS */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#0F766E]" /> Source Quality
              </h2>
            </div>
            <div className="space-y-3 flex-grow overflow-y-auto max-h-[300px]">
              {scraperStats.length === 0 ? (
                 <div className="text-slate-400 text-sm italic">No data yet</div>
              ) : scraperStats.map(stat => (
                <div key={stat.name} className="p-3 rounded-lg border border-slate-100 bg-slate-50 flex justify-between items-center">
                  <div>
                    <div className="text-sm font-semibold text-slate-700 capitalize">{stat.name.replace(/_/g, ' ')}</div>
                    <div className="text-xs text-slate-500">{stat.count} leads found</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${Number(stat.avgScore) >= 5 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {stat.avgScore} <span className="text-xs font-normal text-slate-400">/ 10</span>
                    </div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">AVG SCORE</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. SCRAPER DIAGNOSTICS (Moved to Bottom Right) */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Bot className="w-5 h-5 text-[#0F766E]" /> Automation
              </h2>
            </div>
            
            <button onClick={triggerGitHubAction} disabled={triggering} className="w-full mb-6 bg-[#0F766E] hover:bg-[#0d635c] text-white disabled:opacity-50 py-2.5 rounded-lg font-medium flex justify-center items-center gap-2 transition-colors shadow-md">
              <Play className="w-4 h-4" /> {triggering ? 'Triggering...' : 'Force Run Cloud Scrapers'}
            </button>

            {triggerResult && (
              <div className={`mb-6 p-3 rounded-md text-sm border ${triggerResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                {triggerResult.msg}
              </div>
            )}

            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Recent Runs</h3>
            <div className="space-y-3 flex-grow overflow-y-auto max-h-[300px]">
              {runs.map(run => (
                <div key={run.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50 flex justify-between items-center">
                  <div>
                    <div className="text-sm font-semibold text-slate-700">{run.scraper_name}</div>
                    <div className="text-xs text-slate-500">{formatDistanceToNow(new Date(run.started_at))} ago</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-[#0F766E]">+{run.new_leads_added}</div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">{run.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

// --- Compact Stat Tab Component ---
function StatTab({ title, value, valueColor, tooltip }: { title: string, value: number | string, valueColor: string, tooltip?: string }) {
  return (
    <motion.div 
      whileHover={{ y: -1 }}
      className="bg-white border border-slate-200 rounded-lg px-4 py-2 shadow-sm flex items-center gap-3 relative group cursor-default"
    >
      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</div>
      <div className={`text-lg font-bold ${valueColor}`}>
        {value === '...' ? (
          <div className="h-5 w-10 bg-slate-100 animate-pulse rounded"></div>
        ) : value}
      </div>
      {tooltip && (
        <div className="absolute top-10 left-0 w-56 bg-slate-800 text-white text-xs p-3 rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all z-50">
          {tooltip}
        </div>
      )}
    </motion.div>
  );
}
