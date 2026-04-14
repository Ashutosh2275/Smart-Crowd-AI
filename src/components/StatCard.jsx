import { memo, useMemo, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from './Card';
import { Skeleton } from './Skeleton';
import { useCrowdData } from '../context/CrowdContext';
import { cn } from '../utils/cn';

const statusConfig = {
  good: {
    gradient:   'from-emerald-500/15 via-emerald-500/5 to-transparent',
    border:     'border-emerald-500/20',
    glow:       'shadow-[0_0_30px_-8px_rgba(16,185,129,0.35)]',
    iconBg:     'bg-emerald-500/10 border-emerald-500/25',
    iconColor:  'text-emerald-400',
    ring:       'rgba(16,185,129,0.5)',
    dot:        'bg-emerald-400',
  },
  warning: {
    gradient:   'from-amber-500/15 via-amber-500/5 to-transparent',
    border:     'border-amber-500/20',
    glow:       'shadow-[0_0_30px_-8px_rgba(245,158,11,0.35)]',
    iconBg:     'bg-amber-500/10 border-amber-500/25',
    iconColor:  'text-amber-400',
    ring:       'rgba(245,158,11,0.5)',
    dot:        'bg-amber-400',
  },
  critical: {
    gradient:   'from-red-500/15 via-red-500/5 to-transparent',
    border:     'border-red-500/25',
    glow:       'shadow-[0_0_30px_-8px_rgba(239,68,68,0.45)]',
    iconBg:     'bg-red-500/10 border-red-500/25',
    iconColor:  'text-red-400',
    ring:       'rgba(239,68,68,0.6)',
    dot:        'bg-red-400',
  },
  neutral: {
    gradient:   'from-indigo-500/12 via-indigo-500/4 to-transparent',
    border:     'border-indigo-500/15',
    glow:       'shadow-[0_0_30px_-8px_rgba(99,102,241,0.30)]',
    iconBg:     'bg-indigo-500/10 border-indigo-500/20',
    iconColor:  'text-indigo-400',
    ring:       'rgba(99,102,241,0.5)',
    dot:        'bg-indigo-400',
  },
};

/* ── Animated counter hook ────────────────────────────────────── */
function useCountUp(target, duration = 900) {
  const [display, setDisplay] = useState(null);
  const raf = useRef(null);
  const start = useRef(null);
  const prev = useRef(null);

  useEffect(() => {
    // Only animate numeric values
    const numeric = parseFloat(String(target).replace(/[^0-9.]/g, ''));
    if (isNaN(numeric)) { setDisplay(target); return; }
    if (prev.current === null) { prev.current = 0; }

    const from = prev.current;
    prev.current = numeric;
    start.current = null;

    const suffix = String(target).replace(/[0-9.,]/g, '');
    const useLocale = String(target).includes(',');

    const tick = (ts) => {
      if (!start.current) start.current = ts;
      const progress = Math.min((ts - start.current) / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (numeric - from) * eased);
      setDisplay(useLocale ? current.toLocaleString() + suffix : current + suffix);
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
    return () => raf.current && cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return display ?? target;
}

/* ── Skeleton ─────────────────────────────────────────────────── */
const StatCardSkeleton = memo(function StatCardSkeleton({ hasTrend }) {
  return (
    <div className="glass rounded-2xl p-5 shadow-card h-full border border-border/50">
      <div className="flex justify-between items-start">
        <Skeleton className="w-11 h-11 rounded-xl" />
        {hasTrend && <Skeleton className="w-20 h-6 rounded-full" />}
      </div>
      <div className="space-y-2.5 pt-4">
        <Skeleton className="w-3/5 h-3" />
        <Skeleton className="w-2/5 h-9" />
      </div>
    </div>
  );
});

StatCardSkeleton.propTypes = { hasTrend: PropTypes.bool };

/* ── Main StatCard ────────────────────────────────────────────── */
export const StatCard = memo(function StatCard({
  title,
  value,
  trend,
  icon: Icon,
  status = 'neutral',
  className = '',
}) {
  const { isLoading } = useCrowdData();
  const config = useMemo(() => statusConfig[status] ?? statusConfig.neutral, [status]);
  const animatedValue = useCountUp(value);

  const trendDisplay = useMemo(() => {
    if (!trend) return null;
    const isUp   = trend.direction === 'up';
    const isDown = trend.direction === 'down';
    return {
      Icon:  isUp ? ArrowUpRight : isDown ? ArrowDownRight : Minus,
      color: isUp
        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
        : isDown
          ? 'text-red-400 bg-red-500/10 border-red-500/20'
          : 'text-textMuted bg-white/5 border-white/10',
    };
  }, [trend]);

  if (isLoading) return <StatCardSkeleton hasTrend={!!trend} />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0  }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="h-full"
    >
      <div className={cn(
        `bg-gradient-to-br ${config.gradient}`,
        `border ${config.border}`,
        config.glow,
        'rounded-2xl p-5 h-full relative overflow-hidden transition-all duration-300',
        'hover:scale-[1.02] hover:shadow-card-hover cursor-default',
        className
      )}>
        {/* Inner highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent pointer-events-none" />

        {/* Status ring pulse (critical only) */}
        {status === 'critical' && (
          <div
            className="absolute top-3 right-3 w-2 h-2 rounded-full"
            style={{ background: config.ring, animation: 'criticalPulse 0.9s ease-in-out infinite' }}
          />
        )}

        {/* Top row: icon + trend */}
        <div className="flex justify-between items-start mb-5">
          {Icon && (
            <div className={cn('p-2.5 rounded-xl border', config.iconBg, config.iconColor)}>
              <Icon className="w-5 h-5" />
            </div>
          )}
          {trendDisplay && (
            <div className={cn(
              'flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full border tracking-widest uppercase',
              trendDisplay.color
            )}>
              <trendDisplay.Icon className="w-3 h-3" />
              <span>{trend.value}</span>
            </div>
          )}
        </div>

        {/* Value + label */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.20em] text-textMuted mb-2">
            {title}
          </p>
          <p className={cn(
            'text-3xl font-black text-white tracking-tight leading-none data-value',
            config.iconColor
          )}>
            {animatedValue}
          </p>
        </div>

        {/* Bottom gradient bar */}
        <div className={cn(
          'absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent to-transparent opacity-60',
          status === 'good'     && 'via-emerald-500',
          status === 'warning'  && 'via-amber-500',
          status === 'critical' && 'via-red-500',
          status === 'neutral'  && 'via-indigo-500',
        )} />
      </div>
    </motion.div>
  );
});

StatCard.propTypes = {
  title:  PropTypes.node.isRequired,
  value:  PropTypes.node.isRequired,
  trend:  PropTypes.shape({
    value:     PropTypes.node.isRequired,
    direction: PropTypes.oneOf(['up', 'down', 'neutral']).isRequired,
  }),
  icon:     PropTypes.elementType,
  status:   PropTypes.oneOf(['good', 'warning', 'critical', 'neutral']),
  className: PropTypes.string,
};
