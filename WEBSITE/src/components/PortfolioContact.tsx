import { motion } from 'motion/react';
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react';

export function PortfolioSection() {
  const projects = [
    { title: "Plant Expansion Pipeline Support", tags: ["O&G", "Piping"], delay: 0.1 },
    { title: "Commercial Facility Steel Detailing", tags: ["Structural", "Commercial"], delay: 0.2 },
    { title: "Manufacturing Plant As-Builts", tags: ["Civil", "Drafting"], delay: 0.3 }
  ];

  return (
    <section id="portfolio" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <h2 className="text-sm font-bold text-cadlink-600 tracking-widest uppercase mb-3">Project Deliverables</h2>
            <h3 className="text-4xl font-display font-extrabold text-slate-900 tracking-tight sm:text-5xl">Proven Execution.</h3>
          </div>
          <a href="#contact" className="inline-flex items-center text-cadlink-600 font-bold hover:text-cadlink-700 group">
            Request Full Portfolio 
            <ArrowRight className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {projects.map((proj, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: proj.delay }}
              className="group relative overflow-hidden rounded-3xl bg-slate-900 aspect-square flex flex-col justify-end p-8"
            >
              {/* Abstract Blueprint Background Overlay */}
              <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity duration-500" 
                   style={{
                     backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                     backgroundSize: '20px 20px'
                   }}>
              </div>
              
              <div className="relative z-10 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                <div className="flex gap-2 mb-4">
                  {proj.tags.map(tag => (
                    <span key={tag} className="text-xs font-bold px-3 py-1 bg-cadlink-500/80 backdrop-blur-md text-white rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
                <h4 className="text-2xl font-bold text-white leading-tight font-display">{proj.title}</h4>
              </div>
              
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TestimonialsSection() {
  return null; // Simplified out for cleaner presentation in 200x overhaul
}

export function ContactSection() {
  return (
    <section id="contact" className="py-24 relative overflow-hidden bg-slate-900 text-white">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-cadlink-500/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center justify-center p-4 bg-cadlink-500/20 rounded-full mb-8 backdrop-blur-sm border border-cadlink-500/30">
            <Mail className="h-8 w-8 text-cadlink-400" />
          </div>
          
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-display font-extrabold mb-6 tracking-tight">
            Ready to Protect Your Margins?
          </h2>
          <p className="text-xl text-slate-300 mb-12 font-light max-w-2xl mx-auto">
            Schedule a brief 15-minute capabilities overview. No hard sell, just a direct conversation about your drafting bottlenecks.
          </p>

          <form className="glass-card-dark rounded-3xl p-8 sm:p-12 max-w-2xl mx-auto text-left relative overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Name</label>
                <input type="text" className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cadlink-500 focus:ring-1 focus:ring-cadlink-500 transition-colors" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Email</label>
                <input type="email" className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cadlink-500 focus:ring-1 focus:ring-cadlink-500 transition-colors" placeholder="john@epcfirm.com" />
              </div>
            </div>
            <div className="mb-8">
              <label className="block text-sm font-medium text-slate-400 mb-2">Message</label>
              <textarea rows={4} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cadlink-500 focus:ring-1 focus:ring-cadlink-500 transition-colors resize-none" placeholder="We need overflow support for a piping project..."></textarea>
            </div>
            
            <button type="button" className="w-full bg-gradient-to-r from-cadlink-500 to-cadlink-600 hover:from-cadlink-400 hover:to-cadlink-500 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-[0_0_20px_rgba(31,122,98,0.4)] hover:shadow-[0_0_30px_rgba(31,122,98,0.6)] flex justify-center items-center">
              Send Message <ArrowRight className="ml-2 h-5 w-5" />
            </button>
            
            <div className="mt-6 flex items-center justify-center text-sm text-slate-400 font-medium">
              <CheckCircle2 className="h-4 w-4 text-cadlink-500 mr-2" /> Usually responds within 4 hours.
            </div>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
