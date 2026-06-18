import { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, ArrowRight } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: LoginProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Use env variable or fallback
    const correctPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'CadlinkAdmin1005';
    
    if (password === correctPassword) {
      setError(false);
      onLogin();
    } else {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="glass-card rounded-3xl p-8 sm:p-12 w-full max-w-md relative overflow-hidden"
      >
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-cadlink-600" />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">CAD Link Admin</h1>
          <p className="text-slate-500 font-medium">Enter your password to access the dashboard.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin Password"
              className={`w-full bg-white border ${error ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-cadlink-500 focus:ring-cadlink-500'} rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-1 transition-colors shadow-sm`}
              autoFocus
            />
            {error && <p className="text-red-500 text-sm mt-2 font-medium">Incorrect password.</p>}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full bg-cadlink-600 hover:bg-cadlink-700 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-md flex justify-center items-center"
          >
            Access Dashboard <ArrowRight className="w-4 h-4 ml-2" />
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
