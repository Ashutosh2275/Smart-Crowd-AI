import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { Zap, ShieldCheck, Scale, ArrowRight } from 'lucide-react';
import { cn } from '../utils/cn';

const routeConfig = {
  fastest: { icon: Zap, color: 'text-primary', theme: 'border-primary/50' },
  leastCrowded: { icon: ShieldCheck, color: 'text-green-500', theme: 'border-green-500/50' },
  balanced: { icon: Scale, color: 'text-amber-500', theme: 'border-amber-500/50' }
};

export function RouteComparison({ routes, activeRouteIndex = 0, onSelectRoute }) {
  if (!routes || routes.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="grid grid-cols-1 md:grid-cols-3 gap-6"
    >
      {routes.map((route, idx) => {
        const isActive = activeRouteIndex === idx;
        const config = routeConfig[route.type] || routeConfig.fastest;
        const Icon = config.icon;
        
        // Emphasize the Balanced route as the algorithmic recommendation
        const isRecommended = route.type === 'balanced';

        return (
          <motion.div 
            key={route.type}
            whileHover={{ y: -4 }}
            className={cn(
              "relative flex flex-col p-6 rounded-2xl border backdrop-blur-md transition-all h-full shadow-lg",
              isActive ? `bg-surface/80 shadow-[0_0_20px_rgba(0,0,0,0.5)] ${config.theme} ring-1 ring-offset-background ring-offset-2 ring-primary/30` : "bg-surface/30 border-border/60 hover:bg-surface/60"
            )}
          >
            {isRecommended && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg z-10 flex items-center gap-1">
                <Scale className="w-3 h-3" /> Recommended
              </div>
            )}
            
            <div className="flex items-center gap-3 mb-6 mt-1">
              <div className={cn("p-2.5 rounded-xl border border-border bg-black/20", config.color)}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white tracking-tight leading-none mb-1">{route.label}</h4>
                <p className="text-[10px] uppercase font-bold text-textMuted tracking-wider">{route.distance}m Traverse</p>
              </div>
            </div>

            <div className="space-y-5 mb-8 flex-1">
              {/* Estimated Time Visual Bar */}
              <div>
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-textMuted mb-2">
                  <span>Est Time</span>
                  <span className="text-white font-black">{route.estimatedTime}m</span>
                </div>
                <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-border/30">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((route.estimatedTime / 25) * 100, 100)}%` }}
                    className={cn("h-full rounded-full transition-all duration-1000", route.estimatedTime > 15 ? 'bg-red-500' : route.estimatedTime > 8 ? 'bg-amber-500' : 'bg-green-500')}
                  />
                </div>
              </div>

              {/* Exposure Visual Bar */}
              <div>
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-textMuted mb-2">
                  <span>Avg Exposure</span>
                  <span className="text-white font-black">{route.crowdLevel}%</span>
                </div>
                <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-border/30">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(route.crowdLevel, 100)}%` }}
                    className={cn("h-full rounded-full transition-all duration-1000", route.crowdLevel > 60 ? 'bg-red-500' : route.crowdLevel > 40 ? 'bg-amber-500' : 'bg-green-500')}
                  />
                </div>
              </div>
            </div>

            <button
               onClick={() => onSelectRoute(idx)}
               className={cn(
                 "w-full py-3 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 flex items-center justify-center gap-2",
                 isActive 
                  ? "bg-primary text-white shadow-md shadow-primary/20" 
                  : "bg-black/20 border border-border hover:border-textMuted text-textMuted hover:text-white"
               )}
            >
               {isActive ? 'Active Route' : 'Verify & Select'} 
               {isActive && <ArrowRight className="w-4 h-4" />}
            </button>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

RouteComparison.propTypes = {
  routes: PropTypes.arrayOf(PropTypes.shape({
    type: PropTypes.oneOf(['fastest', 'leastCrowded', 'balanced']).isRequired,
    label: PropTypes.string.isRequired,
    distance: PropTypes.number.isRequired,
    estimatedTime: PropTypes.number.isRequired,
    crowdLevel: PropTypes.number.isRequired,
  })).isRequired,
  activeRouteIndex: PropTypes.number,
  onSelectRoute: PropTypes.func.isRequired,
};
