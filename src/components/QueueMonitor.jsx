import { useMemo } from 'react';
import { DoorOpen, Coffee, Droplets, Users, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { useCrowdData } from '../context/CrowdContext';
import { cn } from '../utils/cn';

const getIconForQueue = (name) => {
  const lowername = name.toLowerCase();
  if (lowername.includes('concession')) return Coffee;
  if (lowername.includes('restroom')) return Droplets;
  if (lowername.includes('gate') || lowername.includes('entry')) return DoorOpen;
  return Users;
};

const getStatusColor = (waitTime) => {
  if (waitTime >= 15) return 'text-red-500 bg-red-500/10 border-red-500/30';
  if (waitTime >= 8) return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
  return 'text-green-500 bg-green-500/10 border-green-500/30';
};

const getBarColor = (waitTime) => {
  if (waitTime >= 15) return '#ef4444'; // red
  if (waitTime >= 8) return '#f59e0b'; // amber
  return '#22c55e'; // green
};

export function QueueMonitor() {
  const { queues } = useCrowdData();

  // Enforce chronological priority grouping: Longest Wait Times sort to the top
  const sortedQueues = useMemo(() => {
    return [...queues].sort((a, b) => b.waitTime - a.waitTime);
  }, [queues]);

  return (
    <div className="flex flex-col gap-6 w-full h-full">
      {/* Recharts Graphical Distribution */}
      <div className="h-[220px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={sortedQueues} 
            layout="vertical" 
            margin={{ top: 5, right: 20, left: 30, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={true} vertical={false} />
            <XAxis 
              type="number" 
              stroke="#a1a1aa" 
              fontSize={11} 
              tickFormatter={(val) => `${val}m`} 
            />
            <YAxis 
              type="category" 
              dataKey="name" 
              stroke="#a1a1aa" 
              fontSize={10} 
              width={90} 
              tickMargin={5}
            />
            <Tooltip 
              cursor={{fill: '#27272a', opacity: 0.3}}
              contentStyle={{ backgroundColor: '#121214', borderColor: '#27272a', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
              itemStyle={{ color: '#fff', fontWeight: 'bold' }}
              formatter={(value) => [`${value} minutes`, 'Est. Wait']}
            />
            <Bar dataKey="waitTime" radius={[0, 4, 4, 0]} barSize={16}>
              {sortedQueues.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.waitTime)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Sorted Queue Roster View */}
      <div className="space-y-3 flex-1 overflow-y-auto pr-1 styled-scrollbar p-1">
        {sortedQueues.map((q) => {
          const Icon = getIconForQueue(q.name);
          const statusStyles = getStatusColor(q.waitTime);
          
          return (
            <div 
              key={q.id} 
              className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-surface/30 border border-border backdrop-blur-md shadow-sm hover:bg-surface/60 transition-colors group"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className={cn("p-2.5 rounded-lg border transition-transform group-hover:scale-105", statusStyles)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-tight">{q.name}</h4>
                  <p className="text-xs text-textMuted flex items-center gap-1 mt-1 font-medium">
                    <Users className="w-3.5 h-3.5" /> {q.queueLength} travelers in line
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col items-end">
                <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-inner", statusStyles)}>
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-xs sm:text-sm font-black">{q.waitTime}m</span>
                </div>
                <span className="text-[9px] text-textMuted mt-1.5 mr-2 uppercase font-bold tracking-widest opacity-60">Estimated</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
