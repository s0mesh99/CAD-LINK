import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Search, Filter, Mail, Edit2, Trash2, X } from 'lucide-react';

export function LeadsCRM() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [selectedLead, setSelectedLead] = useState<any | null>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    setLoading(true);
    const { data } = await supabase
      .from('companies')
      .select('*')
      .order('quality_score', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(200); // For performance, limit to 200 in UI

    setLeads(data || []);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this lead?")) return;
    await supabase.from('companies').delete().eq('id', id);
    setLeads(leads.filter(l => l.id !== id));
  }

  async function handleSaveLead(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLead) return;

    await supabase
      .from('companies')
      .update({
        name: selectedLead.name,
        contact_name: selectedLead.contact_name,
        contact_email: selectedLead.contact_email,
        phone: selectedLead.phone,
        quality_score: selectedLead.quality_score
      })
      .eq('id', selectedLead.id);

    // Update local state
    setLeads(leads.map(l => l.id === selectedLead.id ? selectedLead : l));
    setSelectedLead(null); // close modal
  }

  const filteredLeads = leads.filter(l => 
    l.name?.toLowerCase().includes(search.toLowerCase()) || 
    l.domain?.toLowerCase().includes(search.toLowerCase()) ||
    l.country?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Lead CRM</h1>
          <p className="text-slate-400">Manage, edit, and organize your scraped targets.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search leads..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#0d1323] border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#1F7A62] focus:ring-1 focus:ring-[#1F7A62] transition-all w-full md:w-64 text-white"
            />
          </div>
          <button className="bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
            <Filter className="w-4 h-4" /> Filters
          </button>
        </div>
      </div>

      <div className="bg-[#0d1323]/60 border border-slate-800/60 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/40 text-xs uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-800/60">
                <th className="p-4 pl-6">Company</th>
                <th className="p-4">Contact Person</th>
                <th className="p-4">Signals</th>
                <th className="p-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr><td colSpan={4} className="p-12 text-center text-slate-500">Loading CRM data...</td></tr>
              ) : filteredLeads.length === 0 ? (
                <tr><td colSpan={4} className="p-12 text-center text-slate-500">No leads match your search.</td></tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-800/20 transition-colors group">
                    <td className="p-4 pl-6">
                      <div className="font-medium text-slate-200">{lead.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                        {lead.domain && <a href={`https://${lead.domain}`} target="_blank" rel="noreferrer" className="hover:text-[#2dd4bf]">{lead.domain}</a>}
                        {lead.country && <span>• {lead.country}</span>}
                      </div>
                    </td>
                    <td className="p-4">
                      {lead.contact_name ? (
                        <div>
                          <div className="text-sm text-slate-300 font-medium">{lead.contact_name}</div>
                          {lead.contact_email && (
                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3" /> {lead.contact_email}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-600 italic">Unknown Contact</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {/* Quality Score Indicator */}
                        <div className="flex items-center gap-1" title="Quality Score">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < (lead.quality_score / 2) ? 'bg-[#1F7A62]' : 'bg-slate-800'}`} />
                          ))}
                        </div>
                        {/* Tags */}
                        {lead.has_active_tender === 1 && (
                          <span className="text-[10px] px-2 py-0.5 rounded border border-amber-500/20 bg-amber-500/10 text-amber-400">Tender</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {lead.contact_email && (
                          <a href={`mailto:${lead.contact_email}`} className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-md transition-colors" title="Send Email">
                            <Mail className="w-4 h-4" />
                          </a>
                        )}
                        <button onClick={() => setSelectedLead(lead)} className="p-1.5 text-slate-400 hover:text-[#2dd4bf] hover:bg-slate-800 rounded-md transition-colors" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(lead.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors" title="Delete">
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

      {/* Edit Lead Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0d1323] border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-white">Edit Lead</h3>
              <button onClick={() => setSelectedLead(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveLead} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Company Name</label>
                <input type="text" value={selectedLead.name || ''} onChange={e => setSelectedLead({...selectedLead, name: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#1F7A62] outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Contact Name</label>
                  <input type="text" value={selectedLead.contact_name || ''} onChange={e => setSelectedLead({...selectedLead, contact_name: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#1F7A62] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Quality Score (0-10)</label>
                  <input type="number" min="0" max="10" value={selectedLead.quality_score || 0} onChange={e => setSelectedLead({...selectedLead, quality_score: parseInt(e.target.value)})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#1F7A62] outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Contact Email</label>
                <input type="email" value={selectedLead.contact_email || ''} onChange={e => setSelectedLead({...selectedLead, contact_email: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#1F7A62] outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Phone</label>
                <input type="text" value={selectedLead.phone || ''} onChange={e => setSelectedLead({...selectedLead, phone: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#1F7A62] outline-none" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setSelectedLead(null)} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#1F7A62] hover:bg-[#165a48] text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-[#1F7A62]/20">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
