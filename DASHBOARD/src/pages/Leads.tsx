import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Mail, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface Lead {
  id: string;
  created_at: string;
  name: string;
  email: string;
  message: string;
  source: string;
}

export function LeadsOverview() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [crmEmails, setCrmEmails] = useState<Set<string>>(new Set());
  const [pushingId, setPushingId] = useState<string | null>(null);

  useEffect(() => {
    fetchLeads();

    // Subscribe to new leads
    const subscription = supabase
      .channel('website_leads_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'website_leads' }, (payload) => {
        setLeads((current) => [payload.new as Lead, ...current]);
        checkIfInCrm([payload.new as Lead]); // Check this specific new lead
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  async function fetchLeads() {
    try {
      const { data, error } = await supabase
        .from('website_leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') {
          console.warn('website_leads table not created yet');
          return;
        }
        throw error;
      }
      
      const fetchedLeads = data || [];
      setLeads(fetchedLeads);
      
      if (fetchedLeads.length > 0) {
        await checkIfInCrm(fetchedLeads);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  }

  async function checkIfInCrm(leadsToCheck: Lead[]) {
    const emails = leadsToCheck.map(l => l.email).filter(Boolean);
    if (emails.length === 0) return;

    try {
      const { data, error } = await supabase
        .from('companies')
        .select('email_1')
        .in('email_1', emails);

      if (error) throw error;
      
      if (data) {
        const foundEmails = new Set(data.map(d => d.email_1));
        setCrmEmails(prev => {
          const newSet = new Set(prev);
          foundEmails.forEach(e => newSet.add(e));
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error checking CRM emails:', error);
    }
  }

  async function pushToCrm(lead: Lead) {
    if (!lead.email) {
      alert("Cannot push lead to CRM: Email is missing.");
      return;
    }
    
    setPushingId(lead.id);
    try {
      const { error } = await supabase.from('companies').insert({
        name: lead.name,
        email_1: lead.email,
        status: 'Contacted',
        sector: 'Inbound',
        sub_sector: lead.source,
        quality_score: 5 // Inbound leads are high quality
      });

      if (error) {
        // If it's a unique constraint violation, they are already in the DB
        if (error.code === '23505') {
          console.log("Lead already exists in CRM.");
        } else {
          throw error;
        }
      }

      // Mark as added to CRM locally
      setCrmEmails(prev => new Set(prev).add(lead.email));
    } catch (error) {
      console.error('Error pushing lead to CRM:', error);
      alert('Failed to push lead to CRM.');
    } finally {
      setPushingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Inbound Leads</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Manage leads generated from your portfolio website.</p>
        </div>
        <div className="bg-cadlink-50 text-cadlink-700 px-4 py-2 rounded-xl text-sm font-bold border border-cadlink-200 shadow-sm w-fit">
          {leads.length} Total Leads
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 font-medium">Loading leads...</div>
        ) : leads.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <Mail className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-display font-bold text-slate-900 mb-2">No leads yet</h3>
            <p className="text-slate-500 font-medium max-w-sm">When visitors submit the contact form on your public website, they will appear here automatically.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 border-b border-slate-200/60 text-slate-600">
                <tr>
                  <th className="px-6 py-4 font-bold">Contact</th>
                  <th className="px-6 py-4 font-bold">Message</th>
                  <th className="px-6 py-4 font-bold text-right">Date</th>
                  <th className="px-6 py-4 font-bold text-center">CRM Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60">
                {leads.map((lead, idx) => {
                  const isInCrm = crmEmails.has(lead.email);
                  const isPushing = pushingId === lead.id;

                  return (
                    <motion.tr 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={lead.id} 
                      className="hover:bg-white/60 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 text-base flex items-center gap-2">
                          {lead.name}
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            {lead.source}
                          </span>
                        </div>
                        <div className="text-slate-500 font-medium flex items-center gap-1.5 mt-1">
                          <Mail className="w-3.5 h-3.5" /> {lead.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-600 font-medium line-clamp-2 max-w-md">
                          {lead.message || <span className="text-slate-400 italic">No message provided</span>}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-500 font-medium whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(lead.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isInCrm ? (
                          <div className="inline-flex items-center gap-1.5 text-emerald-600 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                            <CheckCircle2 className="w-4 h-4" /> Added to CRM
                          </div>
                        ) : (
                          <button 
                            onClick={() => pushToCrm(lead)}
                            disabled={isPushing}
                            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                          >
                            {isPushing ? 'Pushing...' : (
                              <>Push to CRM <ArrowRight className="w-4 h-4" /></>
                            )}
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
