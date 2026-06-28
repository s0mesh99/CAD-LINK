import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Send, Clock, Building2, CheckCircle2, UserPlus, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';

export function InboxManager() {
  const [dispatched, setDispatched] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchDispatched();
  }, []);

  async function fetchDispatched() {
    setLoading(true);
    
    // Get beginning of current day
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from('email_tracking')
      .select('*, companies(id, name, domain, status, notes, city, country)')
      .gte('sent_at', today.toISOString())
      .order('sent_at', { ascending: false });
    
    setDispatched(data || []);
    setLoading(false);
  }

  async function markForFollowUp(companyId: string) {
    setActionLoading(companyId);
    
    // Update company status to Contacted so it appears in the CRM Follow-up column
    await supabase.from('companies').update({ status: 'Contacted' }).eq('id', companyId);
    
    // Optimistic UI update
    setDispatched(prev => prev.map(d => {
      if (d.companies?.id === companyId) {
        return { ...d, companies: { ...d.companies, status: 'Contacted' } };
      }
      return d;
    }));
    
    setActionLoading(null);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Send className="w-8 h-8 text-indigo-600" />
            Outreach Summary
          </h1>
          <p className="text-slate-500 mt-1">Review the AI summaries and emails sent for your daily dispatched leads.</p>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm px-4 py-2 rounded-xl text-sm font-bold text-slate-700 flex items-center gap-2 w-fit">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {dispatched.length} Emails Sent Today
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Time Sent</th>
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4 min-w-[200px]">Email Details</th>
                <th className="px-6 py-4 min-w-[300px]">AI Summary</th>
                <th className="px-6 py-4">CRM Action</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <motion.tr key={`skel-${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="border-b border-slate-100 animate-pulse">
                      <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-200 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-200 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-4 w-48 bg-slate-200 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-4 w-48 bg-slate-200 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-8 w-28 bg-slate-200 rounded-lg"></div></td>
                    </motion.tr>
                  ))
                ) : dispatched.length === 0 ? (
                  <tr className="border-b border-slate-100">
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      <Send className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="font-medium">No emails dispatched yet today.</p>
                      <p className="text-xs mt-1">Check back after the Campaign Blaster runs at 8:30 AM UTC.</p>
                    </td>
                  </tr>
                ) : (
                  dispatched.map((item, idx) => (
                    <motion.tr 
                      key={item.id} 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ delay: idx * 0.05 }}
                      className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDistanceToNow(new Date(item.sent_at), { addSuffix: true })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          {item.companies?.name || 'Unknown'}
                        </div>
                        {item.companies?.domain && (
                          <a href={`https://${item.companies.domain}`} target="_blank" rel="noreferrer" className="text-xs text-cadlink-600 hover:underline flex items-center mt-1">
                            {item.companies.domain}
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900 truncate max-w-xs" title={item.subject}>
                          {item.subject}
                        </div>
                        <div className="text-xs text-slate-500 mt-1 truncate max-w-xs" title={item.recipient_email}>
                          To: {item.recipient_email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-slate-700 whitespace-pre-wrap max-w-sm">
                          {item.companies?.notes || 'No summary available.'}
                        </div>
                        {item.companies?.city && item.companies?.country && (
                          <div className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wide">
                            📍 {item.companies.city}, {item.companies.country}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {item.companies?.status === 'Contacted' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 font-semibold text-xs rounded-lg border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            In CRM Tracker
                          </span>
                        ) : (
                          <button 
                            onClick={() => markForFollowUp(item.company_id)}
                            disabled={actionLoading === item.company_id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg border border-slate-300 shadow-sm transition-all disabled:opacity-50"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            {actionLoading === item.company_id ? 'Adding...' : 'Mark for Follow-up'}
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
