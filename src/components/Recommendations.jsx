import { useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Lightbulb, X, RefreshCw, Navigation2, Clock, Users,
  TrendingDown, MapPin, CheckCircle, AlertTriangle, Zap,
} from 'lucide-react';
import { useCrowdData } from '../context/CrowdContext';
import {
  getZoneVisitRecommendations,
  getAlternativeZones,
  getOptimalRouteProfile,
  getWaitTimeForecast,
} from '../utils/recommendations';
import { cn } from '../utils/cn';

// ── Icon / colour maps for each recommendation type ──────────────────────────
const TYPE_CONFIG = {
  visit_timing: {
    icon: Clock,
    accent: 'from-indigo-500/20 to-indigo-500/5 border-indigo-500/20',
    iconColor: 'text-indigo-400',
    badge: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
    label: 'Best Time to Visit',
  },
  alternative_zone: {
    icon: MapPin,
    accent: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20',
    iconColor: 'text-emerald-400',
    badge: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    label: 'Quieter Alternative',
  },
  route_profile: {
    icon: Zap,
    accent: 'from-violet-500/20 to-violet-500/5 border-violet-500/20',
    iconColor: 'text-violet-400',
    badge: 'bg-violet-500/10 border-violet-500/30 text-violet-400',
    label: 'Route Strategy',
  },
  wait_forecast: {
    icon: TrendingDown,
    accent: 'from-amber-500/20 to-amber-500/5 border-amber-500/20',
    iconColor: 'text-amber-400',
    badge: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    label: 'Queue Forecast',
  },
};

function ScoreBar({ score }) {
  const pct = Math.min(100, Math.max(0, score));
  const color = pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="w-full bg-black/30 rounded-full h-1.5 overflow-hidden mt-2">
      <motion.div
        className={cn('h-full rounded-full', color)}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </div>
  );
}

ScoreBar.propTypes = {
  score: PropTypes.number.isRequired,
};

function RecommendationCard({ rec, onDismiss }) {
  const navigate = useNavigate();
  const config = TYPE_CONFIG[rec.type] || TYPE_CONFIG.visit_timing;
  const Icon = config.icon;

  // Derive the title & subtitle for each recommendation type
  const title = rec.type === 'visit_timing'   ? rec.zoneName
    : rec.type === 'alternative_zone'          ? rec.alternativeZoneName
    : rec.type === 'route_profile'             ? `${rec.preference.charAt(0).toUpperCase() + rec.preference.slice(1)} Mode`
    : rec.queueName;

  const meta = rec.type === 'visit_timing'    ? `Best window: ${rec.bestTimeLabel}`
    : rec.type === 'alternative_zone'          ? `${rec.densitySaving}% less crowded than ${rec.originalZoneName}`
    : rec.type === 'route_profile'             ? `Avg density ${rec.averageDensity}% · ${rec.averageWaitTime} min avg wait`
    : `Best visit in ~${rec.bestVisitWindow} min · wait drops to ${rec.minProjectedWait} min`;

  const handleNavigate = () => navigate('/navigation');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, y: -8 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'relative group flex flex-col gap-3 p-4 rounded-2xl border bg-gradient-to-br card-interactive',
        config.accent
      )}
    >
      {/* Dismiss button */}
      <button
        onClick={() => onDismiss(rec)}
        className="absolute top-3 right-3 p-1 rounded-lg text-textMuted opacity-0 group-hover:opacity-100 hover:text-white hover:bg-surface transition-all"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Header */}
      <div className="flex items-start gap-3 pr-6">
        <div className={cn('p-2.5 rounded-xl bg-black/20 border border-white/5 shrink-0', config.iconColor)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border', config.badge)}>
              {config.label}
            </span>
          </div>
          <h4 className="text-sm font-black text-white mt-1 truncate">{title}</h4>
          <p className="text-[10px] text-textMuted font-medium mt-0.5">{meta}</p>
        </div>
      </div>

      {/* Reasoning */}
      <p className="text-[11px] text-textMuted leading-relaxed border-t border-white/5 pt-3">
        {rec.reasoning}
      </p>

      {/* Score bar */}
      <ScoreBar score={rec.score} />

      {/* Actions */}
      <div className="flex gap-2 mt-1">
        {(rec.type === 'visit_timing' || rec.type === 'alternative_zone') && (
          <button
            onClick={handleNavigate}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white text-[10px] font-black uppercase tracking-widest transition-all"
          >
            <Navigation2 className="w-3 h-3" /> Navigate There
          </button>
        )}
        {rec.type === 'route_profile' && (
          <button
            onClick={handleNavigate}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white text-[10px] font-black uppercase tracking-widest transition-all"
          >
            <Navigation2 className="w-3 h-3" /> Plan Route
          </button>
        )}
        <button
          onClick={() => onDismiss(rec)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/20 hover:bg-black/30 border border-white/5 text-textMuted hover:text-white text-[10px] font-black uppercase tracking-widest transition-all"
        >
          <CheckCircle className="w-3 h-3" /> Got It
        </button>
      </div>
    </motion.div>
  );
}

