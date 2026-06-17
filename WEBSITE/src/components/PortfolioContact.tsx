import { motion } from 'motion/react';
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react';

export function PortfolioSection() {
  const projects = [
    { 
      title: "Plant Expansion Pipeline Support", 
      tags: ["O&G", "Piping"], 
      delay: 0.1,
      image: "/images/portfolio_pipeline.png"
    },
    { 
      title: "Commercial Facility Steel Detailing", 
      tags: ["Structural", "Commercial"], 
      delay: 0.2,
      image: "/images/portfolio_steel.png"
    },
    { 
      title: "Manufacturing Plant As-Builts", 
      tags: ["Civil", "Drafting"], 
      delay: 0.3,
      image: "/images/portfolio_civil.png"
    }
  ];

  return (
    <section id="portfolio" className="py-24 bg-slate-50 relative overflow-hidden">
      {/* Decorative Blob */}
      <motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-cadlink-200/40 rounded-full blur-[100px] pointer-events-none -translate-x-1/2"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-sm font-bold text-cadlink-600 tracking-widest uppercase mb-3">Project Deliverables</h2>
            <h3 className="text-4xl font-display font-extrabold text-slate-900 tracking-tight sm:text-5xl">Proven Execution.</h3>
          </motion.div>
          <motion.a 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            whileHover={{ scale: 1.05 }}
            href="#contact" 
            className="inline-flex items-center text-cadlink-600 font-bold hover:text-cadlink-700 group bg-white px-6 py-3 rounded-full shadow-sm border border-slate-200"
          >
            Request Full Portfolio 
            <ArrowRight className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
          </motion.a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {projects.map((proj, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: proj.delay, type: "spring", bounce: 0.3 }}
              whileHover={{ y: -15, scale: 1.02 }}
              className="group relative overflow-hidden rounded-3xl bg-slate-900 aspect-square flex flex-col justify-end p-8 shadow-xl cursor-pointer"
            >
              {/* Background Image */}
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110 opacity-50"
                style={{ backgroundImage: `url(${proj.image})` }}
              ></div>

              {/* Abstract Blueprint Background Overlay (subtle) */}
              <div className="absolute inset-0 opacity-10 group-hover:opacity-30 transition-opacity duration-700 mix-blend-overlay" 
                   style={{
                     backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
                     backgroundSize: '20px 20px'
                   }}>
              </div>
              
              <div className="relative z-10 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 ease-out">
                <div className="flex gap-2 mb-4">
                  {proj.tags.map(tag => (
                    <span key={tag} className="text-xs font-bold px-3 py-1 bg-cadlink-500/90 backdrop-blur-md text-white rounded-full border border-cadlink-400/50">
                      {tag}
                    </span>
                  ))}
                </div>
                <h4 className="text-2xl font-bold text-white leading-tight font-display drop-shadow-md">{proj.title}</h4>
              </div>
              
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/50 to-transparent group-hover:from-cadlink-900/95 transition-colors duration-500"></div>
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
      {/* Animated Background Glow */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-cadlink-500/30 rounded-full blur-[120px] pointer-events-none"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, type: "spring" }}
        >
          <motion.div 
            whileHover={{ rotate: 15, scale: 1.1 }}
            className="inline-flex items-center justify-center p-4 bg-cadlink-500/20 rounded-full mb-8 backdrop-blur-sm border border-cadlink-500/30 shadow-[0_0_30px_rgba(31,122,98,0.3)]"
          >
            <Mail className="h-8 w-8 text-cadlink-400" />
          </motion.div>
          
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-display font-extrabold mb-6 tracking-tight">
            Claim Your Free Sample Drawing
          </h2>
          <p className="text-xl text-slate-300 mb-12 font-medium max-w-2xl mx-auto leading-relaxed">
            Test my CAD execution entirely risk-free. Send a spec, and I'll deliver the first drawing at no cost to prove the quality of my work.
          </p>

          <form className="glass-card-dark rounded-3xl p-8 sm:p-12 max-w-2xl mx-auto text-left relative overflow-hidden border border-slate-700/50 shadow-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <motion.div whileFocus={{ scale: 1.02 }} className="transition-transform">
                <label className="block text-sm font-medium text-slate-400 mb-2 ml-1">Name</label>
                <input type="text" className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cadlink-500 focus:ring-1 focus:ring-cadlink-500 transition-colors shadow-inner" placeholder="John Doe" />
              </motion.div>
              <motion.div whileFocus={{ scale: 1.02 }} className="transition-transform">
                <label className="block text-sm font-medium text-slate-400 mb-2 ml-1">Email</label>
                <input type="email" className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cadlink-500 focus:ring-1 focus:ring-cadlink-500 transition-colors shadow-inner" placeholder="john@epcfirm.com" />
              </motion.div>
            </div>
            <motion.div whileFocus={{ scale: 1.01 }} className="mb-8 transition-transform">
              <label className="block text-sm font-medium text-slate-400 mb-2 ml-1">Message (Optional)</label>
              <textarea rows={4} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cadlink-500 focus:ring-1 focus:ring-cadlink-500 transition-colors resize-none shadow-inner" placeholder="We need some overflow support for an upcoming structural project..."></textarea>
            </motion.div>
            
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button" 
              className="w-full bg-cadlink-600 hover:bg-cadlink-500 text-white font-bold py-4 px-8 rounded-xl transition-colors shadow-[0_0_20px_rgba(31,122,98,0.4)] hover:shadow-[0_0_30px_rgba(31,122,98,0.6)] flex justify-center items-center text-lg"
            >
              Request Free Sample Drawing <ArrowRight className="ml-2 h-5 w-5" />
            </motion.button>
            
            <div className="mt-6 flex items-center justify-center text-sm text-slate-400 font-medium">
              <CheckCircle2 className="h-4 w-4 text-cadlink-500 mr-2" /> Usually responds within 2-4 hours.
            </div>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
