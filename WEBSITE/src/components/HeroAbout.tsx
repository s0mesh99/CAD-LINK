import { motion } from 'motion/react';
import { CheckCircle, Shield, TrendingUp, Users } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden mesh-bg text-slate-900">
      {/* Subtle Dot Pattern Overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-10" 
        style={{
          backgroundImage: 'radial-gradient(#1F7A62 2px, transparent 2px)',
          backgroundSize: '30px 30px'
        }}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center justify-center px-4 py-1.5 mb-8 text-xs font-bold tracking-widest text-cadlink-700 uppercase bg-cadlink-100/50 rounded-full border border-cadlink-300/50 backdrop-blur-md"
        >
          Specialized Freelance Studio
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl tracking-tight font-display font-extrabold sm:text-6xl md:text-7xl max-w-5xl mx-auto leading-[1.1]"
        >
          Scale Engineering Capacity <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cadlink-500 to-cadlink-700">
            Without Agency Overhead.
          </span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-8 max-w-2xl mx-auto text-lg text-slate-600 sm:text-xl font-medium leading-relaxed"
        >
          I provide elite, on-demand 3D modeling and engineering drafting support specifically engineered to protect margins for EPC and O&G contractors.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row justify-center gap-5"
        >
          <a href="#contact" className="bg-cadlink-600 hover:bg-cadlink-700 text-white px-8 py-4 rounded-full font-bold transition-all shadow-[0_10px_20px_rgba(31,122,98,0.2)] hover:shadow-[0_15px_30px_rgba(31,122,98,0.3)] hover:-translate-y-1 inline-flex justify-center items-center text-lg">
            Claim Your Free Sample Drawing
          </a>
          <a href="#about" className="glass-card text-cadlink-800 hover:bg-white/90 px-8 py-4 rounded-full font-bold transition-all inline-flex justify-center items-center text-lg">
            How It Works
          </a>
        </motion.div>
      </div>
    </section>
  );
}

export function AboutSection() {
  const highlights = [
    { title: "Rapid Resource Scaling", desc: "Instantly add expert drafting capacity without fixed overhead.", icon: TrendingUp },
    { title: "Flawless Execution", desc: "AutoCAD & MicroStation drafting compliant with global industrial standards.", icon: Shield },
    { title: "Zero Agency Bloat", desc: "No middlemen. Direct communication ensures instant clarity.", icon: Users }
  ];

  return (
    <section id="about" className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-12 lg:mb-0 relative"
          >
            <div className="absolute inset-0 bg-cadlink-500 rounded-2xl transform translate-x-4 translate-y-4 opacity-10"></div>
            <img 
              src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&q=80&w=1000" 
              alt="Engineering Planning and Blueprints" 
              className="relative rounded-2xl shadow-2xl object-cover h-[600px] w-full border border-slate-200"
            />
            {/* Floating Stats Glass Card */}
            <div className="absolute -right-8 -bottom-8 glass-card p-6 rounded-xl hidden md:block w-64 animate-bounce" style={{animationDuration: '4s'}}>
              <div className="text-sm font-bold text-cadlink-600 uppercase tracking-wider mb-1">Margin Protection</div>
              <div className="text-3xl font-display font-extrabold text-slate-900">Up to 35%</div>
              <div className="text-sm text-slate-600 mt-1">Reduction in drafting overhead costs.</div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h2 className="text-sm font-bold text-cadlink-600 tracking-widest uppercase mb-3">The CAD LINK Advantage</h2>
            <h3 className="text-4xl font-display font-extrabold text-slate-900 mb-6 lg:text-5xl tracking-tight leading-tight">
              Protect Margins During Peak Tender Phases.
            </h3>
            <p className="text-lg text-slate-600 mb-10 leading-relaxed font-medium">
              Say goodbye to bloated agency overhead and drafting bottlenecks. I provide direct, expert-level 2D drafting and layout modeling tailored for the high standards of global EPCs. I act as a seamless extension to your internal teams.
            </p>
            
            <ul className="space-y-8">
              {highlights.map((item, idx) => (
                <motion.li 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.2 }}
                  className="flex items-start"
                >
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-12 h-12 bg-cadlink-50 text-cadlink-600 rounded-xl flex items-center justify-center shadow-inner border border-cadlink-100">
                      <item.icon className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="ml-5">
                    <h4 className="text-xl font-bold text-slate-900">{item.title}</h4>
                    <p className="mt-2 text-slate-600 leading-relaxed">{item.desc}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
