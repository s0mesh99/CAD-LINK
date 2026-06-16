import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Mail, CheckCircle2, XCircle, Search, Filter, Trash2, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function Campaigns() {
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Filtering State
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPhase, setFilterPhase] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchEmails();
  }, []);

  async function fetchEmails() {
    setLoading(true);
    const { data } = await supabase
      .from('email_tracking')
      .select(`
        *,
        companies ( name, domain )
      `)
      .order('sent_at', { ascending: false })
      .limit(200);

    setEmails(data || []);
    setLoading(false);
  }

  // --- Actions ---
  async function handleDeleteLog(id: string) {
    if (!window.confirm("Are you sure you want to delete this email tracking log?")) return;
    await supabase.from('email_tracking').delete().eq('id', id);
    setEmails(emails.filter(e => e.id !== id));
  }

  async function handleMarkBounced(id: string) {
    if (!window.confirm("Mark this email as bounced?")) return;
    await supabase.from('email_tracking').update({ bounced: 1 }).eq('id', id);
    setEmails(emails.map(e => e.id === id ? { ...e, bounced: 1 } : e));
  }

  // --- Filtering Logic ---
  const filteredEmails = emails.filter(e => {
    const matchesSearch = 
      e.recipient_email?.toLowerCase().includes(search.toLowerCase()) || 
      e.companies?.name?.toLowerCase().includes(search.toLowerCase());
    
    let matchesStatus = true;
    if (filterStatus === 'delivered') matchesStatus = e.bounced === 0;
    if (filterStatus === 'bounced') matchesStatus = e.bounced === 1;

    let matchesPhase = true;
    if (filterPhase !== 'all') matchesPhase = e.campaign_phase === parseInt(filterPhase);

    return matchesSearch && matchesStatus && matchesPhase;
  });

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Campaign Tracking</h1>
          <p className="text-slate-400">Monitor automated cold email dispatches and follow-ups.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search email or company..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#0d1323] border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all w-full md:w-64 text-white"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`border px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${showFilters ? 'bg-purple-500 border-purple-500 text-white' : 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'}`}
          >
            <Filter className="w-4 h-4" /> Filters
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-[#0d1323]/80 border border-slate-700/60 p-5 rounded-xl mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-4 duration-300 shadow-xl backdrop-blur-md">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Email Status</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-purple-500">
              <option value="all">All Statuses</option>
              <option value="delivered">Delivered Successfully</option>
              <option value="bounced">Bounced (Invalid)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Campaign Phase</label>
            <select value={filterPhase} onChange={e => setFilterPhase(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-purple-500">
              <option value="all">All Phases</option>
              <option value="1">Phase 1 (Initial Pitch)</option>
              <option value="2">Phase 2 (Follow-up)</option>
            </select>
          </div>
        </div>
      )}

      <div className="bg-[#0d1323]/60 border border-slate-800/60 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/40 text-xs uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-800/60">
                <th className="p-4 pl-6">Company</th>
                <th className="p-4">Recipient</th>
                <th className="p-4">Phase</th>
                <th className="p-4">Sent At</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr><td colSpan={6} className="p-12 text-center text-slate-500">Loading campaign data...</td></tr>
              ) : filteredEmails.length === 0 ? (
                <tr><td colSpan={6} className="p-12 text-center text-slate-500">No emails match your filters.</td></tr>
              ) : (
                filteredEmails.map((email) => (
                  <tr key={email.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="font-medium text-slate-200">{email.companies?.name || 'Unknown'}</div>
                      <div className="text-xs text-slate-500">{email.companies?.domain}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-500" />
                        <span className="text-sm text-slate-300">{email.recipient_email}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-medium px-2 py-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        Phase {email.campaign_phase || 1}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-400">
                      {formatDistanceToNow(new Date(email.sent_at))} ago
                    </td>
                    <td className="p-4">
                      {email.bounced === 1 ? (
                        <div className="inline-flex items-center gap-1 text-red-400 text-xs font-medium bg-red-500/10 px-2 py-1 rounded border border-red-500/20">
                          <XCircle className="w-3.5 h-3.5" /> Bounced
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 text-emerald-400 text-xs font-medium bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
                        </div>
                      )}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      {/* Action buttons are permanently visible */}
                      <div className="flex items-center justify-end gap-1">
                        <a href={`mailto:${email.recipient_email}?subject=Follow Up`} className="p-1.5 text-slate-400 hover:text-purple-400 hover:bg-purple-400/10 rounded-md transition-colors" title="Send Direct Follow-up">
                          <Send className="w-4 h-4" />
                        </a>
                        {email.bounced === 0 && (
                          <button onClick={() => handleMarkBounced(email.id)} className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-md transition-colors" title="Mark as Bounced">
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => handleDeleteLog(email.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors" title="Delete Log">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
