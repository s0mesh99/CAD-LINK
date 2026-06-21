import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Mail, Bot, MessageSquare, Clock, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';

export function InboxManager() {
  const [replies, setReplies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReplies();
  }, []);

  async function fetchReplies() {
    setLoading(true);
    // Fetch emails that have a reply or a pipeline_stage from the AI
    const { data } = await supabase
      .from('email_tracking')
      .select('*, companies(name, domain)')
      .or('replied.eq.1,pipeline_stage.not.is.null')
      .order('replied_at', { ascending: false, nullsFirst: false });
    
    setReplies(data || []);
    setLoading(false);
  }

  const getStageColor = (stage: string) => {
    if (!stage) return 'bg-slate-100 text-slate-600 border-slate-200';
    const s = stage.toLowerCase();
    if (s.includes('hot')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (s.includes('question')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (s.includes('reject') || s.includes('not interested')) return 'bg-red-100 text-red-800 border-red-200';
    if (s.includes('later')) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-purple-100 text-purple-800 border-purple-200';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Bot className="w-8 h-8 text-[#0F766E]" />
            AI Inbox Manager
          </h1>
          <p className="text-slate-500 mt-1">Review AI-triaged email replies and summaries automatically synced from Zoho.</p>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm px-4 py-2 rounded-xl text-sm font-bold text-slate-700 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#0F766E]" />
          {replies.length} Replies Found
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <AnimatePresence>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <motion.div key={`skel-${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white rounded-xl p-6 animate-pulse border border-slate-200 shadow-sm">
                  <div className="h-6 w-1/3 bg-slate-200 rounded mb-4"></div>
                  <div className="h-4 w-full bg-slate-100 rounded mb-2"></div>
                  <div className="h-4 w-2/3 bg-slate-100 rounded"></div>
                </motion.div>
              ))
            ) : replies.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                  <Mail className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-700 mb-1">No Replies Yet</h3>
                <p className="text-slate-500 text-sm max-w-md">The AI Inbox Manager will automatically analyze and surface email replies here when prospects respond to your outreach.</p>
              </div>
            ) : (
              replies.map((reply, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={reply.id} 
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-slate-200 hover:border-[#0F766E]/30 group"
                >
                  <div className="p-5 border-b border-slate-100/50 bg-white/50 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold text-slate-800">
                          {reply.companies?.name || 'Unknown Company'}
                        </h3>
                        {reply.pipeline_stage && (
                          <span className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full border shadow-sm ${getStageColor(reply.pipeline_stage)}`}>
                            {reply.pipeline_stage}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                        <a href={`mailto:${reply.recipient_email}`} className="hover:text-[#0F766E] transition-colors">{reply.recipient_email}</a>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {reply.replied_at ? formatDistanceToNow(new Date(reply.replied_at)) + ' ago' : 'Unknown time'}</span>
                      </div>
                    </div>
                    <a href={`https://mail.zoho.in`} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-blue-600 bg-white hover:bg-blue-50 rounded-lg transition-colors border border-slate-200 hover:border-blue-200 shadow-sm" title="Open Zoho Mail">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  {reply.ai_summary && (
                    <div className="p-5 bg-gradient-to-r from-[#0F766E]/5 to-transparent border-b border-slate-100/50">
                      <div className="flex gap-3">
                        <div className="mt-0.5 bg-[#0F766E]/10 p-1.5 rounded-lg border border-[#0F766E]/20">
                          <Bot className="w-4 h-4 text-[#0F766E] shrink-0" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#0F766E] uppercase tracking-wider mb-1">AI Summary</div>
                          <p className="text-sm text-slate-700 font-medium leading-relaxed">{reply.ai_summary}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {reply.reply_content && (
                    <div className="p-5">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" /> Original Reply
                      </div>
                      <div className="text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-xl p-4 max-h-48 overflow-y-auto whitespace-pre-wrap font-mono text-[13px] shadow-inner">
                        {reply.reply_content}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 border border-slate-200 border-t-4 border-t-[#0F766E] shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Bot className="w-5 h-5 text-[#0F766E]" /> How it Works
            </h3>
            <ul className="space-y-4 text-sm text-slate-600 font-medium">
              <li className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black shrink-0 text-xs border border-emerald-200">1</div>
                <p>The background script securely connects to your Zoho account to fetch unread replies.</p>
              </li>
              <li className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black shrink-0 text-xs border border-emerald-200">2</div>
                <p>Google Gemini AI reads the reply, summarizes it, and determines the intent (Hot Lead, Rejected, etc.).</p>
              </li>
              <li className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black shrink-0 text-xs border border-emerald-200">3</div>
                <p>The system updates the database, displaying the results in this feed so you can quickly prioritize responses.</p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
