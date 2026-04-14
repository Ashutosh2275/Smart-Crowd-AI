import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Map, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';
import { useCrowdData } from '../context/CrowdContext';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: ShieldCheck,     label: 'Admin',     href: '/admin'     }, 
  { icon: Map,             label: 'Navigation',href: '/navigation'},
];

export function MobileNav() {
  const { alerts } = useCrowdData();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[84px] bg-[rgba(5,5,10,0.92)] backdrop-blur-2xl border-t border-white/10 z-50 flex items-center justify-around px-2 shadow-[0_-20px_40px_rgba(0,0,0,0.6)] pb-safe-bottom">
      
      {/* Top highlight line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

      {menuItems.map((item) => {
        const hasAlerts = item.href === '/admin' && alerts.length > 0;

        return (
          <NavLink
            key={item.label}
            to={item.href}
            className={({ isActive }) => cn(
              "relative flex flex-col items-center justify-center p-2 rounded-2xl transition-all w-[30%] h-16 group",
              isActive 
                 ? "text-primary border border-primary/20 bg-primary/10" 
                 : "text-textMuted border border-transparent hover:text-white"
            )}
           >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div 
                    layoutId="mobile-active-glow"
                    className="absolute -top-[1px] inset-x-4 h-[2px] bg-primary rounded-b-full shadow-[0_2px_10px_rgba(99,102,241,0.8)]"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}
                
                <div className="relative">
                  <item.icon className={cn(
                    "w-5 h-5 mb-1.5 transition-transform",
                    isActive ? "scale-110 drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]" : "group-hover:scale-110"
                  )} />
                  
                  {/* Notification Badge */}
                  {hasAlerts && (
                    <div className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-red-500 border-2 border-[#09090d] text-white text-[8px] font-black flex items-center justify-center shadow-[0_0_10px_rgba(239,68,68,0.8)]">
                      {alerts.length > 9 ? '9+' : alerts.length}
                    </div>
                  )}
                </div>

                <span className="text-[9px] uppercase font-black tracking-[0.16em] leading-none">
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
