import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion } from 'motion/react';
import { Mail, Save } from 'lucide-react';

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
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-900 flex items-center gap-3">
            <Mail className="text-cadlink-600 w-8 h-8" />
            Email Studio
          </h2>
          <p className="text-slate-500 mt-2 font-medium">Edit the exact text that goes out to the freelance clients.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-cadlink-600 hover:bg-cadlink-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md flex items-center gap-2"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Deploy Template'}
        </button>
      </div>

      <div className="glass-card rounded-3xl p-8 border-t-4 border-t-purple-500">
        <div className="flex gap-4 mb-8 border-b border-slate-200 pb-4">
          {templates.map(t => (
            <button
              key={t.template_name}
              onClick={() => setSelectedTab(t.template_name)}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                selectedTab === t.template_name 
                  ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {t.template_name.replace('TEMPLATE_', '')}
            </button>
          ))}
        </div>

        {activeTemplate && (
          <motion.div key={selectedTab} initial={{opacity: 0}} animate={{opacity: 1}} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Subject Line</label>
              <input
                type="text"
                value={activeTemplate.subject}
                onChange={e => updateTemplate('subject', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none font-medium"
              />
              <p className="text-xs text-slate-400 mt-1">Use {'{company}'} to inject the target company's name.</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Email Body (HTML)</label>
              <textarea
                value={activeTemplate.body_html}
                onChange={e => updateTemplate('body_html', e.target.value)}
                rows={12}
                className="w-full border border-slate-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none font-mono text-sm"
              />
              <p className="text-xs text-slate-400 mt-1">Use {'{name}'} and {'{company}'} as variables.</p>
            </div>
            
            <div className="mt-8 pt-8 border-t border-slate-100">
              <h4 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider">Live Preview</h4>
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="text-lg font-bold border-b border-slate-100 pb-4 mb-4">
                  {activeTemplate.subject.replace('{company}', 'Bechtel')}
                </div>
                <div 
                  className="prose prose-slate max-w-none"
                  dangerouslySetInnerHTML={{ __html: activeTemplate.body_html.replace('{name}', 'John').replace('{company}', 'Bechtel') }} 
                />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
