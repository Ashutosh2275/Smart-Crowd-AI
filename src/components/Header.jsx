import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserCircle, Rocket, LogOut, X, Wifi, WifiOff, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationCenter } from './NotificationCenter';
import { useAuth } from '../context/AuthContext';
import { useCrowdData } from '../context/CrowdContext';
import { toast } from './Toast';
import { cn } from '../utils/cn';
import appConfig from '../config/appConfig';

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="hidden lg:flex flex-col items-center gap-0.5">
      <span className="text-[11px] font-black text-white tracking-widest data-value">
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
      <span className="text-[9px] text-textMuted font-bold tracking-wider uppercase">
        {time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
      </span>
    </div>
  );
}

const SEARCH_ROUTES = [
  { label: 'Dashboard',  href: '/dashboard',  desc: 'Command overview'  },
  { label: 'Navigation', href: '/navigation', desc: 'Route calculator'  },
  { label: 'Admin',      href: '/admin',      desc: 'Control panel'     },
];

export function Header() {
  const { user, signOut, isAuthenticated } = useAuth();
  const { isConnected, zones, alerts } = useCrowdData();
  const navigate = useNavigate();

  const [query,    setQuery]    = useState('');
  const [results,  setResults]  = useState([]);
  const [showDrop, setShowDrop] = useState(false);
  const searchRef = useRef(null);

  // Build search results from zones + routes
  useEffect(() => {
    if (!query.trim()) { setResults([]); setShowDrop(false); return; }
    const q = query.toLowerCase();

    const zoneHits = zones
      .filter(z => z.name.toLowerCase().includes(q))
      .slice(0, 4)
      .map(z => ({
        type:  'zone',
        label: z.name,
        desc:  `Density: ${z.density}%`,
        href:  '/dashboard',
        density: z.density,
      }));

    const alertHits = alerts
      .filter(a => a.message.toLowerCase().includes(q))
      .slice(0, 2)
      .map(a => ({
        type:  'alert',
        label: a.message.slice(0, 40),
        desc:  a.type,
        href:  '/dashboard',
      }));

    const routeHits = SEARCH_ROUTES.filter(r =>
      r.label.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q)
    );

    setResults([...routeHits, ...zoneHits, ...alertHits]);
    setShowDrop(true);
  }, [query, zones, alerts]);

  // Close on outside click
  useEffect(() => {
    const handler = e => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDrop(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success({ title: 'Signed out', message: 'You have been logged out successfully.' });
      navigate('/login');
    } catch (err) {
      toast.error({ title: 'Sign-out failed', message: err.message ?? 'Unable to sign out.' });
    }
  };

  const handleSelect = (href) => {
    navigate(href);
    setQuery('');
    setShowDrop(false);
  };

  return (
    <header className="h-16 md:h-[68px] flex items-center justify-between px-4 md:px-6 sticky top-0 z-30 border-b border-white/6 bg-[rgba(5,5,10,0.82)] backdrop-blur-2xl">

      {/* Horizontal top highlight */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent pointer-events-none" />

      {/* Left: Mobile brand + Search */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Mobile branding */}
        <div className="md:hidden flex items-center gap-2 text-primary shrink-0">
          <Rocket className="w-4.5 h-4.5 drop-shadow-sm" style={{ width: 18, height: 18 }} />
          <span className="text-sm font-black tracking-[0.2em] text-white uppercase">SmartCrowd</span>
        </div>

        {/* Global search */}
        <div ref={searchRef} className="hidden md:block relative flex-1 max-w-sm">
          <div className={cn(
            'flex items-center gap-2.5 px-4 py-2.5 bg-white/4 border rounded-xl transition-all',
            showDrop || query
              ? 'border-primary/40 ring-1 ring-primary/20 bg-black/30'
              : 'border-white/8 hover:border-white/15'
          )}>
            <Search className="w-3.5 h-3.5 text-textMuted shrink-0" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search zones, alerts, routes..."
              className="bg-transparent border-none outline-none text-sm w-full text-white placeholder-textMuted/50 font-medium"
            />
            {query && (
              <button onClick={() => { setQuery(''); setShowDrop(false); }} className="text-textMuted hover:text-white transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search dropdown */}
          <AnimatePresence>
            {showDrop && results.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="absolute top-full mt-2 left-0 right-0 bg-[#0d0d18] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 backdrop-blur-2xl"
              >
                {results.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelect(r.href)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0"
                  >
                    <div className={cn(
                      'w-1.5 h-1.5 rounded-full shrink-0',
                      r.type === 'alert'  ? 'bg-red-400'    :
                      r.type === 'zone'   ? (r.density > 85 ? 'bg-red-400' : r.density > 60 ? 'bg-amber-400' : 'bg-emerald-400') :
                      'bg-primary'
                    )} />
                    <div>
                      <p className="text-sm font-bold text-white leading-none">{r.label}</p>
                      <p className="text-[10px] text-textMuted mt-0.5 capitalize">{r.desc}</p>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right: Clock + Status + Notifications + User */}
      <div className="flex items-center gap-3 md:gap-4 shrink-0">
        <LiveClock />

        {/* Connection status */}
        <div className={cn(
          'hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest',
          isConnected
            ? 'border-emerald-500/25 bg-emerald-500/8 text-emerald-400'
            : 'border-amber-500/25 bg-amber-500/8 text-amber-400'
        )}>
          {isConnected
            ? <Wifi className="w-3 h-3" />
            : <WifiOff className="w-3 h-3" />}
          <div className={cn('w-1.5 h-1.5 rounded-full', isConnected ? 'status-dot-live' : 'bg-amber-400')} />
          {isConnected ? 'Live' : 'Demo'}
        </div>

        <div className="h-6 w-px bg-white/8" />

        {appConfig.features.enableNotifications && <NotificationCenter />}

        {/* User badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 p-1.5 rounded-xl shell-card cursor-default">
            <div className={cn(
              'w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm border',
              isAuthenticated
                ? 'bg-primary/20 border-primary/30 text-primary'
                : 'bg-white/6 border-white/10 text-textMuted'
            )}>
              {isAuthenticated
                ? (user?.email?.charAt(0).toUpperCase() ?? 'A')
                : <UserCircle className="w-4 h-4" />}
            </div>
            <div className="hidden sm:block pr-1">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white leading-none">
                {isAuthenticated ? (user?.displayName ?? user?.email?.split('@')[0] ?? 'Admin') : 'Guest'}
              </p>
              <p className="text-[9px] font-bold text-textMuted mt-0.5 tracking-widest uppercase">
                {isAuthenticated ? 'Admin Access' : 'View Only'}
              </p>
            </div>
          </div>

          {isAuthenticated && (
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSignOut}
              title="Sign out"
              className="p-2 rounded-xl text-textMuted hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/25 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
            </motion.button>
          )}
        </div>
      </div>
    </header>
  );
}
