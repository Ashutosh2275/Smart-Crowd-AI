import { motion } from 'framer-motion';
import { Shuffle, Flame, RotateCcw, Activity } from 'lucide-react';
import { useCrowdData, mockZones } from '../../context/CrowdContext';
import { Card } from '../Card';
import { toast } from '../Toast';
import { cn } from '../../utils/cn';

export function CrowdSimulator() {
  const { zones, setZones } = useCrowdData();

  const handleDensityChange = (id, newDensity) => {
    setZones(prev => prev.map(z => z.id === id ? { ...z, density: parseInt(newDensity) } : z));
  };

  const handleRandomFluctuation = () => {
    setZones(prev => prev.map(z => {
      const change = Math.floor(Math.random() * 31) - 15; // random between -15 and +15
      let newDensity = z.density + change;
      newDensity = Math.max(0, Math.min(newDensity, 100));
      return { ...z, density: newDensity };
    }));
  };

  const handleRushMode = () => {
    setZones(prev => prev.map(z => {
      const highDensity = Math.floor(Math.random() * 26) + 75; // 75-100
      return { ...z, density: highDensity };
    }));
    toast.success({ title: 'Rush mode enabled', message: 'All zones pushed into high-density state.', icon: <Flame className="w-4 h-4 text-amber-500" /> });
  };

  const handleReset = () => {
    setZones(JSON.parse(JSON.stringify(mockZones)));
    toast.success({ title: 'Simulation reset', message: 'Matrix returned to baseline.' });
  };

  return (
    <Card 
      title="Global Zone Telemetry Array" 
      icon={Activity}
      className="border-white/10"
    >
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between mb-8 border-b border-white/10 pb-5 gap-6">
        <p className="text-[11px] font-medium text-textMuted max-w-xl leading-relaxed tracking-wide">
          Adjust discrete positional sliders or execute algorithmic overrides to instantiate chaotic environments across the live application matrices. 
          Will trigger system-wide state sync.
        </p>
        
        <div className="flex flex-wrap items-center gap-3">
          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={handleRandomFluctuation}
            className="flex items-center gap-2 px-4 py-2.5 text-[10px] font-black tracking-[0.16em] uppercase bg-white/5 border border-white/10 rounded-xl text-white hover:border-primary/50 hover:bg-white/10 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-all"
          >
            <Shuffle className="w-3.5 h-3.5 text-primary" /> Fluctuate
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={handleRushMode}
            className="flex items-center gap-2 px-4 py-2.5 text-[10px] font-black tracking-[0.16em] uppercase bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500 hover:text-black hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] rounded-xl transition-all"
          >
            <Flame className="w-3.5 h-3.5" /> Rush Mode
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 text-[10px] font-black tracking-[0.16em] uppercase bg-black/40 border border-white/10 rounded-xl text-textMuted hover:text-white transition-all hover:bg-black/80"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </motion.button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        {zones.map(zone => {
          const isCritical = zone.density > 85;
          const isWarning  = zone.density > 60 && zone.density <= 85;

          const colorTheme = isCritical 
            ? 'accent-red-500 hover:accent-red-400 bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
            : isWarning  
              ? 'accent-amber-500 hover:accent-amber-400 bg-amber-500/20' 
              : 'accent-primary hover:accent-primary-hover bg-primary/20';
              
          const badgeTheme = isCritical
            ? 'bg-red-500/10 border-red-500/30 text-red-400 shadow-[inset_0_0_10px_rgba(239,68,68,0.2)]'
            : isWarning
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              : 'bg-primary/10 border-primary/30 text-primary';

          return (
            <div key={zone.id} className="bg-[#0f0f15]/80 p-5 rounded-2xl border border-white/5 hover:border-white/15 transition-all w-full backdrop-blur-sm relative overflow-hidden group">
              {/* Inner highlight */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />

              {/* Shimmer pulse for critical */}
              {isCritical && <div className="absolute inset-0 bg-red-500/5 critical-pulse rounded-2xl pointer-events-none" />}

              <div className="flex justify-between items-center mb-5 relative z-10">
                <span className="text-[11px] font-black text-white tracking-[0.18em] uppercase drop-shadow-sm">{zone.name}</span>
                <span className={cn(
                  "text-[10px] font-black px-2.5 py-1 uppercase tracking-widest rounded-lg border", 
                  badgeTheme
                )}>
                  {zone.density}% Cap
                </span>
              </div>
              
              <div className="relative pt-2 z-10 w-full group/slider">
                <input 
                  type="range" min="0" max="100" 
                  value={zone.density} 
                  onChange={(e) => handleDensityChange(zone.id, e.target.value)}
                  className={cn(
                    "w-full h-1.5 rounded-full appearance-none cursor-ew-resize focus:outline-none transition-all",
                    "group-hover/slider:h-2 duration-300 ease-out",
                    colorTheme
                  )}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
