import { motion } from 'motion/react';
import { CheckCircle, Shield, TrendingUp, Users } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden mesh-bg text-slate-900">
      {/* Animated Subtle Dot Pattern Overlay */}
      <motion.div 
        animate={{ 
          backgroundPosition: ['0px 0px', '30px 30px'] 
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 10, 
          ease: "linear" 
        }}
        className="absolute inset-0 z-0 opacity-10" 
        style={{
          backgroundImage: 'radial-gradient(#1F7A62 2px, transparent 2px)',
          backgroundSize: '30px 30px'
        }}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
          className="inline-flex items-center justify-center px-4 py-1.5 mb-8 text-xs font-bold tracking-widest text-cadlink-700 uppercase bg-cadlink-100/50 rounded-full border border-cadlink-300/50 backdrop-blur-md"
        >
          Independent EPC Drafting Studio
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, type: "spring", bounce: 0.4 }}
          className="text-5xl tracking-tight font-display font-extrabold sm:text-6xl md:text-7xl max-w-5xl mx-auto leading-[1.1]"
        >
          Civil & Structural Design Support for EPC Projects. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cadlink-500 to-cadlink-700 inline-block relative">
            Without the Agency Overhead.
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ delay: 1, duration: 0.8, ease: "easeOut" }}
              className="absolute -bottom-2 left-0 h-2 bg-cadlink-200/50 rounded-full -z-10"
            />
          </span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, type: "spring" }}
          className="mt-8 max-w-2xl mx-auto text-lg text-slate-600 sm:text-xl font-medium leading-relaxed"
        >
          Accurate civil and structural drafting, detailing, and 3D modeling services for oil & gas, industrial, and infrastructure projects. Backed by 5+ years of EPC design experience using AutoCAD, MicroStation, Tekla, SmartPlant 3D (S3D), and AVEVA E3D—delivering scalable engineering support without agency overheads or long-term commitments.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, type: "spring" }}
          className="mt-10 flex flex-col sm:flex-row justify-center gap-5"
        >
          <motion.a 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="#contact" 
            className="bg-cadlink-600 hover:bg-cadlink-700 text-white px-8 py-4 rounded-full font-bold transition-colors shadow-[0_10px_20px_rgba(31,122,98,0.2)] hover:shadow-[0_15px_30px_rgba(31,122,98,0.4)] inline-flex justify-center items-center text-lg relative overflow-hidden group"
          >
            <span className="relative z-10">Claim Your Free Sample Drawing</span>
            <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
          </motion.a>
          
          <motion.a 
            whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,1)" }}
            whileTap={{ scale: 0.95 }}
            href="#about" 
            className="glass-card text-cadlink-800 px-8 py-4 rounded-full font-bold transition-all inline-flex justify-center items-center text-lg shadow-sm"
          >
            How It Works
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}

export function AboutSection() {
  const highlights = [
    { title: "Rapid Resource Scaling", desc: "Add senior drafting capacity within days, not weeks. No recruitment cycles, no fixed headcount, no idle bench cost.", icon: TrendingUp },
    { title: "Standards-Compliant Execution", desc: "Drawings benchmarked against the QA standards used on international EPC and O&G projects — not generic templates.", icon: Shield },
    { title: "Zero Agency Bloat", desc: "Work directly with the person doing the drafting. Clear communication, fast turnarounds, and seamless remote collaboration across time zones — no agency layer slowing things down.", icon: Users }
  ];

  return (
    <section id="about" className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -60, rotate: -5 }}
            whileInView={{ opacity: 1, x: 0, rotate: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, type: "spring", bounce: 0.2 }}
            className="mb-12 lg:mb-0 relative"
          >
            <div className="absolute inset-0 bg-cadlink-500 rounded-2xl transform translate-x-4 translate-y-4 opacity-10"></div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
              className="relative rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
            >
              <img 
                src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&q=80&w=1000" 
                alt="Engineering Planning and Blueprints" 
                className="object-cover h-[600px] w-full transform transition-transform duration-700 hover:scale-105"
              />
            </motion.div>
            
            {/* Floating Stats Glass Card */}
            <motion.div 
              animate={{ y: [0, -15, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute -right-8 -bottom-8 glass-card p-6 rounded-xl hidden md:block w-64 shadow-xl border-t border-l border-white/80"
            >
              <div className="text-sm font-bold text-cadlink-600 uppercase tracking-wider mb-1">Margin Protection</div>
              <div className="text-3xl font-display font-extrabold text-slate-900">Up to 35%</div>
              <div className="text-sm text-slate-600 mt-1">Typical reduction in drafting overhead vs. traditional agency rates.</div>
            </motion.div>
          </motion.div>
          
          <div className="relative">
            <motion.h2 
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-sm font-bold text-cadlink-600 tracking-widest uppercase mb-3"
            >
              The CAD LINK Advantage
            </motion.h2>
            
            <motion.h3 
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl font-display font-extrabold text-slate-900 mb-6 lg:text-5xl tracking-tight leading-tight"
            >
              Protect Your Margins During Tender Rushes and Execution Overload.
            </motion.h3>
            
            <motion.p 
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-slate-600 mb-10 leading-relaxed font-medium"
            >
              Internal drafting teams get stretched thin during tender submissions and execution crunches — and agency overhead only slows things down further. CAD LINK gives you direct access to senior-level civil and structural drafting and 3D modeling, using the same tools your team already runs on: AutoCAD, MicroStation, and Tekla. I plug into your workflow as a working extension of your team, not another vendor layer to manage.
            </motion.p>
            
            <ul className="space-y-8">
              {highlights.map((item, idx) => (
                <motion.li 
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{ x: 10 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15, type: "spring", bounce: 0.4 }}
                  className="flex items-start group cursor-default"
                >
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-12 h-12 bg-cadlink-50 text-cadlink-600 rounded-xl flex items-center justify-center shadow-sm border border-cadlink-100 group-hover:bg-cadlink-600 group-hover:text-white transition-colors duration-300">
                      <item.icon className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="ml-5">
                    <h4 className="text-xl font-bold text-slate-900 group-hover:text-cadlink-700 transition-colors">{item.title}</h4>
                    <p className="mt-2 text-slate-600 leading-relaxed">{item.desc}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
