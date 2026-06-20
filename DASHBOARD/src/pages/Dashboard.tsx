import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Mail, Bot, Play, CheckCircle2, XCircle, 
  Search, Trash2, Edit2, Send, Download, ExternalLink, X, BarChart3, KanbanSquare, LayoutList
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { CRMBoard } from '../components/CRMBoard';

export function DashboardOverview() {
  const [stats, setStats] = useState({ totalLeads: 0, premiumLeads: 0, totalEmails: 0, bouncedEmails: 0, enrichedEmails: 0 });
  const [runs, setRuns] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'board'>('table');

  // Scraper Trigger State
  const [triggering, setTriggering] = useState(false);
  const [triggerResult, setTriggerResult] = useState<{success: boolean, msg: string} | null>(null);

  // Leads State & Filters
  const [searchLeads, setSearchLeads] = useState('');
  const [filterQuality, setFilterQuality] = useState('all');
  const [filterCountry, setFilterCountry] = useState('all');
  const [filterSector, setFilterSector] = useState('all');
  const [filterEmail, setFilterEmail] = useState('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedLead, setSelectedLead] = useState<any | null>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  async function fetchAllData() {
    setLoading(true);
    
    // Scrapers
    const { data: runsData } = await supabase.from('scraper_runs').select('*').order('started_at', { ascending: false }).limit(5);
    setRuns(runsData || []);

    // Leads (increased limit)
    const { data: leadsData } = await supabase.from('companies').select('*').order('created_at', { ascending: false }).limit(5000);
    const leadsArr = leadsData || [];
    setLeads(leadsArr);

    // Emails (increased limit for A/B testing analytics)
    const { data: emailsData } = await supabase.from('email_tracking').select(`*, companies ( name, domain )`).order('sent_at', { ascending: false }).limit(5000);
    const emailsArr = emailsData || [];
    setEmails(emailsArr);

    // KPI Stats (Calculated directly from loaded data to ensure perfect matching with the UI tables)
    setStats({
      totalLeads: leadsArr.length,
      premiumLeads: leadsArr.filter(l => l.quality_score >= 3).length,
      totalEmails: emailsArr.length,
      bouncedEmails: emailsArr.filter(e => e.bounced === 1 || e.bounced === true).length,
      enrichedEmails: leadsArr.filter(l => !!l.email_1 || !!l.contact_email || !!l.email).length
    });

    setLoading(false);
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

  // --- LEAD ACTIONS ---
  async function handleBulkDeleteLeads() {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} leads?`)) return;
    const idsToDelete = Array.from(selectedIds);
    await supabase.from('companies').delete().in('id', idsToDelete);
    setLeads(leads.filter(l => !selectedIds.has(l.id)));
    setSelectedIds(new Set());
  }


  async function handleSaveLead(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLead) return;
    await supabase.from('companies').update({
      name: selectedLead.name, contact_name: selectedLead.contact_name, contact_email: selectedLead.contact_email, quality_score: selectedLead.quality_score
    }).eq('id', selectedLead.id);
    setLeads(leads.map(l => l.id === selectedLead.id ? selectedLead : l));
    setSelectedLead(null);
  }

  function handleExportCSV() {
    if (leads.length === 0) return;
    const headers = ['Company', 'Domain', 'Country', 'City', 'Region', 'Sector', 'Sub Sector', 'Contact Name', 'Contact Title', 'Contact Email 1', 'Contact Email 2', 'Phone', 'Employee Size', 'Revenue Range', 'Source', 'Active Tender', 'Quality Score'];
    const csvContent = [
      headers.join(','),
      ...leads.map(l => [
        `"${l.name || ''}"`, `"${l.domain || ''}"`, `"${l.country || ''}"`, `"${l.city || ''}"`, `"${l.region || ''}"`, 
        `"${l.sector || ''}"`, `"${l.sub_sector || ''}"`, `"${l.contact_name || ''}"`, `"${l.contact_title || ''}"`, 
        `"${l.contact_email || l.email_1 || l.email || ''}"`, `"${l.email_2 || ''}"`, `"${l.phone || ''}"`, 
        `"${l.employee_count || l.employee_size || ''}"`, `"${l.revenue_range || ''}"`, `"${l.source_method || l.source || ''}"`, 
        l.has_active_tender ? 'Yes' : 'No', l.quality_score
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CADLink_Leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const filteredLeads = leads.filter(l => {
    const matchesSearch = l.name?.toLowerCase().includes(searchLeads.toLowerCase()) || l.domain?.toLowerCase().includes(searchLeads.toLowerCase());
    const matchesQuality = filterQuality === 'all' ? true :
                           filterQuality === 'premium' ? l.quality_score >= 3 :
                           filterQuality === 'standard' ? l.quality_score < 3 : true;
    const matchesCountry = filterCountry === 'all' ? true : l.country === filterCountry;
    const matchesSector = filterSector === 'all' ? true : l.sector === filterSector;
    const matchesEmail = filterEmail === 'all' ? true :
                         filterEmail === 'with_email' ? !!(l.email_1 || l.contact_email || l.email) :
                         filterEmail === 'no_email' ? !(l.email_1 || l.contact_email || l.email) : true;
    return matchesSearch && matchesQuality && matchesCountry && matchesSector && matchesEmail;
  });

  // Extract unique countries and sectors for filter dropdowns
  const countries = Array.from(new Set(leads.map(l => l.country).filter(Boolean))).sort();
  const sectors = Array.from(new Set(leads.map(l => l.sector).filter(Boolean))).sort();

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
      
      {/* 1. KPI CARDS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-6">
        <StatCard title="Total Leads" value={stats.totalLeads} valueColor="text-blue-600" />
        <StatCard title="Premium Leads" value={stats.premiumLeads} valueColor="text-[#0F766E]" />
        <StatCard title="Enriched Emails" value={stats.enrichedEmails} valueColor="text-green-600" />
        <StatCard title="Emails Sent" value={stats.totalEmails} valueColor="text-indigo-600" />
        <StatCard title="Bounced Emails" value={stats.bouncedEmails} valueColor="text-red-600" />
      </div>

      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Quality vs Quantity Analytics</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard 
          title="Data Center Leads" 
          value={leads.filter(l => l.sector?.toLowerCase().includes('data center') || l.sub_sector?.toLowerCase().includes('data center') || (l.name && l.name.toLowerCase().includes('data center'))).length} 
          valueColor="text-emerald-600" 
        />
        <StatCard 
          title="Renewable Energy Leads" 
          value={leads.filter(l => l.sector?.toLowerCase().includes('renew') || l.sector?.toLowerCase().includes('solar') || l.sector?.toLowerCase().includes('wind') || (l.name && (l.name.toLowerCase().includes('solar') || l.name.toLowerCase().includes('wind')))).length} 
          valueColor="text-emerald-600" 
        />
        <StatCard 
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
        
        {/* 2. MAIN CRM TABLE OR BOARD (Full Width) */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-800">Lead Database</h2>
                <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{filteredLeads.length}</span>
              </div>
              
              <div className="flex bg-slate-100 rounded-lg p-1">
                <button 
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'table' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <LayoutList className="w-4 h-4" /> Table
                </button>
                <button 
                  onClick={() => setViewMode('board')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'board' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <KanbanSquare className="w-4 h-4" /> CRM Board
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" placeholder="Search leads..." value={searchLeads} onChange={e => setSearchLeads(e.target.value)}
                  className="bg-white border border-slate-300 rounded-md pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] w-48"
                />
              </div>
              
              <select value={filterQuality} onChange={e => setFilterQuality(e.target.value)} className="border border-slate-300 rounded-md px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-[#0F766E]">
                <option value="all">All Quality</option>
                <option value="premium">Premium (3+)</option>
                <option value="standard">Standard (&lt;3)</option>
              </select>

              <select value={filterCountry} onChange={e => setFilterCountry(e.target.value)} className="border border-slate-300 rounded-md px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-[#0F766E] max-w-[120px]">
                <option value="all">All Countries</option>
                {countries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select value={filterSector} onChange={e => setFilterSector(e.target.value)} className="border border-slate-300 rounded-md px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-[#0F766E] max-w-[120px]">
                <option value="all">All Sectors</option>
                {sectors.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              
              <select value={filterEmail} onChange={e => setFilterEmail(e.target.value)} className="border border-slate-300 rounded-md px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-[#0F766E]">
                <option value="all">All Emails</option>
                <option value="with_email">Has Email</option>
                <option value="no_email">No Email</option>
              </select>

              <button onClick={handleExportCSV} className="border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors">
                <Download className="w-4 h-4" /> Export
              </button>
              {selectedIds.size > 0 && viewMode === 'table' && (
                <button onClick={handleBulkDeleteLeads} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors">
                  <Trash2 className="w-4 h-4" /> Delete ({selectedIds.size})
                </button>
              )}
            </div>
          </div>

          {viewMode === 'board' ? (
            <div className="p-5">
              <CRMBoard leads={filteredLeads} setLeads={setLeads} />
            </div>
          ) : (
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                <tr className="text-slate-500 font-semibold tracking-wide text-xs uppercase">
                  <th className="p-3 pl-5 w-10">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.size === filteredLeads.length && filteredLeads.length > 0}
                      onChange={() => {
                        if (selectedIds.size === filteredLeads.length) setSelectedIds(new Set());
                        else setSelectedIds(new Set(filteredLeads.map(l => l.id)));
                      }}
                      className="rounded border-slate-300 text-[#0F766E] focus:ring-[#0F766E]"
                    />
                  </th>
                  <th className="p-3 whitespace-nowrap">Company & Domain</th>
                  <th className="p-3 whitespace-nowrap">Location</th>
                  <th className="p-3 whitespace-nowrap">Industry</th>
                  <th className="p-3 whitespace-nowrap">Contact Info</th>
                  <th className="p-3 whitespace-nowrap">Size / Revenue</th>
                  <th className="p-3 whitespace-nowrap">Source Info</th>
                  <th className="p-3 whitespace-nowrap text-center">Score</th>
                  <th className="p-3 text-right pr-5 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={9} className="p-8 text-center text-slate-500">Loading...</td></tr>
                ) : filteredLeads.map(lead => (
                  <tr key={lead.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.has(lead.id) ? 'bg-blue-50/50' : ''}`}>
                    <td className="p-3 pl-5">
                      <input 
                        type="checkbox" checked={selectedIds.has(lead.id)}
                        onChange={() => {
                          const newSet = new Set(selectedIds);
                          if (newSet.has(lead.id)) newSet.delete(lead.id); else newSet.add(lead.id);
                          setSelectedIds(newSet);
                        }}
                        className="rounded border-slate-300 text-[#0F766E] focus:ring-[#0F766E]"
                      />
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-800">{lead.name || '-'}</div>
                      {lead.domain && <a href={`https://${lead.domain}`} target="_blank" className="text-xs text-blue-600 hover:underline">{lead.domain}</a>}
                    </td>
                    <td className="p-3 text-sm text-slate-600">
                      <div>{lead.country || '-'}</div>
                      <div className="text-xs text-slate-400">{(lead.city || lead.region) ? [lead.city, lead.region].filter(Boolean).join(', ') : ''}</div>
                    </td>
                    <td className="p-3 text-sm text-slate-600">
                      <div>{lead.sector || '-'}</div>
                      {lead.sub_sector && <div className="text-xs text-slate-400">{lead.sub_sector}</div>}
                    </td>
                    <td className="p-3 text-sm">
                      <div className="font-medium text-slate-700">{lead.contact_name ? `${lead.contact_name} ${lead.contact_title ? `(${lead.contact_title})` : ''}` : 'No Name'}</div>
                      {(lead.contact_email || lead.email_1 || lead.email) ? (
                        <div className="flex flex-col gap-0.5 mt-1">
                          {[lead.contact_email, lead.email_1, lead.email, lead.email_2].filter(Boolean).map((em, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-600">
                              <Mail className="w-3 h-3 text-slate-400" /> {em}
                            </div>
                          ))}
                        </div>
                      ) : <span className="text-xs text-slate-400 italic">No email</span>}
                      {lead.phone && <div className="text-xs text-slate-500 mt-0.5">📞 {lead.phone}</div>}
                    </td>
                    <td className="p-3 text-sm text-slate-600">
                      <div>{lead.employee_count || lead.employee_size || '-'}</div>
                      <div className="text-xs text-slate-400">{lead.revenue_range || ''}</div>
                    </td>
                    <td className="p-3 text-sm text-slate-600">
                      <div className="capitalize">{lead.source_method || lead.source || '-'}</div>
                      {lead.has_active_tender ? <div className="text-xs text-emerald-600 font-bold mt-0.5">Active Tender</div> : null}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${lead.quality_score >= 3 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                        {lead.quality_score}
                      </span>
                    </td>
                    <td className="p-3 pr-5 text-right flex items-center justify-end gap-1">
                      <a href={`https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(lead.name)}`} target="_blank" className="p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100" title="Search LinkedIn">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      {(lead.contact_email || lead.email_1 || lead.email) && (
                        <a href={`mailto:${lead.contact_email || lead.email_1 || lead.email}`} className="p-1.5 text-slate-400 hover:text-[#0F766E] rounded hover:bg-slate-100" title="Email">
                          <Send className="w-4 h-4" />
                        </a>
                      )}
                      <button onClick={() => setSelectedLead(lead)} className="p-1.5 text-slate-400 hover:text-slate-800 rounded hover:bg-slate-100" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
        
        {/* Split Grid for Bottom Section: Outreach & Diagnostics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* 3. EMAILS TABLE */}
          <div className="glass-card rounded-2xl overflow-hidden">
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
          <div className="glass-card rounded-2xl p-6 flex flex-col">
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
          <div className="glass-card rounded-2xl p-6 flex flex-col">
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

      {/* Edit Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Edit Lead</h3>
              <button onClick={() => setSelectedLead(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveLead} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Company</label>
                <input type="text" value={selectedLead.name || ''} onChange={e => setSelectedLead({...selectedLead, name: e.target.value})} className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Email</label>
                <input type="text" value={selectedLead.contact_email || selectedLead.email_1 || ''} onChange={e => setSelectedLead({...selectedLead, contact_email: e.target.value})} className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none" />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setSelectedLead(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium bg-[#0F766E] text-white rounded hover:bg-[#0d635c] shadow-sm">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

function StatCard({ title, value, valueColor }: { title: string, value: number, valueColor: string }) {
  return (
    <div className="glass-panel rounded-xl p-6 shadow-sm flex flex-col justify-center">
      <div className="text-sm font-semibold text-slate-500 mb-1">{title}</div>
      <div className={`text-4xl font-black tracking-tight ${valueColor}`}>{value}</div>
    </div>
  );
}
