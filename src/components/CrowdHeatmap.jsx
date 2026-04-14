import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCrowdData } from '../context/CrowdContext';
import { cn } from '../utils/cn';

const LEGEND = [
  { label: 'Safe',     color: 'bg-emerald-400', textColor: 'text-emerald-400', range: '< 50%'  },
  { label: 'Moderate', color: 'bg-yellow-400',  textColor: 'text-yellow-400',  range: '50–75%' },
  { label: 'High',     color: 'bg-orange-400',  textColor: 'text-orange-400',  range: '75–90%' },
  { label: 'Critical', color: 'bg-red-500',      textColor: 'text-red-500',     range: '> 90%'  },
];

function getTheme(density) {
  if (density < 50)  return { card: 'bg-emerald-500/8 border-emerald-500/25 text-emerald-300', bar: 'bg-emerald-400', glow: 'rgba(16,185,129,0.5)'  };
  if (density <= 75) return { card: 'bg-yellow-500/8  border-yellow-500/25  text-yellow-300',  bar: 'bg-yellow-400',  glow: 'rgba(234,179,8,0.5)'   };
  if (density <= 90) return { card: 'bg-orange-500/8  border-orange-500/25  text-orange-300',  bar: 'bg-orange-400',  glow: 'rgba(249,115,22,0.5)'  };
  return               { card: 'bg-red-500/8     border-red-500/30     text-red-400',      bar: 'bg-red-500',     glow: 'rgba(239,68,68,0.6)'   };
}

const gridLayout = [
  'z1', 'z10', 'z5',
  'z4', null,  'z3',
  'z6', null,  'z7',
  'z8', 'z2',  'z9',
];

export function CrowdHeatmap() {
  const { zones } = useCrowdData();
  const [activeZone, setActiveZone] = useState(null);

  const getZone = (id) => zones.find(z => z.id === id);

  return (
    <div className="w-full h-full min-h-[400px] flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2.5 flex-1">
        {gridLayout.map((zoneId, index) => {
          if (!zoneId) {
            return (
              <div
                key={`empty-${index}`}
                className="col-span-1 border border-dashed border-white/6 flex flex-col items-center justify-center bg-black/10 rounded-2xl"
              >
                {index === 4 && (
                  <span className="text-textMuted/25 tracking-widest text-[9px] uppercase select-none font-black text-center leading-relaxed px-2">
                    Stadium<br />Pitch
                  </span>
                )}
              </div>
            );
          }

          const zone = getZone(zoneId);
          if (!zone) return null;

          const theme = getTheme(zone.density);
          const currentOccupied = Math.round(zone.capacity * (zone.density / 100));
          const isActive  = activeZone === zone.id;
          const isCritical = zone.density > 90;

          return (
            <motion.button
              layout
              key={zone.id}
              onClick={() => setActiveZone(isActive ? null : zone.id)}
              whileHover={{ scale: 1.04, zIndex: 20 }}
              whileTap={{ scale: 0.97 }}
              className={cn(
                'relative group flex flex-col justify-between p-3 rounded-2xl border backdrop-blur-md',
                'transition-colors duration-300 overflow-hidden shadow-lg outline-none text-left',
                theme.card,
                isActive && 'ring-2 ring-primary/60 ring-offset-1 ring-offset-background',
              )}
              style={isCritical ? {
                boxShadow: `0 0 20px -4px ${theme.glow}, inset 0 0 30px -16px ${theme.glow}`,
              } : undefined}
            >
              {/* Critical shimmer animation */}
              {isCritical && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(239,68,68,0.15) 50%, transparent 100%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 2s linear infinite',
                    }}
                  />
                </div>
              )}

              {/* Tooltip overlay */}
              <AnimatePresence>
                {(isActive) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 bg-surface/95 backdrop-blur-xl z-20 flex flex-col items-center justify-center p-2 text-center rounded-2xl border border-white/10"
                  >
                    <span className="text-[9px] text-textMuted font-black tracking-widest uppercase mb-1">
                      {zone.name}
                    </span>
                    <span className={cn('text-2xl font-black tracking-tight mb-1', theme.card.split(' ')[2])}>
                      {currentOccupied.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-textMuted border-t border-border/50 pt-1 mt-1 w-full text-center">
                      Cap: {zone.capacity.toLocaleString()}
                    </span>
                    <div className="mt-2 w-full bg-black/30 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', theme.bar)}
                        style={{ width: `${zone.density}%` }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Desktop hover overlay */}
              <div className={cn(
                'absolute inset-0 bg-surface/92 backdrop-blur-xl z-10 flex flex-col items-center justify-center p-2 text-center rounded-2xl border border-white/8 transition-opacity duration-200',
                'opacity-0 md:group-hover:opacity-100 pointer-events-none'
              )}>
                <span className={cn('text-2xl font-black', theme.card.split(' ')[2])}>
                  {currentOccupied.toLocaleString()}
                </span>
                <span className="text-[9px] text-textMuted mt-1">
                  / {zone.capacity.toLocaleString()}
                </span>
              </div>

              {/* Content */}
              <div className="flex flex-col gap-1 z-0 relative">
                <span className="text-[10px] font-black uppercase tracking-wide opacity-80 line-clamp-2 leading-tight">
                  {zone.name}
                </span>
                <div className="flex items-baseline gap-0.5 mt-0.5">
                  <span className="text-2xl font-black tracking-tighter">{zone.density}</span>
                  <span className="text-xs font-bold opacity-60">%</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-black/40 h-1.5 rounded-full mt-2 overflow-hidden z-0">
                <motion.div
                  className={cn('h-full rounded-full', theme.bar)}
                  initial={{ width: 0 }}
                  animate={{ width: `${zone.density}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  style={{ boxShadow: `0 0 8px ${theme.glow}` }}
                />
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 pt-1">
        {LEGEND.map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className={cn('w-2 h-2 rounded-full', item.color)} />
            <span className="text-[9px] font-black uppercase tracking-widest text-textMuted">
              {item.label} <span className="opacity-50">{item.range}</span>
            </span>
          </div>
        ))}
      </div>

      <p className="text-center text-[10px] text-textMuted/40 font-bold uppercase tracking-widest md:hidden">
        Tap zones for capacity telemetry
      </p>
    </div>
  );
}
