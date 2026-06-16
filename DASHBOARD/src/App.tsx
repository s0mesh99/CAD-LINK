import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { Building2, Mail, BarChart3, Database, Search } from 'lucide-react';

function App() {
  const [stats, setStats] = useState({ totalLeads: 0, premiumLeads: 0, totalEmails: 0 });
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchData() {
      // Fetch Total Leads
      const { count: totalLeads } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true });

      // Fetch Premium Leads (score >= 3)
      const { count: premiumLeads } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .gte('quality_score', 3);

      // Fetch Emails Sent
      const { count: totalEmails } = await supabase
        .from('email_tracking')
        .select('*', { count: 'exact', head: true });

      // Fetch recent 50 leads for the table
      const { data: recentLeads } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      setStats({
        totalLeads: totalLeads || 0,
        premiumLeads: premiumLeads || 0,
        totalEmails: totalEmails || 0,
      });

      setLeads(recentLeads || []);
      setLoading(false);
    }

    fetchData();
  }, []);

  const filteredLeads = leads.filter(l => 
    l.name?.toLowerCase().includes(search.toLowerCase()) || 
    l.domain?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6 md:p-12 relative overflow-hidden">
      {/* Background Mesh */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-[var(--color-cadlink)]/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="bg-[var(--color-cadlink)] p-3 rounded-xl shadow-lg shadow-[var(--color-cadlink)]/20">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">CAD LINK</h1>
              <p className="text-sm text-slate-400 font-medium">Outreach Intelligence CRM</p>
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard 
            icon={<Building2 className="w-6 h-6 text-[var(--color-cadlink)]" />}
            title="Total Leads Pipeline"
            value={loading ? '...' : stats.totalLeads}
          />
          <StatCard 
            icon={<BarChart3 className="w-6 h-6 text-blue-400" />}
            title="Premium Leads (Score 3+)"
            value={loading ? '...' : stats.premiumLeads}
          />
          <StatCard 
            icon={<Mail className="w-6 h-6 text-purple-400" />}
            title="Emails Sent"
            value={loading ? '...' : stats.totalEmails}
          />
        </div>

        {/* CRM Table */}
        <div className="bg-slate-800/40 border border-slate-700/50 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Recent Leads</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search companies..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-cadlink)]/50 transition-all w-full md:w-64"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/80 text-xs uppercase tracking-wider text-slate-400 font-medium">
                  <th className="p-4">Company Name</th>
                  <th className="p-4">Domain</th>
                  <th className="p-4">Country</th>
                  <th className="p-4">Quality Score</th>
                  <th className="p-4">Contact Person</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {loading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-500">Loading leads...</td></tr>
                ) : filteredLeads.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-500">No leads found.</td></tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-medium text-slate-200">{lead.name}</td>
                      <td className="p-4 text-slate-400">
                        {lead.domain ? (
                          <a href={`https://${lead.domain}`} target="_blank" rel="noreferrer" className="hover:text-[var(--color-cadlink)] transition-colors">
                            {lead.domain}
                          </a>
                        ) : 'N/A'}
                      </td>
                      <td className="p-4 text-slate-400">{lead.country || 'N/A'}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <div 
                              key={i} 
                              className={`w-2 h-2 rounded-full ${i < (lead.quality_score / 2) ? 'bg-[var(--color-cadlink)]' : 'bg-slate-700'}`} 
                            />
                          ))}
                          <span className="ml-2 text-xs text-slate-400">{lead.quality_score}/10</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-400">
                        {lead.contact_name ? (
                          <div className="flex flex-col">
                            <span className="text-slate-300">{lead.contact_name}</span>
                            <span className="text-xs text-slate-500">{lead.contact_email || 'No Email'}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Undiscovered</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ icon, title, value }: { icon: React.ReactNode, title: string, value: string | number }) {
  return (
    <div className="bg-slate-800/40 border border-slate-700/50 backdrop-blur-xl p-6 rounded-2xl flex items-center gap-4 hover:-translate-y-1 transition-transform duration-300 shadow-xl shadow-black/20">
      <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-400">{title}</p>
        <p className="text-3xl font-bold text-slate-100">{value}</p>
      </div>
    </div>
  );
}

export default App;
