import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Navbar */}
      <header 
        className={`fixed w-full z-50 transition-all duration-300 ${
          isScrolled 
            ? 'py-3 glass-panel shadow-sm border-b border-white/20' 
            : 'py-5 bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <a href="#" className="text-2xl font-display font-black tracking-tight text-slate-900 group">
                CAD<span className={`transition-colors duration-300 ${isScrolled ? 'text-cadlink-600' : 'text-cadlink-500'}`}>LINK</span>
                <span className="text-cadlink-500">.</span>
              </a>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8 items-center">
              {['Services', 'Process', 'Portfolio'].map((item) => (
                <a 
                  key={item} 
                  href={`#${item.toLowerCase()}`} 
                  className="text-sm font-semibold text-slate-700 hover:text-cadlink-600 transition-colors"
                >
                  {item}
                </a>
              ))}
              <a 
                href="#contact" 
                className="bg-slate-900 hover:bg-cadlink-600 text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-md hover:shadow-lg"
              >
                Let's Talk
              </a>
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-slate-900 hover:text-cadlink-600 focus:outline-none"
              >
                {isMobileMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden glass-card border-t border-white/40 mt-3"
            >
              <div className="px-4 pt-2 pb-6 space-y-2">
                {['Services', 'Process', 'Portfolio'].map((item) => (
                  <a 
                    key={item} 
                    href={`#${item.toLowerCase()}`} 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-3 rounded-md text-base font-semibold text-slate-800 hover:bg-cadlink-50 hover:text-cadlink-600"
                  >
                    {item}
                  </a>
                ))}
                <a 
                  href="#contact" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block mt-4 text-center bg-cadlink-600 text-white px-4 py-3 rounded-full text-base font-bold"
                >
                  Let's Talk
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-2xl font-display font-black tracking-tight text-white">
            CAD<span className="text-cadlink-500">LINK</span>.
          </div>
          <div className="text-sm font-medium">
            &copy; {new Date().getFullYear()} CAD LINK. Engineering Scalability.
          </div>
        </div>
      </footer>
    </div>
  );
}
