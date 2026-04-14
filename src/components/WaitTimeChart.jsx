import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Download, Activity } from 'lucide-react';
import { useCrowdData } from '../context/CrowdContext';
import { Card } from './Card';

export function WaitTimeChart() {
  const { queues } = useCrowdData();

  const chartData = useMemo(() => {
    return queues.map(q => ({
      name: q.name,
      waitTime: q.waitTime,
      queueLength: q.queueLength,
      fill: q.waitTime >= 30 ? '#ef4444' : q.waitTime >= 15 ? '#f59e0b' : '#10b981'
    }));
  }, [queues]);

  const exportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(queues, null, 2));
    const downloadNode = document.createElement('a');
    downloadNode.setAttribute("href", dataStr);
    downloadNode.setAttribute("download", `queue_wait_times_${Date.now()}.json`);
    document.body.appendChild(downloadNode);
    downloadNode.click();
    downloadNode.remove();
  };

  return (
    <Card title="Wait Time Discrepancies" className="border-border shadow-md">
      <div className="flex justify-between items-center mb-6 border-b border-border/50 pb-4">
        <p className="text-sm text-textMuted max-w-sm">Algorithmic graphical breakdown mapping physical line lengths to global wait distributions.</p>
        <button 
          onClick={exportData}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black tracking-widest uppercase bg-surfaceHover border border-border rounded-lg text-textMuted hover:text-white transition-colors hover:border-primary/50"
        >
          <Download className="w-3.5 h-3.5 text-primary" /> Export Nodes
        </button>
      </div>

      <div className="h-[280px] w-full pt-2">
         {chartData.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center text-textMuted/50 border-2 border-dashed border-border/40 rounded-2xl">
             <Activity className="w-12 h-12 mb-3 opacity-50" />
             <p className="font-bold tracking-widest text-xs uppercase text-textMuted">No Queue Checkpoints Detected</p>
           </div>
         ) : (
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 45 }}>
               <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
               <XAxis 
                 dataKey="name" 
                 stroke="#a1a1aa" 
                 fontSize={10} 
                 tickMargin={15} 
                 angle={-35} 
                 textAnchor="end" 
               />
               <YAxis 
                 stroke="#a1a1aa" 
                 fontSize={11} 
                 tickCount={6} 
                 tickFormatter={(val) => `${val}m`}
               />
               <Tooltip 
                 cursor={{ fill: '#27272a', opacity: 0.4 }}
                 contentStyle={{ backgroundColor: '#0a0a0b', borderColor: '#27272a', borderRadius: '12px', color: '#fff', fontSize: '13px', padding: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                 itemStyle={{ fontWeight: 'bold' }}
                 labelStyle={{ color: '#a1a1aa', marginBottom: '8px', borderBottom: '1px solid #27272a', paddingBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}
                 formatter={(value, name) => [name === 'waitTime' ? `${value} minutes` : `${value} individuals`, name === 'waitTime' ? 'Est. Wait Time' : 'Physical Line Count']}
               />
               
               <Bar 
                 dataKey="waitTime" 
                 radius={[4, 4, 0, 0]}
                 animationDuration={1500}
                 animationEasing="ease-out"
               >
                 {chartData.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={entry.fill} />
                 ))}
               </Bar>
             </BarChart>
           </ResponsiveContainer>
         )}
      </div>
    </Card>
  );
}