RecommendationCard.propTypes = {
  rec: PropTypes.shape({
    key: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['visit_timing', 'alternative_zone', 'route_profile', 'wait_forecast']).isRequired,
    reasoning: PropTypes.string.isRequired,
    score: PropTypes.number.isRequired,
    zoneName: PropTypes.string,
    bestTimeLabel: PropTypes.string,
    alternativeZoneName: PropTypes.string,
    originalZoneName: PropTypes.string,
    densitySaving: PropTypes.number,
    preference: PropTypes.string,
    averageDensity: PropTypes.number,
    averageWaitTime: PropTypes.number,
    queueName: PropTypes.string,
    bestVisitWindow: PropTypes.number,
    minProjectedWait: PropTypes.number,
  }).isRequired,
  onDismiss: PropTypes.func.isRequired,
};

// ── Main exported component ───────────────────────────────────────────────────
export function Recommendations() {
  const { zones, queues, isLoading } = useCrowdData();
  const [dismissedKeys, setDismissedKeys] = useState(new Set());
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Build recommendation list from all four engine functions
  const allRecommendations = useMemo(() => {
    if (!zones.length) return [];

    const recs = [];

    // 1. Best time to visit — top 2 highest-density zones only (most actionable)
    const highDensityZones = [...zones].sort((a, b) => b.density - a.density).slice(0, 2);
    highDensityZones.forEach(z => {
      const [top] = getZoneVisitRecommendations(zones, z.id);
      if (top) recs.push({ ...top, key: `visit-${z.id}-${refreshKey}` });
    });

    // 2. Alternatives for the most overcrowded zone
    const mostCrowded = [...zones].sort((a, b) => b.density - a.density)[0];
    if (mostCrowded && mostCrowded.density > 60) {
      const alts = getAlternativeZones(mostCrowded.id, zones, 1);
      alts.forEach(a => recs.push({ ...a, key: `alt-${a.alternativeZoneId}-${refreshKey}` }));
    }

    // 3. Route profile suggestion
    const profile = getOptimalRouteProfile(zones, queues, 'balanced');
    if (profile) recs.push({ ...profile, key: `route-${refreshKey}` });

    // 4. Queue forecast — worst queue only
    if (queues.length) {
      const [worst] = [...queues].sort((a, b) => b.waitTime - a.waitTime);
      const [forecast] = getWaitTimeForecast([worst], zones);
      if (forecast) recs.push({ ...forecast, key: `wait-${worst.id}-${refreshKey}` });
    }

    return recs;
  }, [zones, queues, refreshKey]);

  const visible = allRecommendations.filter(r => !dismissedKeys.has(r.key));

  const handleDismiss = useCallback((rec) => {
    setDismissedKeys(prev => new Set([...prev, rec.key]));
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setDismissedKeys(new Set());
    setTimeout(() => {
      setRefreshKey(k => k + 1);
      setIsRefreshing(false);
    }, 600);
  };

  if (isLoading) return null;

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
            <Lightbulb className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-widest">AI Recommendations</h2>
            <p className="text-[10px] text-textMuted font-medium mt-0.5">{visible.length} active suggestions based on live conditions</p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface hover:bg-surfaceHover border border-border text-textMuted hover:text-white text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Cards grid */}
      {visible.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-10 rounded-2xl border border-dashed border-border/40 text-center"
        >
          <CheckCircle className="w-10 h-10 text-emerald-500/50 mb-3" />
          <p className="text-sm font-black text-white tracking-widest uppercase">All Clear</p>
          <p className="text-[11px] text-textMuted mt-1">All recommendations dismissed. Refresh to regenerate.</p>
        </motion.div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {visible.map(rec => (
              <RecommendationCard key={rec.key} rec={rec} onDismiss={handleDismiss} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
