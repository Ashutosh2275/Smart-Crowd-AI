import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ChevronRight, ShieldAlert, AlertTriangle, Info, MapPin } from 'lucide-react';
import { useCrowdData } from '../context/CrowdContext';
import { cn } from '../utils/cn';

const alertConfig = {
  info: { 
    icon: Info, 
    badge: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    label: 'INFO'
  },
  warning: { 
    icon: AlertTriangle, 
    badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    label: 'WARNING'
  },
  critical: { 
    icon: ShieldAlert, 
    badge: 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse',
    label: 'CRITICAL'
  }
};

export function LiveAlertsFeed() {
  const { alerts, zones } = useCrowdData();

  // Utility to lookup user-friendly zone names from contextual IDs
  const getZoneName = (zoneId) => {
    if (!zoneId) return 'System Level';
    const matched = zones.find(z => z.id === zoneId);
    return matched ? matched.name : 'Unknown Zone';
  };

  // Enforce chronological sorting (newest first) and map exactly 5 maximum
  const recentAlerts = useMemo(() => {
    return [...alerts]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  }, [alerts]);

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex-1 overflow-y-auto pr-2 styled-scrollbar space-y-3 pb-2">
        <AnimatePresence initial={false}>
          {recentAlerts.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="py-8 text-center text-textMuted text-sm"
            >
              No active alerts logged. System is stable.
            </motion.div>
          ) : (
            recentAlerts.map((alert) => {
              const config = alertConfig[alert.type] || alertConfig.info;
              const Icon = config.icon;
              const timeString = alert.timestamp 
                ? formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true }) 
                : 'just now';

              return (
                <motion.div
                  key={alert.id}
                  layout
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="group flex flex-col p-3 rounded-lg border border-border/50 bg-surface/40 hover:bg-surface/80 transition-colors backdrop-blur-sm relative overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-2">
                    {/* Alert Type Badge */}
                    <div className={cn("flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-[10px] font-black tracking-widest", config.badge)}>
                      <Icon className="w-3 h-3" />
                      {config.label}
                    </div>
                    
                    {/* Normalized Timestamp */}
                    <span className="text-[10px] sm:text-xs font-semibold text-textMuted tracking-tight">
                      {timeString}
                    </span>
                  </div>

                  {/* Primary Alert Context */}
                  <p className="text-sm font-medium text-white mb-2 pr-4 leading-snug">
                    {alert.message}
                  </p>

                  {/* Zone Tag Mapping */}
                  <div className="flex items-center gap-1.5 text-xs text-textMuted/80 font-medium">
                    <MapPin className="w-3 h-3 text-primary/70" />
                    {getZoneName(alert.zone)}
                  </div>

                  {/* Subtle Interactive Effect */}
                  <div className="absolute top-0 right-0 h-full w-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-b from-primary/50 to-primary" />
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      <div className="pt-4 border-t border-border mt-auto">
        <motion.button 
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full flex items-center justify-between p-3 rounded-lg bg-surface hover:bg-surfaceHover border border-border transition-colors group"
        >
          <span className="text-sm font-semibold text-white">View All Event Logs</span>
          <div className="p-1 rounded-md bg-white/5 group-hover:bg-primary/20 transition-colors">
            <ChevronRight className="w-4 h-4 text-textMuted group-hover:text-primary transition-colors" />
          </div>
        </motion.button>
      </div>
    </div>
  );
}
