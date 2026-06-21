import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion } from 'motion/react';
import { Settings, Plus, X, Save } from 'lucide-react';

export function ScraperConfig() {
  const [services, setServices] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newService, setNewService] = useState('');
  const [newRegion, setNewRegion] = useState('');

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    setLoading(true);
    const { data, error } = await supabase.from('scraper_config').select('*');
    if (data && !error) {
      const srv = data.find(d => d.config_type === 'services')?.config_data || [];
      const reg = data.find(d => d.config_type === 'regions')?.config_data || [];
      setServices(srv);
      setRegions(reg);
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    await supabase.from('scraper_config').upsert({ config_type: 'services', config_data: services }, { onConflict: 'config_type' });
    await supabase.from('scraper_config').upsert({ config_type: 'regions', config_data: regions }, { onConflict: 'config_type' });
    setSaving(false);
    alert('Scraper configuration saved securely to Supabase!');
  }

  const removeService = (idx: number) => setServices(services.filter((_, i) => i !== idx));
  const removeRegion = (idx: number) => setRegions(regions.filter((_, i) => i !== idx));

  const addService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.trim()) return;
    setServices([...services, `"${newService.trim()}"`]);
    setNewService('');
  };

  const addRegion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRegion.trim()) return;
    setRegions([...regions, `"${newRegion.trim()}"`]);
    setNewRegion('');
  };

  if (loading) return <div className="text-center p-12 text-slate-500 font-medium animate-pulse">Loading Configuration Engine...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-900 flex items-center gap-3">
            <Settings className="text-cadlink-600 w-8 h-8" />
            Scraper Command Center
          </h2>
          <p className="text-slate-500 mt-2 font-medium">Dynamically adjust what the Python bots hunt for across the web.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-cadlink-600 hover:bg-cadlink-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md flex items-center gap-2"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving to Core...' : 'Deploy Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Services Box */}
        <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="glass-card rounded-3xl p-8 border-t-4 border-t-emerald-500">
          <h3 className="text-xl font-bold mb-4">Targeted Services & Sectors</h3>
          
          <form onSubmit={addService} className="flex gap-2 mb-6">
            <input type="text" value={newService} onChange={e => setNewService(e.target.value)} placeholder='e.g. data center engineering' className="flex-1 border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cadlink-500 outline-none" />
            <button type="submit" className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-800 flex items-center"><Plus className="w-4 h-4 mr-1"/> Add</button>
          </form>

          <div className="flex flex-wrap gap-2">
            {services.map((srv, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-sm font-medium">
                {srv}
                <button onClick={() => removeService(i)} className="hover:text-red-500 ml-1"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
        </motion.div>

        {/* Regions Box */}
        <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{delay: 0.1}} className="glass-card rounded-3xl p-8 border-t-4 border-t-blue-500">
          <h3 className="text-xl font-bold mb-4">Targeted Global Regions</h3>
          
          <form onSubmit={addRegion} className="flex gap-2 mb-6">
            <input type="text" value={newRegion} onChange={e => setNewRegion(e.target.value)} placeholder='e.g. Frankfurt' className="flex-1 border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            <button type="submit" className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-800 flex items-center"><Plus className="w-4 h-4 mr-1"/> Add</button>
          </form>

          <div className="flex flex-wrap gap-2">
            {regions.map((reg, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-full text-sm font-medium">
                {reg}
                <button onClick={() => removeRegion(i)} className="hover:text-red-500 ml-1"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
