import { motion } from 'motion/react';
import { Server, Code2, Bot, Database, Mail } from 'lucide-react';

export function ScraperConfig() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-900 flex items-center gap-3">
            <Server className="text-cadlink-600 w-8 h-8" />
            Active Automations
          </h2>
          <p className="text-slate-500 mt-2 font-medium">Read-only view of background processes running in your GitHub Actions CI/CD pipeline.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Deep Enrichment Automator */}
        <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="glass-card rounded-3xl p-8 border-t-4 border-t-emerald-500">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600">
              <Bot className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">deep_enrichment.py</h3>
              <p className="text-slate-500 font-mono text-sm">Cron: '0 8 * * *' (Daily at 8:00 AM UTC)</p>
            </div>
          </div>
          
          <div className="space-y-4 text-slate-600">
            <p><strong>Purpose:</strong> This Python script is the "Deep Brain" of the system. It wakes up every morning and pulls the next batch of raw leads from Supabase.</p>
            <p><strong>How it works:</strong> It uses Playwright to physically navigate to each lead's website, extracts the text, and feeds it into Google Gemini 2.5 Flash. Gemini acts as an AI gatekeeper to determine if the company is an engineering firm that outsources work.</p>
            <p><strong>Database Actions:</strong> If Gemini approves the company, the status is set to <span className="font-mono bg-slate-100 px-1 rounded">Enriched</span>. If they are a consumer brand or don't outsource, the status is set to <span className="font-mono bg-slate-100 px-1 rounded">Rejected</span>.</p>
          </div>
          
          <div className="mt-6 pt-6 border-t border-slate-100 flex items-center gap-2 text-sm text-emerald-700 font-medium">
            <Code2 className="w-4 h-4" />
            Runs autonomously via GitHub Actions. Config changes must be made via Git.
          </div>
        </motion.div>

        {/* Campaign Blaster */}
        <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{delay: 0.1}} className="glass-card rounded-3xl p-8 border-t-4 border-t-blue-500">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
              <Mail className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">campaign_blaster.py</h3>
              <p className="text-slate-500 font-mono text-sm">Cron: '30 8 * * *' (Daily at 8:30 AM UTC)</p>
            </div>
          </div>
          
          <div className="space-y-4 text-slate-600">
            <p><strong>Purpose:</strong> This Python script is responsible for executing your daily quota of 20 cold outreach emails safely to protect your domain reputation.</p>
            <p><strong>How it works:</strong> It queries Supabase for 20 leads that are currently marked as <span className="font-mono bg-slate-100 px-1 rounded">Enriched</span> (having successfully passed the AI gatekeeper). It uses the Zoho SMTP server to dispatch the personalized HTML emails.</p>
            <p><strong>Database Actions:</strong> Upon a successful send, it logs the event in the <span className="font-mono bg-slate-100 px-1 rounded">email_tracking</span> table and updates the company status to <span className="font-mono bg-slate-100 px-1 rounded">Emailed</span>.</p>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 flex items-center gap-2 text-sm text-blue-700 font-medium">
            <Database className="w-4 h-4" />
            Respects Zoho's daily sending limits automatically via delay loops.
          </div>
        </motion.div>

      </div>
    </div>
  );
}
