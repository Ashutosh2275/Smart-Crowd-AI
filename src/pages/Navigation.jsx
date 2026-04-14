import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, Navigation as NavIcon, Target } from 'lucide-react';
import { useCrowdData } from '../context/CrowdContext';
import { Card } from '../components/Card';
import { SearchBar } from '../components/SearchBar';
import { calculateRoutes } from '../utils/routeCalculator';
import { RouteMap } from '../components/RouteMap';
import { RouteComparison } from '../components/RouteComparison';
import { cn } from '../utils/cn';

export function Navigation() {
  const { zones } = useCrowdData();
  const [startZone, setStartZone] = useState('');
  const [endZone, setEndZone] = useState('');
  const [calculating, setCalculating] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [activeRouteIndex, setActiveRouteIndex] = useState(0);

  const handleRouteCalc = (e) => {
    e.preventDefault();
    if (!startZone || !endZone) return;
    
    setCalculating(true);
    setRoutes([]);
    
    setTimeout(() => {
      const options = calculateRoutes(startZone, endZone, zones);
      setRoutes(options);
      setActiveRouteIndex(options.findIndex(o => o.type === 'balanced')); 
      setCalculating(false);
    }, 1500); // slightly longer for dramatic effect
  };

  const activeRoute = routes[activeRouteIndex];

  return (
    <div className="space-y-6 pb-12">
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-black tracking-tighter text-white mb-2 flex items-center gap-3">
          Routing Matrix <NavIcon className="w-8 h-8 text-primary" />
        </h1>
        <p className="text-textMuted text-sm font-medium tracking-wide">
          Dynamically calculate traversal paths balancing density capacity and friction limits.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Input Form */}
        <div className="lg:col-span-1">
          <Card className="h-full" glowing={calculating} noPadding>
            <div className="p-6 border-b border-white/5">
              <h3 className="text-[13px] font-black uppercase tracking-[0.18em] text-white">Compute Vector</h3>
            </div>
            
            <form onSubmit={handleRouteCalc} className="p-6 space-y-6 h-[calc(100%-65px)] flex flex-col">
              
              <div className="space-y-2.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-textMuted flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-textMuted/50" /> Origin Node
                </label>
                <SearchBar 
                  value={startZone} 
                  onSelect={setStartZone} 
                  placeholder="Select locus..." 
                />
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 pl-0.5">
                  <Target className="w-3.5 h-3.5" /> Target Destination
                </label>
                <SearchBar 
                  value={endZone} 
                  onSelect={setEndZone} 
                  placeholder="Select trajectory..." 
                />
              </div>

              <div className="mt-auto pt-6">
                <button 
                  type="submit"
                  disabled={!startZone || !endZone || calculating}
                  className={cn(
                    "w-full flex items-center justify-center gap-2.5 py-4 text-xs font-black uppercase tracking-[0.2em] rounded-xl transition-all border",
                    (!startZone || !endZone || calculating)
                      ? "bg-white/5 border-white/10 text-textMuted/40 cursor-not-allowed"
                      : "bg-primary text-white border-primary shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:shadow-[0_0_50px_rgba(99,102,241,0.6)] hover:scale-[1.02]"
                  )}
                >
                  {calculating ? (
                    <span className="live-pulse flex items-center gap-2">
                      <Search className="w-4 h-4 animate-spin-slow" /> Analyzing...
                    </span>
                  ) : (
                    <>
                      <Search className="w-4 h-4" /> Calculate Matrix
                    </>
                  )}
                </button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right Column: Dynamic Map Frame */}
        <div className="lg:col-span-2 flex flex-col relative min-h-[500px]">
           <AnimatePresence>
              {calculating && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-[#08080e]/95 backdrop-blur-md z-50 rounded-2xl flex flex-col items-center justify-center border border-primary/20"
                >
                  {/* Hexagon scanning visual */}
                  <div className="relative w-32 h-32 mb-8">
                    <motion.div 
                      className="absolute inset-0 border-2 border-primary/30"
                      style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                    />
                    <motion.div 
                      className="absolute inset-2 border-2 border-cyan-400/50"
                      style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
                      animate={{ rotate: -360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    />
                    {/* Inner glowing core */}
                    <div className="absolute inset-8 bg-primary/20 blur-xl rounded-full live-pulse" />
                  </div>
                  
                  <div className="text-center overflow-hidden h-6 relative w-48">
                    <motion.div
                      animate={{ y: [0, -24, -48, -72] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "steps(4)" }}
                      className="text-[10px] font-black uppercase tracking-[0.3em] text-primary"
                    >
                      <div>Executing Graph Search</div>
                      <div>Resolving Density Nodes</div>
                      <div>Applying Friction Weights</div>
                      <div>Plotting Optimal Vectors</div>
                      <div>Executing Graph Search</div>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <RouteMap route={activeRoute} />
        </div>
      </div>

      {/* Comparison Drawer */}
      {routes.length > 0 && !calculating && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="pt-8"
        >
           <h2 className="text-[10px] text-textMuted font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
             <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]" /> 
             Analyzed Multi-Vector Results
           </h2>
           <RouteComparison 
             routes={routes} 
             activeRouteIndex={activeRouteIndex} 
             onSelectRoute={setActiveRouteIndex} 
           />
        </motion.div>
      )}
    </div>
  );
}
