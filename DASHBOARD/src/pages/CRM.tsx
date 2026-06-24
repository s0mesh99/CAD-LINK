import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { Search, Download, Trash2, ExternalLink, Send, Mail, LayoutList, KanbanSquare, ChevronLeft, ChevronRight, Building2, MapPin, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CRMBoard } from '../components/CRMBoard';

export function CRMDatabase() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'board'>('table');
  
  // Filters
  const [searchLeads, setSearchLeads] = useState('');
  const [filterQuality, setFilterQuality] = useState('all');
  const [filterCountry, setFilterCountry] = useState('all');
  const [filterSector, setFilterSector] = useState('all');
  const [filterEmail, setFilterEmail] = useState('all');
  
  // Phase 4 Filters
  const [filterEnrichment, setFilterEnrichment] = useState('all');
  const [filterTier, setFilterTier] = useState('all');
  const [filterRating, setFilterRating] = useState('all');
  
  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50;

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    setLoading(true);
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
    setLoading(false);
  }

  const countries = useMemo(() => Array.from(new Set(leads.map(l => l.country).filter(Boolean))).sort(), [leads]);
  const sectors = useMemo(() => Array.from(new Set(leads.map(l => l.sector).filter(Boolean))).sort(), [leads]);
  const tiers = useMemo(() => Array.from(new Set(leads.map(l => l.sub_sector).filter(Boolean))).sort(), [leads]);

  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      const matchSearch = !searchLeads || (l.name?.toLowerCase().includes(searchLeads.toLowerCase()) || l.domain?.toLowerCase().includes(searchLeads.toLowerCase()));
      const matchQuality = filterQuality === 'all' || (filterQuality === 'premium' ? l.quality_score >= 3 : l.quality_score < 3);
      const matchCountry = filterCountry === 'all' || l.country === filterCountry;
      const matchSector = filterSector === 'all' || l.sector === filterSector;
      const matchEmail = filterEmail === 'all' || (filterEmail === 'with_email' ? (l.email_1 || l.contact_email || l.email) : (!l.email_1 && !l.contact_email && !l.email));
      
      const leadStatus = (l.status || 'New Lead').toLowerCase();
      const matchEnrichment = filterEnrichment === 'all' || leadStatus === filterEnrichment.toLowerCase();
      const matchTier = filterTier === 'all' || l.sub_sector === filterTier;
      const matchRating = filterRating === 'all' || l.quality_score === parseInt(filterRating);

      return matchSearch && matchQuality && matchCountry && matchSector && matchEmail && matchEnrichment && matchTier && matchRating;
    });
  }, [leads, searchLeads, filterQuality, filterCountry, filterSector, filterEmail, filterEnrichment, filterTier, filterRating]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredLeads.length / rowsPerPage);
  const currentLeads = useMemo(() => {
    if (viewMode === 'board') return filteredLeads; // Kanban board handles all leads at once
    const startIdx = (currentPage - 1) * rowsPerPage;
    return filteredLeads.slice(startIdx, startIdx + rowsPerPage);
  }, [filteredLeads, currentPage, viewMode]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchLeads, filterQuality, filterCountry, filterSector, filterEmail, filterEnrichment, filterTier, filterRating]);

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Name,Domain,Email,Country,Sector,Quality Score\n"
      + filteredLeads.map(e => `${e.name || ''},${e.domain || ''},${e.contact_email || e.email_1 || e.email || ''},${e.country || ''},${e.sector || ''},${e.quality_score || 0}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "cadlink_outbound_leads.csv");
    document.body.appendChild(link);
    link.click();
  };

  const handleBulkDeleteLeads = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} leads?`)) return;
    const ids = Array.from(selectedIds);
    await supabase.from('companies').delete().in('id', ids);
    setLeads(leads.filter(l => !selectedIds.has(l.id)));
    setSelectedIds(new Set());
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Outbound CRM</h1>
          <p className="text-slate-500 mt-1">Manage your {leads.length} scraped prospects and pipeline.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-800">Lead Database</h2>
              <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{filteredLeads.length} matches</span>
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
              <option value="with_email">Has Mail</option>
              <option value="no_email">No Mail</option>
            </select>

            {/* Advanced Filters */}
            <select value={filterEnrichment} onChange={e => setFilterEnrichment(e.target.value)} className="border border-slate-300 rounded-md px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-[#0F766E]">
              <option value="all">Any Enrichment</option>
              <option value="new lead">Pending</option>
              <option value="enriched">Enriched</option>
              <option value="failed">Failed</option>
            </select>

            <select value={filterTier} onChange={e => setFilterTier(e.target.value)} className="border border-slate-300 rounded-md px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-[#0F766E]">
              <option value="all">All Tiers</option>
              {tiers.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <select value={filterRating} onChange={e => setFilterRating(e.target.value)} className="border border-slate-300 rounded-md px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-[#0F766E]">
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
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
          <div>
            <div className="overflow-x-auto overflow-y-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20 shadow-sm">
                  <tr className="text-slate-500 font-bold tracking-wider text-xs uppercase">
                    <th className="p-4 pl-6 w-10">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.size === currentLeads.length && currentLeads.length > 0}
                        onChange={() => {
                          if (selectedIds.size === currentLeads.length) setSelectedIds(new Set());
                          else setSelectedIds(new Set(currentLeads.map((l: any) => l.id)));
                        }}
                        className="rounded border-slate-300 text-[#0F766E] focus:ring-[#0F766E]"
                      />
                    </th>
                    <th className="p-4 whitespace-nowrap">Company & Domain</th>
                    <th className="p-4 whitespace-nowrap">Location</th>
                    <th className="p-4 whitespace-nowrap">Industry</th>
                    <th className="p-4 whitespace-nowrap">Contact Info</th>
                    <th className="p-4 whitespace-nowrap">Size / Revenue</th>
                    <th className="p-4 whitespace-nowrap">Source Info</th>
                    <th className="p-4 whitespace-nowrap text-center">Score</th>
                    <th className="p-4 text-right pr-6 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <AnimatePresence>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, idx) => (
                        <motion.tr key={`skel-${idx}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="animate-pulse">
                          <td className="p-4 pl-6"><div className="w-4 h-4 bg-slate-200 rounded"></div></td>
                          <td className="p-4"><div className="w-32 h-4 bg-slate-200 rounded mb-2"></div><div className="w-24 h-3 bg-slate-100 rounded"></div></td>
                          <td className="p-4"><div className="w-20 h-4 bg-slate-200 rounded"></div></td>
                          <td className="p-4"><div className="w-24 h-4 bg-slate-200 rounded mb-2"></div><div className="w-16 h-3 bg-slate-100 rounded"></div></td>
                          <td className="p-4"><div className="w-32 h-4 bg-slate-200 rounded mb-2"></div><div className="w-28 h-3 bg-slate-100 rounded"></div></td>
                          <td colSpan={4} className="p-4"></td>
                        </motion.tr>
                      ))
                    ) : currentLeads.map((lead: any, idx: number) => (
                      <motion.tr 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: idx * 0.02 }}
                        key={lead.id} 
                        className={`hover:bg-slate-50 transition-colors group ${selectedIds.has(lead.id) ? 'bg-blue-50/40' : ''}`}
                      >
                        <td className="p-4 pl-6">
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
                        <td className="p-4">
                          <div className="font-bold text-slate-800 flex items-center gap-2 group-hover:text-[#0F766E] transition-colors">
                            {lead.name || '-'}
                          </div>
                          {lead.domain && <a href={`https://${lead.domain}`} target="_blank" className="text-xs font-medium text-slate-400 hover:text-blue-600 hover:underline transition-colors mt-0.5 inline-block">{lead.domain}</a>}
                        </td>
                        <td className="p-4 text-sm text-slate-600">
                          <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400"/> {lead.country || '-'}</div>
                          <div className="text-xs text-slate-400 mt-1 pl-5">{(lead.city || lead.region) ? [lead.city, lead.region].filter(Boolean).join(', ') : ''}</div>
                        </td>
                        <td className="p-4 text-sm text-slate-600">
                          <div className="flex items-center gap-1.5 font-medium"><Building2 className="w-3.5 h-3.5 text-slate-400"/> {lead.sector || '-'}</div>
                          {lead.sub_sector && <div className="text-xs text-slate-400 mt-1 pl-5">{lead.sub_sector}</div>}
                        </td>
                        <td className="p-4 text-sm">
                          <div className="font-bold text-slate-700">{lead.contact_name ? `${lead.contact_name} ${lead.contact_title ? `(${lead.contact_title})` : ''}` : 'No Name'}</div>
                          {(lead.contact_email || lead.email_1 || lead.email) ? (
                            <div className="flex flex-col gap-1 mt-1.5">
                              {[lead.contact_email, lead.email_1, lead.email, lead.email_2].filter(Boolean).map((em, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100/80 px-2 py-0.5 rounded border border-slate-200/50 w-fit">
                                  <Mail className="w-3 h-3 text-slate-400" /> {em}
                                </div>
                              ))}
                            </div>
                          ) : <span className="text-xs font-medium text-amber-600/70 bg-amber-50 px-2 py-0.5 rounded border border-amber-100/50 inline-block mt-1">No email found</span>}
                          {lead.phone && <div className="text-xs font-medium text-slate-600 mt-1.5 flex items-center gap-1.5"><span className="text-slate-400">📞</span> {lead.phone}</div>}
                        </td>
                        <td className="p-4 text-sm text-slate-600">
                          <div className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-slate-400"/> {lead.employee_count || lead.employee_size || '-'}</div>
                          <div className="text-xs text-slate-400 mt-1 pl-5">{lead.revenue_range || ''}</div>
                        </td>
                        <td className="p-4 text-sm text-slate-600">
                          <div className="capitalize font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded-md text-[11px] w-fit border border-slate-200/50 shadow-sm">{lead.source_method || lead.source || '-'}</div>
                          {lead.has_active_tender ? <div className="text-[10px] uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold mt-1.5 w-fit shadow-sm">Active Tender</div> : null}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black shadow-sm ${lead.quality_score >= 3 ? 'bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-gradient-to-r from-slate-100 to-slate-50 text-slate-600 border border-slate-200'}`}>
                            {lead.quality_score}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-right flex items-center justify-end gap-2">
                          <a href={`https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(lead.name)}`} target="_blank" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100 shadow-sm" title="Search LinkedIn">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          {(lead.contact_email || lead.email_1 || lead.email) && (
                            <a href={`mailto:${lead.contact_email || lead.email_1 || lead.email}`} className="p-2 text-slate-400 hover:text-[#0F766E] hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-100 shadow-sm" title="Email">
                              <Send className="w-4 h-4" />
                            </a>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {!loading && totalPages > 1 && (
              <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
                <span className="text-sm text-slate-500">
                  Showing <span className="font-medium text-slate-800">{(currentPage - 1) * rowsPerPage + 1}</span> to <span className="font-medium text-slate-800">{Math.min(currentPage * rowsPerPage, filteredLeads.length)}</span> of <span className="font-medium text-slate-800">{filteredLeads.length}</span> leads
                </span>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="text-sm font-medium text-slate-700 px-3">
                    Page {currentPage} of {totalPages}
                  </div>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
