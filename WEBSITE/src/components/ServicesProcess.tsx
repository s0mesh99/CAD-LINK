import { motion } from 'motion/react';
import { Compass, PenTool, LayoutTemplate, Briefcase, ChevronRight } from 'lucide-react';

export function ServicesSection() {
  const services = [
    {
      title: "Civil Layouts & Drafting",
      desc: "Translating concepts into accurate, actionable site plans and layouts.",
      features: ["Site Layout Development", "Grading & Drainage", "Paving Plans"],
      icon: Compass,
      className: "md:col-span-2 lg:col-span-1"
    },
    {
      title: "Structural Modeling",
      desc: "Rigorous execution of structural arrangements adhering to strict drafting standards.",
      features: ["3D Steel & Concrete Modeling", "Fabrication Detailing", "Piperack & Equipment Foundations"],
      icon: LayoutTemplate,
      className: "md:col-span-2 lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0",
      isDark: true
    },
    {
      title: "Advanced CAD Detailing",
      desc: "High-fidelity 2D/3D visual assets and thorough engineering documentation.",
      features: ["As-Built Updates", "Drawing Coordination", "BOM Extraction"],
      icon: PenTool,
      className: "md:col-span-2 lg:col-span-2"
    },
    {
      title: "B2B Marketing for Engineering",
      desc: "Targeted digital growth solutions specific to engineering consultancies.",
      features: ["Technical SEO", "LinkedIn Lead Gen", "Proposal Assets"],
      icon: Briefcase,
      className: "md:col-span-2 lg:col-span-1 bg-cadlink-50 border-cadlink-200"
    }
  ];

  return (
    <section id="services" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-sm font-bold text-cadlink-600 tracking-widest uppercase mb-3">Core Capabilities</h2>
          <h3 className="text-4xl font-display font-extrabold text-slate-900 tracking-tight sm:text-5xl">Plug-and-Play Design Support</h3>
          <div className="w-20 h-1.5 bg-cadlink-500 mx-auto mt-6 rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((svc, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              whileHover={{ y: -5 }}
              className={`p-10 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 ${svc.className || ''} flex flex-col`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 ${svc.isDark ? 'bg-white/10 text-white' : 'bg-cadlink-50 text-cadlink-600'}`}>
                <svc.icon className="h-7 w-7" />
              </div>
              <h4 className={`text-2xl font-bold mb-4 font-display ${svc.isDark ? 'text-white' : 'text-slate-900'}`}>{svc.title}</h4>
              <p className={`mb-8 font-light flex-grow leading-relaxed ${svc.isDark ? 'text-slate-300' : 'text-slate-600'}`}>{svc.desc}</p>
              <ul className="space-y-3">
                {svc.features.map((feature, fidx) => (
                  <li key={fidx} className={`flex items-center text-sm font-medium ${svc.isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <CheckCircleSmall className={`mr-3 h-4 w-4 ${svc.isDark ? 'text-cadlink-400' : 'text-cadlink-500'}`} />
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CheckCircleSmall({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function ProcessSection() {
  const steps = [
    { title: "Requirement Discussion", desc: "Clarifying exact scope, inputs, and standards." },
    { title: "Project Assessment", desc: "Analyzing complexity and confirming alignment." },
    { title: "Execution", desc: "Rigorous, focused drafting and CAD modeling." },
    { title: "Delivery", desc: "Handover of precise, ready-to-use support assets." }
  ];

  return (
    <section id="workflow" className="py-24 mesh-bg border-y border-slate-200 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
        <h2 className="text-sm font-bold text-cadlink-600 tracking-widest uppercase mb-3">Process</h2>
        <h3 className="text-3xl font-display font-extrabold text-slate-900 mb-20 tracking-tight sm:text-4xl">Transparent Execution Workflow</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative max-w-5xl mx-auto">
          {/* Animated Connecting Line */}
          <div className="hidden md:block absolute top-[45px] left-[12.5%] right-[12.5%] h-0.5 bg-slate-200 z-0 overflow-hidden">
            <motion.div 
              className="h-full bg-cadlink-500"
              initial={{ width: "0%" }}
              whileInView={{ width: "100%" }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
          </div>
          
          {steps.map((step, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.3 }}
              className="relative z-10 flex flex-col items-center group"
            >
              <div className="w-24 h-24 bg-white text-slate-900 font-display text-2xl font-black flex items-center justify-center rounded-2xl border-4 border-slate-50 mb-6 shadow-xl transition-all duration-300 group-hover:bg-cadlink-600 group-hover:text-white group-hover:-translate-y-2 group-hover:shadow-cadlink-500/30">
                0{idx + 1}
              </div>
              <h4 className="font-bold text-xl text-slate-900 mb-3">{step.title}</h4>
              <p className="text-sm text-slate-600 leading-relaxed font-light">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
