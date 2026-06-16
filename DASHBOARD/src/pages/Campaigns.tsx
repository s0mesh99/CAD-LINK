import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Mail, CheckCircle2, XCircle, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function Campaigns() {
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchEmails() {
      const { data } = await supabase
        .from('email_tracking')
        .select(`
          *,
          companies ( name, domain )
        `)
        .order('sent_at', { ascending: false })
        .limit(100);

      setEmails(data || []);
      setLoading(false);
    }
    fetchEmails();
  }, []);

  const filteredEmails = emails.filter(e => 
    e.recipient_email?.toLowerCase().includes(search.toLowerCase()) || 
    e.companies?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Campaign Tracking</h1>
          <p className="text-slate-400">Monitor automated cold email dispatches and follow-ups.</p>
        </div>
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
      </div>

      <div className="bg-[#0d1323]/60 border border-slate-800/60 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/40 text-xs uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-800/60">
                <th className="p-4 pl-6">Company</th>
                <th className="p-4">Recipient</th>
                <th className="p-4">Phase</th>
                <th className="p-4">Sent At</th>
                <th className="p-4 text-right pr-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr><td colSpan={5} className="p-12 text-center text-slate-500">Loading campaign data...</td></tr>
              ) : filteredEmails.length === 0 ? (
                <tr><td colSpan={5} className="p-12 text-center text-slate-500">No emails found.</td></tr>
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
                    <td className="p-4 pr-6 text-right">
                      {email.bounced === 1 ? (
                        <div className="inline-flex items-center gap-1 text-red-400 text-xs font-medium">
                          <XCircle className="w-4 h-4" /> Bounced
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 text-emerald-400 text-xs font-medium">
                          <CheckCircle2 className="w-4 h-4" /> Delivered
                        </div>
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
  );
}
