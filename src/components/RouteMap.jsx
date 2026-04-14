import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, Users, Navigation as NavIcon, Flag, ArrowDown } from 'lucide-react';
import { useCrowdData } from '../context/CrowdContext';
import { cn } from '../utils/cn';

const gridLayout = [
  'z1', 'z10', 'z5',
  'z4', null,  'z3',
  'z6', null,  'z7',
  'z8', 'z2',  'z9'
];

// Mapped coordinates corresponding to 3x4 grid centers (Percentage based 100x100 space)
const zoneCoords = {
  z1: { x: 16.6, y: 12.5 }, z10: { x: 50, y: 12.5 }, z5: { x: 83.3, y: 12.5 },
  z4: { x: 16.6, y: 37.5 },                          z3: { x: 83.3, y: 37.5 },
  z6: { x: 16.6, y: 62.5 },                          z7: { x: 83.3, y: 62.5 },
  z8: { x: 16.6, y: 87.5 }, z2: { x: 50, y: 87.5 },  z9: { x: 83.3, y: 87.5 },
};

const getColorClass = (density) => {
  if (density < 50) return 'bg-green-500/20 text-green-400 border-green-500/40 text-green-300';
  if (density <= 75) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40 text-yellow-300';
  if (density <= 90) return 'bg-orange-500/20 text-orange-400 border-orange-500/40 text-orange-300';
  return 'bg-red-500/20 text-red-500 border-red-500/40 text-red-300';
};

