import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { TrendingUp, Minus, Activity, AlertTriangle } from 'lucide-react';
import { useCrowdData } from '../context/CrowdContext';
import { Skeleton } from './Skeleton';
import { Card } from './Card';
import { cn } from '../utils/cn';

// Tick mark positions for the decorative outer ring
const TICKS = Array.from({ length: 40 }, (_, i) => i);

export function OccupancyGauge({ className = '' }) {
  const { zones, isLoading } = useCrowdData();

  const { totalCapacity, currentOccupancy, percentage } = useMemo(() => {
    let cap = 0;
    let occ = 0;
    zones.forEach(z => {
      cap += z.capacity;
      occ += Math.round(z.capacity * (z.density / 100));
    });
    const pct = cap ? Math.round((occ / cap) * 100) : 0;
    return { totalCapacity: cap, currentOccupancy: occ, percentage: pct };
  }, [zones]);

  if (isLoading) {
    return (
      <Card className={cn('flex flex-col justify-between h-full', className)}>
        <div className="flex justify-between items-start mb-2">
          <Skeleton className="w-1/2 h-4" />
          <Skeleton className="w-16 h-5 rounded-full" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center py-6">
          <Skeleton className="w-52 h-52 rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-4 border-t border-border/50 pt-4 mt-2">
          <Skeleton className="w-full h-9" />
          <Skeleton className="w-full h-9" />
        </div>
      </Card>
    );
  }

  const isCritical = percentage >= 85;
  const isWarning  = percentage >= 60 && percentage < 85;
  const isHealthy  = !isCritical && !isWarning;

  const arcColor   = isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981';
  const glowColor  = isCritical
    ? 'rgba(239,68,68,0.6)'
    : isWarning
      ? 'rgba(245,158,11,0.6)'
      : 'rgba(16,185,129,0.5)';

  const label      = isCritical ? 'Critical' : isWarning ? 'Elevated' : 'Stable';
  const labelClass = isCritical
    ? 'bg-red-500/10 border-red-500/30 text-red-400'
    : isWarning
      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';

  // SVG dimensions
  const cx = 96, cy = 96;
  const outerR = 80;   // tick ring
  const mainR  = 64;   // primary arc
  const innerR = 50;   // secondary ghost arc (target 75%)
  const sw     = 12;   // stroke width
  const circumMain  = 2 * Math.PI * mainR;
  const circumInner = 2 * Math.PI * innerR;
  const targetOffset = circumInner - (0.75 * circumInner); // ghost target at 75%
  const dashOffset   = circumMain - (percentage / 100) * circumMain;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="h-full"
    >
      <Card
        className={cn(
          'flex flex-col justify-between h-full relative overflow-hidden',
          isCritical && 'border-red-500/20',
          isWarning  && 'border-amber-500/15',
          className
        )}
        icon={isCritical ? AlertTriangle : Activity}
        title="Global Saturation"
        headerAction={
          <span className={cn(
            'px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border',
            labelClass
          )}>
            {label}
          </span>
        }
      >
        {/* Critical pulse overlay */}
        {isCritical && (
          <div className="absolute inset-0 bg-red-500/3 pointer-events-none rounded-2xl critical-pulse" />
        )}

        {/* SVG Gauge */}
        <div className="flex-1 flex flex-col items-center justify-center relative py-4">
          <div className="relative flex items-center justify-center">
            <svg className="w-52 h-52 -rotate-90 transform" viewBox="0 0 192 192">
              <defs>
                <filter id="gaugeglow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Outer tick marks */}
              {TICKS.map((i) => {
                const angle = (i / TICKS.length) * 2 * Math.PI;
                const isMajor = i % 5 === 0;
                const tickLen = isMajor ? 7 : 4;
                const r1 = outerR - tickLen;
                const r2 = outerR;
                return (
                  <line
                    key={i}
                    x1={cx + r1 * Math.cos(angle)}
                    y1={cy + r1 * Math.sin(angle)}
                    x2={cx + r2 * Math.cos(angle)}
                    y2={cy + r2 * Math.sin(angle)}
                    stroke={i / TICKS.length < percentage / 100 ? arcColor : '#2a2a3a'}
                    strokeWidth={isMajor ? 2 : 1}
                    strokeLinecap="round"
                    style={{ opacity: isMajor ? 0.9 : 0.5 }}
                  />
                );
              })}

              {/* Background track */}
              <circle
                cx={cx} cy={cy} r={mainR}
                stroke="#1e1e2e" strokeWidth={sw}
                fill="transparent"
              />

              {/* Ghost target arc at 75% */}
              <circle
                cx={cx} cy={cy} r={innerR}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={8}
                fill="transparent"
                strokeDasharray={circumInner}
                strokeDashoffset={0}
                strokeLinecap="round"
              />
              <circle
                cx={cx} cy={cy} r={innerR}
                stroke="rgba(255,255,255,0.12)"
                strokeWidth={8}
                fill="transparent"
                strokeDasharray={circumInner}
                strokeDashoffset={targetOffset}
                strokeLinecap="round"
              />

              {/* Primary progress arc */}
              <motion.circle
                cx={cx} cy={cy} r={mainR}
                stroke={arcColor}
                strokeWidth={sw}
                fill="transparent"
                strokeLinecap="round"
                strokeDasharray={circumMain}
                initial={{ strokeDashoffset: circumMain }}
                animate={{ strokeDashoffset: dashOffset }}
                transition={{ duration: 1.6, ease: 'easeInOut' }}
                filter="url(#gaugeglow)"
                style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }}
              />
            </svg>

            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <motion.span
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1  }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="text-5xl font-black text-white tracking-tighter data-value leading-none"
                style={{ color: arcColor, textShadow: `0 0 20px ${glowColor}` }}
              >
                {percentage}%
              </motion.span>
              <div className="flex items-center gap-1.5 mt-2">
                {isCritical ? (
                  <TrendingUp className="w-3.5 h-3.5 text-red-400" />
                ) : isWarning ? (
                  <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Minus className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span className="text-[10px] uppercase tracking-[0.2em] text-textMuted font-black">
                  Occupancy
                </span>
              </div>
              <span className="text-[9px] text-textMuted/50 mt-1 tracking-widest uppercase">
                Target: 75%
              </span>
            </div>
          </div>
        </div>

        {/* Footer metrics */}
        <div className="grid grid-cols-2 divide-x divide-border/40 border-t border-border/40 pt-4 mt-2">
          <div className="flex flex-col items-center gap-0.5 pr-4">
            <span className="text-sm font-black text-white data-value tracking-wider">
              {currentOccupancy.toLocaleString()}
            </span>
            <span className="text-[9px] uppercase font-black text-textMuted tracking-widest">
              Active Heads
            </span>
          </div>
          <div className="flex flex-col items-center gap-0.5 pl-4">
            <span className="text-sm font-black text-white data-value tracking-wider">
              {totalCapacity.toLocaleString()}
            </span>
            <span className="text-[9px] uppercase font-black text-textMuted tracking-widest">
              Max Capacity
            </span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

OccupancyGauge.propTypes = {
  className: PropTypes.string,
};
