import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Search, Filter, Mail, Edit2, Trash2, X, AlertTriangle, Send } from 'lucide-react';

export function LeadsCRM() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Filtering state
  const [filterQuality, setFilterQuality] = useState('all');
  const [filterEmail, setFilterEmail] = useState('all');
  const [filterCountry, setFilterCountry] = useState('all');
  const [filterSector, setFilterSector] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
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
      .limit(500); // Increased limit since we have advanced filtering

    setLeads(data || []);
    setLoading(false);
  }

  // --- Handlers ---
  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this lead?")) return;
    await supabase.from('companies').delete().eq('id', id);
    setLeads(leads.filter(l => l.id !== id));
    if (selectedIds.has(id)) {
      const newSet = new Set(selectedIds);
      newSet.delete(id);
      setSelectedIds(newSet);
    }
  }

  async function handleBulkDelete() {
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

    await supabase
      .from('companies')
      .update({
        name: selectedLead.name,
        contact_name: selectedLead.contact_name,
        contact_email: selectedLead.contact_email,
        phone: selectedLead.phone,
        country: selectedLead.country,
        sector: selectedLead.sector,
        quality_score: selectedLead.quality_score
      })
      .eq('id', selectedLead.id);

    setLeads(leads.map(l => l.id === selectedLead.id ? selectedLead : l));
    setSelectedLead(null);
  }

  function toggleSelectAll(filteredData: any[]) {
    if (selectedIds.size === filteredData.length && filteredData.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredData.map(l => l.id)));
    }
  }

  function toggleSelectRow(id: string) {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  }

  // --- Derived Data for Filters ---
  const uniqueCountries = Array.from(new Set(leads.map(l => l.country).filter(Boolean))).sort();
  const uniqueSectors = Array.from(new Set(leads.map(l => l.sector).filter(Boolean))).sort();

  // --- Apply Filters ---
  const filteredLeads = leads.filter(l => {
    // 1. Text Search
    const matchesSearch = 
      l.name?.toLowerCase().includes(search.toLowerCase()) || 
      l.domain?.toLowerCase().includes(search.toLowerCase());
    
    // 2. Quality
    let matchesQuality = true;
    if (filterQuality === 'premium') matchesQuality = l.quality_score >= 3;
    if (filterQuality === 'basic') matchesQuality = l.quality_score < 3;

    // 3. Email
    let matchesEmail = true;
    if (filterEmail === 'has_email') matchesEmail = !!l.contact_email || !!l.email_1;
    if (filterEmail === 'no_email') matchesEmail = !l.contact_email && !l.email_1;

    // 4. Country & Sector
    const matchesCountry = filterCountry === 'all' || l.country === filterCountry;
    const matchesSector = filterSector === 'all' || l.sector === filterSector;

    return matchesSearch && matchesQuality && matchesEmail && matchesCountry && matchesSector;
  });

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Lead CRM</h1>
          <p className="text-slate-400">Manage, filter, and organize your scraped targets.</p>
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
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`border px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${showFilters ? 'bg-[#1F7A62] border-[#1F7A62] text-white' : 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'}`}
          >
            <Filter className="w-4 h-4" /> Filters
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-[#0d1323]/80 border border-slate-700/60 p-5 rounded-xl mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-top-4 duration-300 shadow-xl backdrop-blur-md">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Quality Score</label>
            <select value={filterQuality} onChange={e => setFilterQuality(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-[#1F7A62]">
              <option value="all">All Scores</option>
              <option value="premium">Premium Only (3+)</option>
              <option value="basic">Needs Enrichment (&lt; 3)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Email Contact</label>
            <select value={filterEmail} onChange={e => setFilterEmail(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-[#1F7A62]">
              <option value="all">All Leads</option>
              <option value="has_email">Has Email</option>
              <option value="no_email">Missing Email</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Country</label>
            <select value={filterCountry} onChange={e => setFilterCountry(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-[#1F7A62]">
              <option value="all">All Countries</option>
              {uniqueCountries.map(c => <option key={c as string} value={c as string}>{c as string}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Sector</label>
            <select value={filterSector} onChange={e => setFilterSector(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-[#1F7A62]">
              <option value="all">All Sectors</option>
              {uniqueSectors.map(s => <option key={s as string} value={s as string}>{s as string}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-indigo-500/10 border border-indigo-500/30 p-3 rounded-xl mb-6 flex items-center justify-between animate-in fade-in duration-300">
          <span className="text-sm font-medium text-indigo-400 px-2">{selectedIds.size} leads selected</span>
          <button onClick={handleBulkDelete} className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-lg shadow-red-500/20">
            <Trash2 className="w-4 h-4" /> Bulk Delete
          </button>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-[#0d1323]/60 border border-slate-800/60 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/40 text-xs uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-800/60">
                <th className="p-4 pl-6 w-10">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.size === filteredLeads.length && filteredLeads.length > 0}
                    onChange={() => toggleSelectAll(filteredLeads)}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-[#1F7A62] focus:ring-[#1F7A62]"
                  />
                </th>
                <th className="p-4">Company</th>
                <th className="p-4">Location/Sector</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Score</th>
                <th className="p-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr><td colSpan={6} className="p-12 text-center text-slate-500">Loading CRM data...</td></tr>
              ) : filteredLeads.length === 0 ? (
                <tr><td colSpan={6} className="p-12 text-center text-slate-500">No leads match your filters.</td></tr>
              ) : (
                filteredLeads.map((lead) => {
                  const isSelected = selectedIds.has(lead.id);
                  return (
                    <tr key={lead.id} className={`hover:bg-slate-800/30 transition-colors ${isSelected ? 'bg-indigo-500/5' : ''}`}>
                      <td className="p-4 pl-6">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => toggleSelectRow(lead.id)}
                          className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-[#1F7A62] focus:ring-[#1F7A62]"
                        />
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-slate-200">{lead.name}</div>
                        {lead.domain && <a href={`https://${lead.domain}`} target="_blank" rel="noreferrer" className="text-xs text-slate-500 hover:text-[#2dd4bf] mt-0.5 inline-block">{lead.domain}</a>}
                      </td>
                      <td className="p-4 text-sm text-slate-400">
                        <div>{lead.country || '--'}</div>
                        <div className="text-xs text-slate-500">{lead.sector || '--'}</div>
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
                          <span className="text-xs font-medium text-amber-500/80 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Missing Contact</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1" title="Quality Score">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < (lead.quality_score / 2) ? 'bg-[#1F7A62]' : 'bg-slate-700'}`} />
                          ))}
                        </div>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        {/* Always visible action buttons */}
                        <div className="flex items-center justify-end gap-1">
                          {lead.contact_email && (
                            <a href={`mailto:${lead.contact_email}`} className="p-1.5 text-slate-400 hover:text-[#2dd4bf] hover:bg-[#2dd4bf]/10 rounded-md transition-colors" title="Send Email">
                              <Send className="w-4 h-4" />
                            </a>
                          )}
                          <button onClick={() => setSelectedLead(lead)} className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-md transition-colors" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(lead.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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
                  <label className="block text-xs font-medium text-slate-400 mb-1">Country</label>
                  <input type="text" value={selectedLead.country || ''} onChange={e => setSelectedLead({...selectedLead, country: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#1F7A62] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Sector</label>
                  <input type="text" value={selectedLead.sector || ''} onChange={e => setSelectedLead({...selectedLead, sector: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#1F7A62] outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Contact Name</label>
                  <input type="text" value={selectedLead.contact_name || ''} onChange={e => setSelectedLead({...selectedLead, contact_name: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#1F7A62] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Quality (0-10)</label>
                  <input type="number" min="0" max="10" value={selectedLead.quality_score || 0} onChange={e => setSelectedLead({...selectedLead, quality_score: parseInt(e.target.value)})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#1F7A62] outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Contact Email</label>
                <input type="email" value={selectedLead.contact_email || ''} onChange={e => setSelectedLead({...selectedLead, contact_email: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#1F7A62] outline-none" />
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