export function RouteMap({ route = null }) {
  const { zones } = useCrowdData();

  if (!route || !route.path) {
    return (
      <div className="flex flex-col items-center justify-center p-10 h-full border border-dashed border-border/50 rounded-2xl bg-surface/20">
        <NavIcon className="w-12 h-12 text-primary opacity-50 mb-3" />
        <p className="text-textMuted font-medium text-center">Select an origin and destination to calculate a visual mapping route.</p>
      </div>
    );
  }

  const pathZoneIds = route.path;
  const isCongested = route.crowdLevel > 60;
  const routeKey = pathZoneIds.join('>');
  
  // Construct SVG Polyline Points dynamically
  const svgPoints = pathZoneIds.map(id => `${zoneCoords[id].x},${zoneCoords[id].y}`).join(' ');

  const getZone = (id) => zones.find((z) => z.id === id);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-[400px]">
      
      {/* Left Interface: Spatial Mapping Matrix Overlay */}
      <div className="lg:col-span-2 relative p-4 bg-surface/30 rounded-2xl border border-border shadow-inner flex flex-col">
        <div className="text-xs text-textMuted uppercase font-bold tracking-widest mb-4">Tactical Matrix Overlay</div>
        
        <div className="relative flex-1 grid grid-cols-3 gap-4 min-h-[300px]">
          
          {/* SVG routing overlay using a pseudo 100x100 grid mapping responsive stretch points */}
          <div className="absolute inset-0 z-10 pointer-events-none p-4 pb-0 -mx-4 -mt-4 mb-4">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-[calc(100%-2rem)] h-full ml-4 mt-6">
              <motion.polyline
                key={routeKey}
                points={svgPoints}
                fill="none"
                stroke="#6366f1"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="drop-shadow-[0_0_10px_rgba(99,102,241,0.8)]"
              />
              
              {/* Animated Origin Tracer Pip */}
              <motion.circle 
                cx={zoneCoords[pathZoneIds[0]].x} 
                cy={zoneCoords[pathZoneIds[0]].y} 
                r="3" 
                fill="#ffffff"
                className="drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
              />
            </svg>
          </div>

          {/* Underlay Base Zones Map */}
          {gridLayout.map((zoneId, index) => {
            if (!zoneId) return <div key={`map-empty-${index}`} className="col-span-1 rounded-xl bg-black/10 border border-dashed border-border/20" />;

            const zone = getZone(zoneId);
            if (!zone) return null;

            const isPartOfPath = pathZoneIds.includes(zone.id);
            const isStart = pathZoneIds[0] === zone.id;
            const isDestination = pathZoneIds[pathZoneIds.length - 1] === zone.id;

            return (
              <div
                key={`map-${zone.id}`}
                className={cn(
                  "col-span-1 rounded-xl p-3 flex flex-col justify-center items-center text-center transition-all duration-500 relative z-0",
                  isPartOfPath ? getColorClass(zone.density) : 'bg-surface/5 border border-border/20 opacity-40 grayscale',
                  isStart && 'ring-2 ring-white ring-offset-2 ring-offset-background z-20 shadow-lg',
                  isDestination && 'ring-2 ring-primary ring-offset-2 ring-offset-background z-20 shadow-lg'
                )}
              >
                {isStart && <div className="absolute -top-2 -left-2 bg-white text-black text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg z-20">START</div>}
                {isDestination && <div className="absolute -bottom-2 -right-2 bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg z-20">TARGET</div>}
                
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider line-clamp-2">
                  {zone.name}
                </span>
                {isPartOfPath && (
                  <span className="text-xs sm:text-lg font-black mt-1 opacity-90">{zone.density}%</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Interface: Turn-by-Turn Dynamic Protocol */}
      <div className="lg:col-span-1 flex flex-col bg-surface/50 border border-border rounded-2xl overflow-hidden shadow-lg">
        
        {/* Route Meta Header */}
        <div className="p-5 border-b border-border bg-gradient-to-br from-surface to-background relative overflow-hidden">
           <div className={cn("absolute right-0 top-0 w-32 h-32 blur-3xl -mr-10 -mt-10 rounded-full opacity-30", isCongested ? 'bg-amber-500' : 'bg-primary')} />
           <h3 className="text-sm text-textMuted font-bold uppercase tracking-widest mb-4">Route Protocol</h3>
           
           <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] text-textMuted font-semibold flex items-center gap-1"><Clock className="w-3 h-3" /> Est. Time</span>
                <span className={cn("text-2xl font-black", isCongested ? 'text-amber-500' : 'text-green-500')}>
                  {route.estimatedTime}m
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-textMuted font-semibold flex items-center gap-1"><Users className="w-3 h-3" /> Crowd Exposure</span>
                <span className={cn("text-xl font-bold mt-1 text-white")}>
                  {route.crowdLevel}% Avg
                </span>
              </div>
           </div>
        </div>

        {/* Turn-by-Turn Feed */}
        <div className="flex-1 p-5 overflow-y-auto styled-scrollbar relative">
          <div className="absolute left-[33px] top-6 bottom-6 w-0.5 bg-border/50 z-0" />
          
          <AnimatePresence>
            {pathZoneIds.map((id, index) => {
              const zInfo = getZone(id);
              const isFirst = index === 0;
              const isLast = index === pathZoneIds.length - 1;

              return (
                <motion.div 
                   key={id}
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: index * 0.15 }}
                   className="flex items-start gap-4 mb-6 relative z-10 group"
                >
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 shadow-md transition-transform group-hover:scale-110",
                    isFirst ? 'bg-white border-white text-black' : isLast ? 'bg-primary border-primary text-white' : 'bg-surface border-border text-textMuted'
                  )}>
                    {isFirst ? <MapPin className="w-3.5 h-3.5" /> : isLast ? <Flag className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
                  </div>
                  
                  <div className="pt-1 flex-1 pb-1 border-b border-border/30 group-hover:border-primary/50 transition-colors">
                    <p className={cn("text-xs font-bold uppercase tracking-widest leading-none mb-1 text-primary", isFirst ? 'text-white' : isLast ? 'text-primary' : 'text-textMuted/60')}>
                      {isFirst ? 'Origin' : isLast ? 'Final Destination' : `Waypoint ${index}`}
                    </p>
                    <p className="text-sm font-semibold text-white mb-0.5">{zInfo?.name}</p>
                    {!isFirst && !isLast && (
                      <p className="text-[10px] font-medium text-textMuted">Navigating space at {zInfo?.density}% density</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

RouteMap.propTypes = {
  route: PropTypes.shape({
    path: PropTypes.arrayOf(PropTypes.string).isRequired,
    crowdLevel: PropTypes.number.isRequired,
    estimatedTime: PropTypes.number.isRequired,
    label: PropTypes.string,
    type: PropTypes.string,
    distance: PropTypes.number,
  }),
};
