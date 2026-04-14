import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Map, ShieldCheck, Rocket, Cpu, Wifi, WifiOff, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';
import { useCrowdData } from '../context/CrowdContext';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard',  href: '/dashboard',  desc: 'Live overview'      },
  { icon: Map,             label: 'Navigation', href: '/navigation', desc: 'Route calculator'   },
  { icon: ShieldCheck,     label: 'Admin',      href: '/admin',      desc: 'Control panel'      },
];

export function Sidebar() {
  const { isConnected, zones, alerts } = useCrowdData();
  const criticalZones = zones.filter(z => z.density >= 85).length;
  const totalZones    = zones.length;

  return (
    <>
      {/* ── DESKTOP SIDEBAR ──────────────────────────────────── */}
      <aside className="hidden md:flex flex-col h-screen w-[17rem] relative z-50 border-r border-white/6 bg-[rgba(8,8,14,0.85)] backdrop-blur-2xl shrink-0">

        {/* Top inner highlight */}
        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent pointer-events-none" />

        {/* Brand */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/6">
          <div className="relative">
            <div className="bg-primary/15 p-2.5 rounded-xl border border-primary/30 hero-glow">
              <Rocket className="w-5 h-5 text-primary" />
            </div>
            {/* Live indicator */}
            <div className={cn(
              'absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#08080e]',
              isConnected ? 'bg-emerald-400 status-dot-live' : 'bg-amber-400 status-dot-warn'
            )} />
          </div>
          <div>
            <span className="text-[14px] font-black uppercase tracking-[0.22em] text-white block">
              SmartCrowd
            </span>
            <span className="text-[9px] font-bold text-textMuted uppercase tracking-[0.18em]">
              AI Command Platform
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto styled-scrollbar">
          <p className="text-[9px] font-black text-textMuted uppercase tracking-[0.26em] pl-3 mb-4 mt-2">
            Core Framework
          </p>

          {menuItems.map(item => (
            <NavLink
              key={item.label}
              to={item.href}
              className={({ isActive }) => cn(
                'group relative flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200',
                isActive
                  ? 'bg-primary/15 border border-primary/30 text-white shadow-[0_0_20px_-6px_rgba(99,102,241,0.5)]'
                  : 'border border-transparent text-textMuted hover:bg-white/4 hover:border-white/8 hover:text-white'
              )}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/25"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  {/* Left glow bar */}
                  {isActive && (
                    <div className="absolute left-0 inset-y-3 w-0.5 bg-primary rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                  )}
                  <item.icon className={cn(
                    'w-4.5 h-4.5 relative z-10 transition-transform',
                    isActive ? 'text-primary' : 'group-hover:scale-110'
                  )} style={{ width: '18px', height: '18px' }} />
                  <div className="relative z-10">
                    <span className="text-[11px] font-black uppercase tracking-[0.18em] block leading-none">
                      {item.label}
                    </span>
                    <span className="text-[9px] text-textMuted font-medium mt-0.5 block">
                      {item.desc}
                    </span>
                  </div>
                  {/* Alert badge for admin */}
                  {item.href === '/admin' && alerts.length > 0 && (
                    <div className="relative z-10 ml-auto w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center shadow-glow-red">
                      {alerts.length > 9 ? '9+' : alerts.length}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* System vitals */}
        <div className="p-4 border-t border-white/6">
          <div className="bg-black/30 rounded-xl border border-white/6 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-textMuted flex items-center gap-1.5">
                <Cpu className="w-3 h-3" /> System Vitals
              </span>
              <div className="flex items-center gap-1.5">
                {isConnected
                  ? <Wifi className="w-3 h-3 text-emerald-400" />
                  : <WifiOff className="w-3 h-3 text-amber-400" />}
                <span className={cn(
                  'text-[9px] font-black uppercase tracking-widest',
                  isConnected ? 'text-emerald-400' : 'text-amber-400'
                )}>
                  {isConnected ? 'Live' : 'Demo'}
                </span>
              </div>
            </div>

            {/* Zone saturation mini bar */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] font-bold text-textMuted uppercase tracking-wider">
                  Zone Coverage
                </span>
                <span className="text-[9px] font-black text-white">
                  {totalZones > 0 ? Math.round(((totalZones - criticalZones) / totalZones) * 100) : 100}% Stable
                </span>
              </div>
              <div className="w-full h-1 bg-white/6 rounded-full overflow-hidden">
                <motion.div
                  className={cn('h-full rounded-full', criticalZones > 3 ? 'bg-red-400' : 'bg-emerald-400')}
                  initial={{ width: 0 }}
                  animate={{ width: totalZones > 0 ? `${((totalZones - criticalZones) / totalZones) * 100}%` : '100%' }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* Active alerts count */}
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-textMuted uppercase tracking-wider flex items-center gap-1">
                <Activity className="w-2.5 h-2.5" /> Alerts Active
              </span>
              <span className={cn(
                'text-[10px] font-black',
                alerts.length === 0 ? 'text-emerald-400' : alerts.length > 2 ? 'text-red-400' : 'text-amber-400'
              )}>
                {alerts.length === 0 ? 'None' : alerts.length}
              </span>
            </div>

            {/* Version */}
            <div className="pt-2 border-t border-white/6 flex items-center justify-between">
              <span className="text-[8px] font-bold text-textMuted/50 uppercase tracking-widest">
                v2.4.0 · Build 241
              </span>
              <span className="text-[8px] font-bold text-primary/60 tracking-widest">
                © 2026
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
