import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion } from 'motion/react';
import { Save, LayoutTemplate, PenTool } from 'lucide-react';

interface Template {
  template_name: string;
  subject: string;
  body_html: string;
}

export function EmailTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>('TEMPLATE_GLOBAL');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    setLoading(true);
    const { data, error } = await supabase.from('email_templates').select('*');
    if (data && !error && data.length > 0) {
      setTemplates(data);
      if (!data.find(t => t.template_name === selectedTab)) {
        setSelectedTab(data[0].template_name);
      }
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    const activeTemplate = templates.find(t => t.template_name === selectedTab);
    if (activeTemplate) {
      await supabase.from('email_templates').upsert(activeTemplate, { onConflict: 'template_name' });
      alert('Template saved securely to Supabase!');
    }
    setSaving(false);
  }

  const updateTemplate = (field: 'subject' | 'body_html', value: string) => {
    setTemplates(templates.map(t => 
      t.template_name === selectedTab ? { ...t, [field]: value } : t
    ));
  };

  if (loading) return <div className="text-center p-12 text-slate-500 font-medium animate-pulse">Loading Email Studio...</div>;

  const activeTemplate = templates.find(t => t.template_name === selectedTab);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-900 flex items-center gap-3">
            <LayoutTemplate className="text-indigo-600 w-8 h-8" />
            Email Studio
          </h2>
          <p className="text-slate-500 mt-2 font-medium">Design and preview your AI-personalized HTML outreach templates.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md flex items-center gap-2"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Deploy Template'}
        </button>
      </div>

      <div className="flex gap-2 border-b border-slate-200 shrink-0">
        {templates.map(t => (
          <button
            key={t.template_name}
            onClick={() => setSelectedTab(t.template_name)}
            className={`px-6 py-3 font-bold text-sm rounded-t-xl transition-all ${
              selectedTab === t.template_name 
              ? 'bg-white text-indigo-600 border-t-2 border-l border-r border-t-indigo-600 border-l-slate-200 border-r-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] relative translate-y-[1px]' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 border-transparent'
            }`}
          >
            {t.template_name}
          </button>
        ))}
      </div>

      {activeTemplate && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 grow min-h-0">
          
          {/* EDITOR PANE */}
          <motion.div initial={{opacity: 0, x: -10}} animate={{opacity: 1, x: 0}} className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2 text-slate-700 font-bold text-sm shrink-0">
              <PenTool className="w-4 h-4 text-indigo-500" />
              HTML Editor
            </div>
            <div className="p-4 flex flex-col gap-4 grow">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Subject Line</label>
                <input 
                  type="text" 
                  value={activeTemplate.subject}
                  onChange={(e) => updateTemplate('subject', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2 font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                />
              </div>
              <div className="grow flex flex-col">
                <label className="block text-sm font-bold text-slate-700 mb-1 flex justify-between">
                  <span>Email Body (HTML)</span>
                  <span className="text-xs font-normal text-slate-400">Available vars: {'{name}'}, {'{company}'}, {'{ai_icebreaker}'}</span>
                </label>
                <textarea 
                  value={activeTemplate.body_html}
                  onChange={(e) => updateTemplate('body_html', e.target.value)}
                  className="w-full grow border border-slate-200 rounded-lg p-4 font-mono text-sm bg-slate-900 text-emerald-400 focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-shadow"
                  spellCheck="false"
                />
              </div>
            </div>
          </motion.div>

          {/* LIVE PREVIEW PANE */}
          <motion.div initial={{opacity: 0, x: 10}} animate={{opacity: 1, x: 0}} transition={{delay: 0.1}} className="flex flex-col h-full bg-slate-100 rounded-2xl border border-slate-300 overflow-hidden shadow-inner">
            {/* Mock Email Client Header */}
            <div className="bg-slate-200 px-4 py-3 border-b border-slate-300 flex items-center gap-2 shrink-0">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
              </div>
              <div className="ml-4 flex-1 bg-white/50 px-3 py-1 rounded text-xs font-medium text-slate-500 flex items-center justify-center">
                Live Preview
              </div>
            </div>
            
            {/* Mock Email Client Content */}
            <div className="bg-white m-4 rounded-xl border border-slate-200 shadow-sm grow flex flex-col overflow-hidden">
              <div className="border-b border-slate-100 p-4 shrink-0 space-y-2">
                <div className="text-xl font-bold text-slate-800">
                  {activeTemplate.subject || 'No Subject'}
                </div>
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                      ME
                    </div>
                    <div>
                      <div className="font-bold text-slate-700">Somesh N.</div>
                      <div className="text-slate-500 text-xs">to client@company.com</div>
                    </div>
                  </div>
                  <div className="text-slate-400 text-xs">
                    Just now
                  </div>
                </div>
              </div>
              <div className="p-6 overflow-y-auto grow text-slate-800 email-preview-content" dangerouslySetInnerHTML={{ 
                __html: activeTemplate.body_html
                  .replace(/{name}/g, '<span class="bg-amber-100 text-amber-800 px-1 rounded font-mono text-xs">Jane</span>')
                  .replace(/{company}/g, '<span class="bg-amber-100 text-amber-800 px-1 rounded font-mono text-xs">Acme Corp</span>')
                  .replace(/{ai_icebreaker}/g, '<span class="bg-emerald-100 text-emerald-800 px-1 rounded border border-emerald-200 font-mono text-xs block my-1 p-1">I noticed Acme Corp just expanded its European operations, congratulations on the incredible growth!</span>')
              }} />
            </div>
          </motion.div>

        </div>
      )}
    </div>
  );
}
