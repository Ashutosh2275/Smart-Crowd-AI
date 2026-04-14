import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, AlertTriangle, Rocket, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/Toast';
import { cn } from '../utils/cn';

export function AdminLogin() {
  const { signIn, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname ?? '/admin';

  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [error,       setError]       = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess,   setIsSuccess]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await signIn(email, password);
      setIsSuccess(true);
      toast.success({ title: 'Access Granted', message: 'Admin terminal unlocked.' });
      setTimeout(() => navigate(from, { replace: true }), 1000);
    } catch (err) {
      setError(err.message);
      toast.error({ title: 'Sign-in failed', message: err.message ?? 'Unable to authenticate.' });
      setIsSubmitting(false);
    }
  };

  const fillDemo = () => {
    setEmail('admin@smartcrowd.ai');
    setPassword('admin123');
    setError(null);
  };

  return (
    <div className="min-h-screen mesh-gradient flex items-center justify-center p-4 relative overflow-hidden bg-background">
      
      {/* Background matrix/scanlines */}
      <div className="absolute inset-0 tech-grid opacity-20 pointer-events-none" />
      <div className="absolute inset-0 scanline-sweep opacity-50" />
      
      {/* Glow orb */}
      <div className="absolute w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none float-anim" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md z-10"
      >
        <div className="shell-card rounded-[2rem] overflow-hidden backdrop-blur-3xl border-t border-l border-white/10 card-glow">
          
          {/* Top data stream line */}
          <div className="h-0.5 w-full bg-black relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-full data-border" />
          </div>

          <div className="px-8 pt-10 pb-6 border-b border-white/5 text-center relative overflow-hidden">
            {/* Inner background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-16 bg-primary/20 blur-2xl rounded-full" />
            
            <div className="relative">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                  <Rocket className="w-6 h-6 text-primary" />
                </div>
              </div>
              <h2 className="text-xl font-black tracking-[0.24em] text-white uppercase mb-2">SmartCrowd</h2>
              <div className="flex items-center justify-center gap-1.5 text-red-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-widest">Restricted Gateway</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-8 pt-8 pb-10 space-y-6 relative">

            {/* Success Overlay Animation */}
            <AnimatePresence>
              {isSuccess && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 z-50 bg-[#08080c]/90 backdrop-blur-sm flex flex-col items-center justify-center border-t border-primary/30"
                >
                  <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, type: "spring" }}
                    className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(16,185,129,0.4)]"
                  >
                    <ShieldCheck className="w-8 h-8 text-emerald-400" />
                  </motion.div>
                  <p className="text-emerald-400 text-xs font-black uppercase tracking-widest">Access Granted</p>
                  <p className="text-textMuted text-[10px] mt-2 font-bold uppercase tracking-wider">Redirecting to Terminal...</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error banner */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-start gap-3 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl mb-6">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] font-bold text-red-300 leading-relaxed uppercase tracking-wider mt-px">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Field */}
            <div className="space-y-2 group">
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-textMuted flex items-center justify-between">
                Admin Email Identify
                <div className={cn("w-1 h-1 rounded-full transition-colors", email ? "bg-primary" : "bg-white/20")} />
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className={cn("w-4 h-4 transition-colors", email ? "text-primary" : "text-textMuted/50")} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="sysadmin@smartcrowd.ai"
                  required
                  autoComplete="email"
                  className={cn(
                    "block w-full pl-11 pr-4 py-3.5 bg-black/40 border rounded-xl text-sm text-white font-medium placeholder-textMuted/30",
                    "focus:outline-none focus:ring-1 transition-all",
                    email ? "border-primary/40 ring-primary/20" : "border-white/10 hover:border-white/20 focus:border-primary/50 focus:ring-primary/20",
                    "autofill:!bg-black/40 font-mono"
                  )}
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2 group">
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-textMuted flex items-center justify-between">
                Security Key
                <div className={cn("w-1 h-1 rounded-full transition-colors", password ? "bg-primary" : "bg-white/20")} />
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className={cn("w-4 h-4 transition-colors", password ? "text-primary" : "text-textMuted/50")} />
                </div>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  autoComplete="current-password"
                  className={cn(
                    "block w-full pl-11 pr-12 py-3.5 bg-black/40 border rounded-xl text-sm text-white tracking-widest placeholder-textMuted/30",
                    "focus:outline-none focus:ring-1 transition-all",
                    password ? "border-primary/40 ring-primary/20" : "border-white/10 hover:border-white/20 focus:border-primary/50 focus:ring-primary/20",
                    "font-mono"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-textMuted/50 hover:text-white transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isSubmitting || loading || isSuccess}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2.5 py-4 mt-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-[0_0_30px_rgba(99,102,241,0.3)] border border-primary/50"
            >
              {isSubmitting
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Authenticating...</>
                : <><ShieldCheck className="w-4 h-4" /> Initialize Uplink</>
              }
            </motion.button>

            {/* Demo Injector */}
            <div className="mt-8 pt-6 border-t border-white/5 text-center">
              <p className="text-[9px] font-bold text-textMuted uppercase tracking-widest mb-3">Diagnostic Bypass Available</p>
              <button
                type="button"
                onClick={fillDemo}
                className="text-[9px] font-black text-cyan-400 hover:text-white uppercase tracking-[0.2em] transition-all border border-cyan-400/20 hover:border-cyan-400/50 bg-cyan-400/5 hover:bg-cyan-400/10 px-4 py-2 rounded-lg"
              >
                Inject Demo Credentials
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-[9px] text-textMuted/30 mt-6 uppercase tracking-[0.24em] font-black">
          Smart Crowd AI System · Unauthorized Access Prohibited
        </p>
      </motion.div>
    </div>
  );
}
