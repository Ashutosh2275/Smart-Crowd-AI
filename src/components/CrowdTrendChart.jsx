import { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Clock, Filter, Activity, Plus } from 'lucide-react';
import { useCrowdData } from '../context/CrowdContext';
import { Card } from './Card';
import { cn } from '../utils/cn';

const TIME_RANGES = {
  '10m': { label: 'Last 10 Min', points: 10, interval: 1 },
  '30m': { label: 'Last 30 Min', points: 6, interval: 5 },
  '1h': { label: 'Last 1 Hour', points: 12, interval: 5 }
};

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export function CrowdTrendChart() {
  const { zones } = useCrowdData();
  const [timeRange, setTimeRange] = useState('30m');
  const [selectedZones, setSelectedZones] = useState([]);
  
  // Auto-select first two zones on initial mount if not selected
  useEffect(() => {
    if (selectedZones.length === 0 && zones.length >= 2) {
      setSelectedZones([zones[0].id, zones[1].id]);
    }
  }, [zones, selectedZones]);

  const handleZoneToggle = (zoneId) => {
    setSelectedZones(prev => {
      if (prev.includes(zoneId)) return prev.filter(id => id !== zoneId);
      if (prev.length >= 4) return [...prev.slice(1), zoneId]; // max 4 lines
      return [...prev, zoneId];
    });
  };

  // Generate dynamic historical timeline anchoring backward from LIVE current values
  const historicalData = useMemo(() => {
    if (!zones.length || !selectedZones.length) return [];
    
    const config = TIME_RANGES[timeRange];
    const dataPoints = [];
    const now = new Date();

    // Mathematically anchor trailing noise backward from the exact live physical reading
    const baseOffsets = selectedZones.reduce((acc, zId) => {
       const zone = zones.find(z => z.id === zId);
       acc[zId] = zone ? zone.density : 50;
       return acc;
    }, {});

    // Generate array backward over time
    for (let i = config.points; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - (i * config.interval * 60000));
      const point = {
        time: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      selectedZones.forEach(zId => {
         // Current absolute anchor point has exactly 0 noise mutation
         if (i === 0) {
           point[zId] = baseOffsets[zId];
         } else {
           // Simulate randomized trailing history algorithm
           const noise = Math.floor(Math.random() * 15) - 7;
           baseOffsets[zId] = Math.max(0, Math.min(100, baseOffsets[zId] + noise));
           point[zId] = baseOffsets[zId];
         }
      });
      dataPoints.push(point);
    }
    
    return dataPoints;
  }, [zones, selectedZones, timeRange]);

  return (
    <Card title="Comparative Density Trends" className="border-border shadow-md">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-border/50 pb-4">
        
        {/* Multi-Zone Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold text-textMuted uppercase tracking-widest flex items-center gap-1.5 mr-2">
            <Filter className="w-3.5 h-3.5" /> Overlay Targets
          </span>
          {zones.slice(0, 7).map(zone => {
            const isSelected = selectedZones.includes(zone.id);
            const colorIndex = selectedZones.indexOf(zone.id);
            return (
              <button
                key={zone.id}
                onClick={() => handleZoneToggle(zone.id)}
                className={cn(
                  "px-3 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-lg transition-all border",
                  isSelected 
                    ? "bg-surface text-white hover:opacity-80" 
                    : "bg-black/20 border-border/50 text-textMuted hover:border-primary/50 hover:text-white"
                )}
                style={isSelected ? { borderColor: CHART_COLORS[colorIndex % CHART_COLORS.length] } : {}}
              >
                {zone.name}
              </button>
            );
          })}
        </div>

        {/* Time Range Config */}
        <div className="flex items-center gap-1 bg-black/20 p-1 rounded-xl border border-border/50 shrink-0">
          {Object.entries(TIME_RANGES).map(([key]) => (
             <button
               key={key}
               onClick={() => setTimeRange(key)}
               className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-all",
                  timeRange === key ? "bg-primary text-white shadow-md shadow-primary/20" : "text-textMuted hover:text-white hover:bg-surface/50"
               )}
             >
               {key}
             </button>
           ))}
        </div>
      </div>

      {/* Recharts Analytics Frame */}
      <div className="h-[320px] w-full pt-2">
         {selectedZones.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center text-textMuted/50 border-2 border-dashed border-border/40 rounded-2xl">
             <Activity className="w-12 h-12 mb-3 opacity-50" />
             <p className="font-bold tracking-widest text-xs uppercase text-textMuted">No targets selected over network</p>
           </div>
         ) : (
           <ResponsiveContainer width="100%" height="100%">
             <LineChart data={historicalData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
               <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
               <XAxis 
                 dataKey="time" 
                 stroke="#a1a1aa" 
                 fontSize={10} 
                 tickMargin={12} 
               />
               <YAxis 
                 stroke="#a1a1aa" 
                 fontSize={11} 
                 tickCount={6} 
                 tickFormatter={(val) => `${val}%`} 
                 domain={[0, 100]}
               />
               <Tooltip 
                 contentStyle={{ backgroundColor: '#0a0a0b', borderColor: '#27272a', borderRadius: '12px', color: '#fff', fontSize: '13px', padding: '12px' }}
                 itemStyle={{ fontWeight: 'bold' }}
                 labelStyle={{ color: '#a1a1aa', marginBottom: '8px', borderBottom: '1px solid #27272a', paddingBottom: '4px' }}
               />
               <Legend 
                 iconType="circle" 
                 wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '15px' }}
               />
               
               {/* Dynamically Map Overlaying Splines */}
               {selectedZones.map((zId, idx) => {
                 const zone = zones.find(z => z.id === zId);
                 if (!zone) return null;
                 return (
                   <Line 
                     key={zId}
                     type="monotone"
                     name={zone.name}
                     dataKey={zId}
                     stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                     strokeWidth={3}
                     dot={{ r: 3, strokeWidth: 2, fill: '#0a0a0b' }}
                     activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                     animationDuration={1500}
                     animationEasing="ease-in-out"
                   />
                 );
               })}
             </LineChart>
           </ResponsiveContainer>
         )}
      </div>
    </Card>
  );
}
