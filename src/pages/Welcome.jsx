import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { 
  Rocket, Activity, Map, Zap, Users, ShieldCheck, 
  ArrowRight, ChevronRight, LayoutDashboard, Database
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils/cn';

const features = [
  {
    icon: Activity,
    title: "Precision Analytics",
    desc: "Real-time telemetry across stadium-wide density matrices with millisecond resolution.",
    color: "text-primary",
    bg: "bg-primary/10 border-primary/20",
    glow: "group-hover:shadow-[0_0_30px_rgba(99,102,241,0.3)]"
  },
  {
    icon: Map,
    title: "Predictive Routing",
    desc: "DFS-powered pathfinding identifies optimal crowd vectors to minimize friction.",
    color: "text-cyan-400",
    bg: "bg-cyan-400/10 border-cyan-400/20",
    glow: "group-hover:shadow-[0_0_30px_rgba(34,211,238,0.3)]"
  },
  {
    icon: Zap,
    title: "Scenario Simulation",
    desc: "Stress-test infrastructure with entry, exit, and halftime surge patterns.",
    color: "text-amber-400",
    bg: "bg-amber-400/10 border-amber-400/20",
    glow: "group-hover:shadow-[0_0_30px_rgba(245,158,11,0.3)]"
  }
];

// CSS-based particle field
function ParticleField() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 40 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white/20 animate-float"
          style={{
            width: Math.random() * 3 + 1 + 'px',
            height: Math.random() * 3 + 1 + 'px',
            left: Math.random() * 100 + '%',
            top: Math.random() * 100 + '%',
            animationDuration: Math.random() * 10 + 10 + 's',
            animationDelay: Math.random() * -20 + 's',
            opacity: Math.random() * 0.5 + 0.1,
          }}
        />
      ))}
    </div>
  );
}

// Animated stats counter
function LiveCounter({ value, label, suffix = '' }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const startTime = performance.now();
    const animate = (time) => {
      const progress = Math.min((time - startTime) / duration, 1);
      setCount(Math.floor(progress * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);

  return (
    <div className="flex flex-col items-center p-4">
      <span className="text-3xl sm:text-4xl font-black text-white tracking-tighter data-value mb-1">
        {count.toLocaleString()}{suffix}
      </span>
      <span className="text-[9px] uppercase tracking-[0.2em] font-black text-textMuted/70">
        {label}
      </span>
    </div>
  );
}

export function Welcome() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleEnter = () => navigate('/dashboard');

  return (
    <div className="min-h-screen mesh-gradient flex flex-col relative overflow-hidden bg-background">
      
      {/* Background layer */}
      <div className="absolute inset-0 tech-grid opacity-30 mix-blend-overlay pointer-events-none" />
      <ParticleField />
      
      {/* Large glowing orbs */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[150px] pointer-events-none animate-orb-drift" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-400/10 rounded-full blur-[150px] pointer-events-none animate-orb-drift" style={{ animationDelay: '-5s' }} />
      <div className="absolute top-[40%] left-[20%] w-[30%] h-[30%] bg-violet-500/15 rounded-full blur-[120px] pointer-events-none animate-orb-drift" style={{ animationDelay: '-10s' }} />

      {/* Header */}
      <header className="container mx-auto px-6 py-8 flex justify-between items-center z-10 relative">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
          <div className="bg-primary/20 p-2.5 rounded-xl border border-primary/40 hero-glow">
            <Rocket className="w-5 h-5 text-primary" />
          </div>
          <span className="text-lg font-black uppercase tracking-[0.24em] text-white">SmartCrowd</span>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <span className="hidden md:inline text-[9px] font-black text-textMuted uppercase tracking-widest">
                Auth: <span className="text-white ml-1">{user?.email?.split('@')[0]}</span>
              </span>
              <button 
                onClick={handleEnter}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl shell-card text-[10px] font-black uppercase tracking-[0.16em] text-white hover:border-primary/50 transition-all hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]"
              >
                Command Center <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => navigate('/login')}
              className="px-5 py-2.5 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-[0.16em] text-textMuted hover:text-white hover:border-white/30 transition-all flex items-center gap-2"
            >
              Admin Access <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </motion.div>
      </header>

      {/* Hero Content */}
      <main className="flex-1 container mx-auto px-6 flex flex-col items-center justify-center text-center z-10 py-12 relative">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-5xl rounded-[2.5rem] shell-card p-8 sm:p-14 md:p-16 relative overflow-hidden backdrop-blur-3xl card-glow"
        >
          {/* Top border data stream */}
          <div className="absolute top-0 inset-x-0 h-[2px] w-full data-border" />
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-[0.2em] mb-8 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 status-dot-live" />
            Core Nodes Online
          </div>
          
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-black text-white tracking-tighter leading-[0.95] mb-6 drop-shadow-2xl">
            Command the <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-cyan-400 to-violet-500 drop-shadow-sm pb-2 inline-block">
              Crowd Vector
            </span>
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl text-textMuted/90 max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
            The world's most advanced neural density engine for large venue safety, efficiency, and real-time operational oversight.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center relative z-20">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleEnter}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-primary text-white font-black uppercase tracking-[0.16em] text-xs transition-all shadow-[0_0_30px_rgba(99,102,241,0.5)] hover:shadow-[0_0_50px_rgba(99,102,241,0.7)] border border-primary/50"
            >
              <LayoutDashboard className="w-4 h-4" />
              Enter Dashboard
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/navigation')}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl border border-white/10 bg-white/5 text-white font-black uppercase tracking-[0.16em] text-xs hover:border-white/30 hover:bg-white/10 transition-all backdrop-blur-md"
            >
              <Map className="w-4 h-4 text-cyan-400" />
              Route Matrices
            </motion.button>
          </div>

          {/* Live Data Footer within hero */}
          {mounted && (
            <div className="mt-14 pt-8 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-4 divide-x divide-white/5">
              <LiveCounter value={45200} label="Active Telemetry" />
              <LiveCounter value={14} suffix="ms" label="Avg Latency" />
              <LiveCounter value={99.9} suffix="%" label="Node Uptime" />
              <LiveCounter value={12} label="Secured Zones" />
            </div>
          )}
        </motion.div>

        {/* Features Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mt-12 sm:mt-16 stagger-list relative z-20">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -6 }}
              className={cn(
                "p-8 rounded-2xl shell-card text-left group transition-all duration-300 border-white/10 border",
                feature.glow
              )}
            >
              <div className={cn("inline-flex p-3 rounded-xl mb-6 border transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3", feature.bg, feature.color)}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-textMuted leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center text-[9px] font-black uppercase tracking-[0.2em] text-textMuted/50 z-10 relative">
        <div className="flex items-center gap-6 mb-4 md:mb-0">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 mb-0.5" /> Synchronized
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 mb-0.5" /> 12 Active Admins
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/dashboard')} className="hover:text-white transition-colors">Documentation</button>
          <button onClick={() => navigate('/dashboard')} className="hover:text-white transition-colors">Terms of Vector</button>
          <span className="text-primary/40">© 2026 DeepMind Labs</span>
        </div>
      </footer>
    </div>
  );
}
