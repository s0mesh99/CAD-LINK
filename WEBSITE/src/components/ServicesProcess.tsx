import { motion } from 'motion/react';
import { Compass, PenTool, LayoutTemplate, ShieldCheck } from 'lucide-react';

export function ServicesSection() {
  const services = [
    {
      title: "Civil Layouts & Drafting",
      desc: "Accurate, construction-ready civil drawings — from general arrangement through final detailing — built to your project's exact standards.",
      features: ["Site Layout Development", "Grading & Drainage Plans", "Roads & Paving Plans", "Underground (UG) Utility Layouts", "Civil General Arrangement (GA) Drawings", "Foundation Layouts", "Substation Civil Layouts", "Trench & Duct Routing"],
      icon: Compass,
      className: "md:col-span-2 lg:col-span-1"
    },
    {
      title: "Structural Modeling & Detailing",
      desc: "Precise 3D structural modeling and fabrication-ready detailing, drafted to the standards used on ADNOC, Aramco, and other Tier-1 O&G EPC projects.",
      features: ["3D Steel & Concrete Modeling", "Fabrication & Erection Detailing", "Piperacks & Trestles", "Equipment Foundations", "Tank Foundations", "Access & Maintenance Platforms", "Structural Shelters"],
      icon: LayoutTemplate,
      className: "md:col-span-2 lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0 shadow-2xl",
      isDark: true
    },
    {
      title: "Advanced CAD Detailing",
      desc: "Drawings and models delivered in the exact software and file format your project requires, shared through cloud platforms for fast remote review and markup.",
      features: ["AutoCAD (DWG)", "MicroStation (DGN)", "Tekla Structures", "SmartPlant 3D (S3D) & AVEVA E3D", "BOM Extraction & As-Built Documentation"],
      icon: PenTool,
      className: "md:col-span-2 lg:col-span-2"
    },
    {
      title: "The Zero-Risk Guarantee",
      desc: "Your first drawing is completed at no cost, against an agreed scope. If it doesn't meet your standard, you owe nothing — no retainer, no contract, no risk.",
      features: ["First Drawing Free", "No Retainer or Long-Term Contract", "24–48 Hour Turnaround"],
      icon: ShieldCheck,
      className: "md:col-span-2 lg:col-span-1 bg-cadlink-50 border-cadlink-200 border-2"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", bounce: 0.4, duration: 0.8 }
    }
  };

  return (
    <section id="services" className="py-24 bg-white relative overflow-hidden">
      {/* Decorative Blob */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cadlink-100/50 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-sm font-bold text-cadlink-600 tracking-widest uppercase mb-3">Core Capabilities</h2>
          <h3 className="text-4xl font-display font-extrabold text-slate-900 tracking-tight sm:text-5xl">Civil & Structural Drafting Support, Ready to Deploy</h3>
          <motion.div 
            initial={{ width: 0 }}
            whileInView={{ width: 80 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.8, type: "spring" }}
            className="h-1.5 bg-cadlink-500 mx-auto mt-6 rounded-full"
          />
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {services.map((svc, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              whileHover={{ 
                y: -10, 
                scale: 1.02,
                boxShadow: svc.isDark ? "0 25px 50px -12px rgba(15, 23, 42, 0.5)" : "0 20px 25px -5px rgba(31, 122, 98, 0.1), 0 8px 10px -6px rgba(31, 122, 98, 0.1)"
              }}
              className={`p-10 rounded-3xl border border-slate-200 shadow-sm transition-all duration-300 ${svc.className || ''} flex flex-col group`}
            >
              <motion.div 
                whileHover={{ rotate: 5, scale: 1.1 }}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 transition-colors ${svc.isDark ? 'bg-white/10 text-white group-hover:bg-white/20' : 'bg-cadlink-100 text-cadlink-700 group-hover:bg-cadlink-500 group-hover:text-white'}`}
              >
                <svc.icon className="h-7 w-7" />
              </motion.div>
              <h4 className={`text-2xl font-bold mb-4 font-display ${svc.isDark ? 'text-white' : 'text-slate-900'}`}>{svc.title}</h4>
              <p className={`mb-8 font-medium flex-grow leading-relaxed ${svc.isDark ? 'text-slate-300' : 'text-slate-600'}`}>{svc.desc}</p>
              <ul className="space-y-3">
                {svc.features.map((feature, fidx) => (
                  <motion.li 
                    key={fidx} 
                    whileHover={{ x: 5 }}
                    className={`flex items-center text-sm font-bold ${svc.isDark ? 'text-slate-200' : 'text-slate-700'} cursor-default`}
                  >
                    <CheckCircleSmall className={`mr-3 h-4 w-4 ${svc.isDark ? 'text-cadlink-400 group-hover:text-cadlink-300' : 'text-cadlink-600 group-hover:text-cadlink-500'} transition-colors`} />
                    {feature}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>
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
    { title: "Send Your Spec", desc: "Share your drawing standards, reference files, and the scope you need covered." },
    { title: "Free Trial Draft", desc: "I deliver your first drawing at no cost, matching your exact standards and file format." },
    { title: "Review & Refine", desc: "You review the output against your standards. We refine until it's right, then move forward." },
    { title: "Ongoing Support", desc: "Scale up with per-drawing, weekly, or monthly retainer arrangements — whatever fits your project timeline." }
  ];

  return (
    <section id="process" className="py-24 mesh-bg border-y border-slate-200 overflow-hidden relative">
      {/* Decorative Blob */}
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cadlink-200/30 rounded-full blur-[120px] pointer-events-none translate-y-1/2 -translate-x-1/2"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-sm font-bold text-cadlink-600 tracking-widest uppercase mb-3">Process</h2>
          <h3 className="text-3xl font-display font-extrabold text-slate-900 mb-20 tracking-tight sm:text-4xl">Transparent Execution Workflow</h3>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative max-w-5xl mx-auto">
          {/* Animated Connecting Line */}
          <div className="hidden md:block absolute top-[45px] left-[12.5%] right-[12.5%] h-1 bg-slate-200 z-0 overflow-hidden rounded-full">
            <motion.div 
              className="h-full bg-gradient-to-r from-cadlink-400 to-cadlink-600"
              initial={{ width: "0%" }}
              whileInView={{ width: "100%" }}
              viewport={{ once: true }}
              transition={{ duration: 2, ease: "easeInOut", delay: 0.2 }}
            />
          </div>
          
          {steps.map((step, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.2, type: "spring", bounce: 0.4 }}
              className="relative z-10 flex flex-col items-center group cursor-default"
            >
              <motion.div 
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6, type: "spring" }}
                className="w-24 h-24 bg-white text-slate-900 font-display text-2xl font-black flex items-center justify-center rounded-2xl border-4 border-slate-50 mb-6 shadow-xl transition-colors duration-300 group-hover:bg-cadlink-600 group-hover:text-white group-hover:border-cadlink-100"
              >
                0{idx + 1}
              </motion.div>
              <h4 className="font-bold text-xl text-slate-900 mb-3 group-hover:text-cadlink-700 transition-colors">{step.title}</h4>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
