import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { 
  CheckCircle2, XCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { formatDistanceToNow, isToday, parseISO } from 'date-fns';

export function DashboardOverview({ setCurrentTab }: { setCurrentTab?: (tab: any) => void }) {
  const [stats, setStats] = useState({ 
    totalLeads: 0, premiumLeads: 0, totalEmails: 0, bouncedEmails: 0, enrichedEmails: 0,
    pendingLeads: 0, successfullyEnriched: 0, failedEnrichment: 0, aiRejected: 0
  });
  const [leads, setLeads] = useState<any[]>([]);
  const [emails, setEmails] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);



  useEffect(() => {
    fetchAllData().finally(() => setLoading(false));
  }, []);

  async function fetchAllData() {
    // Scraper runs no longer needed on dashboard

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

    // Emails (Bypass Supabase 1000-row API limit using pagination)
    let emailsArr: any[] = [];
    let eFrom = 0;
    const eStep = 1000;
    while(true) {
      const { data: emailsData } = await supabase.from('email_tracking').select(`*, companies ( name, domain )`).order('sent_at', { ascending: false }).range(eFrom, eFrom + eStep - 1);
      if (!emailsData || emailsData.length === 0) break;
      emailsArr = [...emailsArr, ...emailsData];
      if (emailsData.length < eStep) break;
      eFrom += eStep;
    }
    setEmails(emailsArr);

    // KPI Stats (Calculated directly from loaded data to ensure perfect matching with the UI tables)
    // KPI Stats (Calculated directly from loaded data to ensure perfect matching with the UI tables)
    setStats({
      totalLeads: allLeads.length,
      premiumLeads: allLeads.filter(l => l.quality_score >= 3).length,
      totalEmails: emailsArr.length,
      bouncedEmails: emailsArr.filter(e => e.bounced === 1 || e.bounced === true).length,
      enrichedEmails: allLeads.filter(l => !!l.email_1 || !!l.contact_email || !!l.email).length,
      // Phase 5 Pipeline Metrics
      pendingLeads: allLeads.filter(l => !l.status || l.status.toLowerCase() === 'new lead').length,
      successfullyEnriched: allLeads.filter(l => l.status?.toLowerCase() === 'enriched').length,
      failedEnrichment: allLeads.filter(l => l.status?.toLowerCase() === 'failed').length,
      aiRejected: allLeads.filter(l => l.status?.toLowerCase() === 'rejected').length,
    });
  }

  // --- DEPRECATED SCRAPER ACTIONS REMOVED IN V1.5 ---

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

  const sentTodayEmails = useMemo(() => {
    return emails.filter(e => {
      if (!e.sent_at) return false;
      try {
        return isToday(parseISO(e.sent_at));
      } catch (err) {
        return false;
      }
    });
  }, [emails]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      
      {/* V1.5 Daily Progress Bar */}
      <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-slate-800">Daily Automation Goal</h2>
          <span className="text-sm font-semibold text-[#0F766E] bg-teal-50 px-3 py-1 rounded-full">
            {stats.successfullyEnriched} / 20 Leads
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 mb-2 overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (stats.successfullyEnriched / 20) * 100)}%` }}
            transition={{ duration: 1, delay: 0.2 }}
            className="bg-gradient-to-r from-teal-400 to-[#0F766E] h-3 rounded-full"
          ></motion.div>
        </div>
        <p className="text-xs text-slate-500 font-medium">Deep AI Enrichment & Email Outreach daily quota (resets at 8:00 AM UTC)</p>
      </div>

      {/* V1.5 Pipeline Metrics (Primary) */}
      <div>
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">AI Enrichment Pipeline</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <MetricCard title="Awaiting Deep AI" value={loading ? '...' : stats.pendingLeads} valueColor="text-slate-700" subtitle="Queued for tomorrow's run" tooltip="Click to view pending leads in CRM" onClick={() => { if(setCurrentTab) { window.location.hash = '#filterEnrichment=new lead'; setCurrentTab('crm'); } }} />
          <MetricCard title="Successfully Enriched" value={loading ? '...' : stats.successfullyEnriched} valueColor="text-[#0F766E]" subtitle="Ready for Email Blaster" tooltip="Click to view enriched leads in CRM" onClick={() => { if(setCurrentTab) { window.location.hash = '#filterEnrichment=enriched'; setCurrentTab('crm'); } }} />
          <MetricCard title="Rejected by AI" value={loading ? '...' : stats.aiRejected} valueColor="text-amber-600" subtitle="Not an outsourcing target" tooltip="Click to view rejected leads in CRM" onClick={() => { if(setCurrentTab) { window.location.hash = '#filterEnrichment=rejected'; setCurrentTab('crm'); } }} />
          <MetricCard title="AI Failure Rate" value={loading ? '...' : stats.totalLeads > 0 ? `${((stats.failedEnrichment / stats.totalLeads)*100).toFixed(1)}%` : '0%'} valueColor="text-red-500" subtitle={`${stats.failedEnrichment} dead websites`} tooltip="Click to view failed leads in CRM" onClick={() => { if(setCurrentTab) { window.location.hash = '#filterEnrichment=failed'; setCurrentTab('crm'); } }} />
          <MetricCard title="Total Dispatched" value={loading ? '...' : stats.totalEmails} valueColor="text-indigo-600" subtitle="Cold emails successfully sent" tooltip="The total amount of emails successfully delivered by the Campaign Blaster." />
        </div>
      </div>

      {/* V1.5 Global Metrics (Secondary) */}
      <div>
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Global CRM Database</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <MetricCard title="Total Leads" value={loading ? '...' : stats.totalLeads} valueColor="text-slate-800" />
          <MetricCard title="Premium Leads" value={loading ? '...' : stats.premiumLeads} valueColor="text-emerald-600" tooltip="Quality score >= 3" />
          <MetricCard title="Data Centers" value={leads.filter(l => (l.sector || '').toLowerCase().includes('data center') || (l.sub_sector || '').toLowerCase().includes('data center')).length} valueColor="text-slate-700" />
          <MetricCard title="Renewable Energy" value={leads.filter(l => (l.sector || '').toLowerCase().includes('renew') || (l.sector || '').toLowerCase().includes('solar') || (l.sector || '').toLowerCase().includes('wind')).length} valueColor="text-slate-700" />
          <MetricCard title="Oil & Gas" value={leads.filter(l => (l.sector || '').toLowerCase().includes('oil') || (l.sector || '').toLowerCase().includes('gas')).length} valueColor="text-slate-700" />
        </div>
      </div>

      {/* V1.7 Sent Today Activity */}
      <div>
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Send className="w-4 h-4 text-cadlink-500" /> 
          Sent Today (AI Blaster Activity)
          <span className="bg-cadlink-100 text-cadlink-700 py-0.5 px-2 rounded-full text-xs ml-2">{sentTodayEmails.length} Leads</span>
        </h3>
        
        {sentTodayEmails.length > 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-200 uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-4">Company</th>
                    <th className="px-6 py-4">Recipient</th>
                    <th className="px-6 py-4">Template</th>
                    <th className="px-6 py-4">Sent Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sentTodayEmails.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-800">
                        {e.companies?.name || 'Unknown'}
                        {e.companies?.domain && <div className="text-xs text-slate-400 font-normal mt-0.5">{e.companies.domain}</div>}
                      </td>
                      <td className="px-6 py-4">
                        {e.recipient_name && <div className="font-medium text-slate-700">{e.recipient_name}</div>}
                        <div className="text-slate-500">{e.recipient_email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap">
                          {e.template_name || 'Standard Outreach'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                        {e.sent_at ? new Date(e.sent_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Unknown'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="bg-slate-50 p-4 rounded-full mb-4 border border-slate-100">
              <Send className="w-8 h-8 text-slate-300" />
            </div>
            <h4 className="text-slate-700 font-semibold mb-1">No emails sent yet today</h4>
            <p className="text-slate-500 text-sm max-w-sm">The Campaign Blaster hasn't run today, or no eligible leads were found. Run the engine to start outreach.</p>
          </div>
        )}
      </div>

      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 mt-12">A/B Testing & Email Performance</h3>
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
        
        {/* Bottom Section: Outreach Table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">Recent Outreach Activity</h2>
            <div className="text-xs text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-full">Showing last 1000 emails</div>
          </div>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                <tr className="text-slate-500 font-semibold tracking-wide">
                  <th className="p-3 pl-5">Company / Recipient</th>
                  <th className="p-3">Sent At</th>
                  <th className="p-3 text-right pr-5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {emails.map(email => (
                  <tr key={email.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 pl-5 font-medium text-slate-700">{email.companies?.name || email.recipient_email}</td>
                    <td className="p-3 text-slate-500">{formatDistanceToNow(new Date(email.sent_at))} ago</td>
                    <td className="p-3 pr-5 text-right">
                      {email.bounced === 1 ? (
                        <span className="inline-flex text-red-600 font-medium items-center gap-1.5 bg-red-50 px-2 py-1 rounded-md"><XCircle className="w-4 h-4"/> Bounced</span>
                      ) : (
                        <span className="inline-flex text-emerald-600 font-medium items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded-md"><CheckCircle2 className="w-4 h-4"/> Delivered</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}

// --- Modern Metric Card Component (V1.5) ---
function MetricCard({ title, value, valueColor, tooltip, subtitle, onClick }: { title: string, value: number | string, valueColor: string, tooltip?: string, subtitle?: string, onClick?: () => void }) {
  return (
    <motion.div 
      onClick={onClick}
      whileHover={onClick ? { y: -2, scale: 1.02 } : { y: -2, scale: 1.01 }}
      className={`bg-white/90 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all relative group flex flex-col justify-between overflow-hidden ${onClick ? 'cursor-pointer hover:border-[#0F766E]/50' : 'cursor-default'}`}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/0 to-slate-100/50 rounded-bl-full pointer-events-none transition-all group-hover:scale-110"></div>
      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 z-10 flex justify-between items-start">
        {title}
        {onClick && <span className="text-[#0F766E] opacity-0 group-hover:opacity-100 transition-opacity">↗</span>}
      </div>
      <div className={`text-4xl font-black tracking-tight z-10 ${valueColor}`}>
        {value === '...' ? (
          <div className="h-10 w-24 bg-slate-100 animate-pulse rounded-lg"></div>
        ) : value}
      </div>
      {subtitle && <div className="text-xs text-slate-400 font-medium mt-2 z-10">{subtitle}</div>}
      
      {tooltip && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full w-56 bg-slate-800 text-white text-xs p-3 rounded-xl shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all z-50 text-center">
          {tooltip}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-slate-800"></div>
        </div>
      )}
    </motion.div>
  );
}
