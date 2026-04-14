import { useMemo, useState } from 'react';
import { Users, AlertCircle, Clock, Activity, Zap, RefreshCw, BarChart2, ShieldCheck, Map } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

import { useCrowdData } from '../context/CrowdContext';
import { StatCard } from '../components/StatCard';
import { Card } from '../components/Card';
import { AlertBanner } from '../components/AlertBanner';
import { CrowdTrendChart } from '../components/CrowdTrendChart';
import { QueueMonitor } from '../components/QueueMonitor';
import { WaitTimeChart } from '../components/WaitTimeChart';
import { OccupancyGauge } from '../components/OccupancyGauge';
import { CrowdHeatmap } from '../components/CrowdHeatmap';
import { Skeleton } from '../components/Skeleton';
import { Recommendations } from '../components/Recommendations';
import { useSimulation } from '../hooks/useSimulation';
import appConfig from '../config/appConfig';
import { cn } from '../utils/cn';

export function Dashboard() {
  const { zones, queues, alerts, removeAlert, isLoading, refreshData } = useCrowdData();
  const sim = useSimulation();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await refreshData();
    } finally {
      setIsRefreshing(false);
    }
  };

  const stats = useMemo(() => {
    let totalCap = 0;
    let totalOcc = 0;
    
    zones.forEach(z => {
      totalCap += z.capacity;
      totalOcc += Math.round(z.capacity * (z.density / 100));
    });

    const avgWait = queues.length 
      ? Math.round(queues.reduce((acc, q) => acc + q.waitTime, 0) / queues.length) 
      : 0;
    
    const overallDensity = totalCap ? Math.round((totalOcc / totalCap) * 100) : 0;

    return {
      totalCapacity: totalCap.toLocaleString(),
      currentOccupancy: totalOcc.toLocaleString(),
      occupancyTrend: overallDensity,
      avgWaitTime: `${avgWait}m`,
      activeAlerts: alerts.length,
    };
  }, [zones, queues, alerts]);

  const chartData = useMemo(() => {
    return zones.map(z => ({
      name: z.name,
      density: z.density,
      fill: z.density >= 85 ? '#ef4444' : z.density >= 60 ? '#f59e0b' : '#10b981'
    }));
  }, [zones]);
  
  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tighter text-white mb-2">Command Center</h1>
          <p className="text-textMuted text-sm font-medium tracking-wide">
            Platform oversight and real-time density matrix.
          </p>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={isRefreshing || isLoading}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.16em] text-white transition-all border",
            "bg-white/5 border-white/10 hover:bg-white/10 hover:border-primary/40 disabled:opacity-50"
          )}
        >
          <RefreshCw className={cn('w-4 h-4 text-primary', isRefreshing && 'animate-spin')} />
          Sync Telemetry
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-6 stagger-list">
        <StatCard 
          title="Total Max Capacity"
          value={stats.totalCapacity}
          icon={Activity}
          status="neutral"
        />
        <StatCard 
          title="Current Occupancy"
          value={stats.currentOccupancy}
          icon={Users}
          status={stats.occupancyTrend > 80 ? 'critical' : stats.occupancyTrend > 60 ? 'warning' : 'good'}
          trend={{ value: `${stats.occupancyTrend}% Full`, direction: stats.occupancyTrend > 80 ? 'up' : 'neutral' }}
        />
        <StatCard 
          title="Average Wait Time"
          value={stats.avgWaitTime}
          icon={Clock}
          status={parseInt(stats.avgWaitTime) > 10 ? 'warning' : 'good'}
          trend={{ value: "Live", direction: "neutral" }}
        />
        <StatCard 
          title="System Alerts"
          value={stats.activeAlerts}
          icon={AlertCircle}
          status={stats.activeAlerts > 2 ? 'critical' : stats.activeAlerts > 0 ? 'warning' : 'good'}
          trend={stats.activeAlerts > 0 ? { value: "Needs Review", direction: "up" } : null}
        />
      </div>

      {/* Visualization Grid 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-1 h-[420px]">
           <OccupancyGauge />
        </div>

        <Card 
          title="Live Topographical Heatmap" 
          icon={Map}
          className="lg:col-span-2 h-[420px] flex flex-col"
          noPadding
        >
          <div className="flex-1 w-full bg-surface/50 p-4">
            {isLoading ? (
               <div className="flex items-center justify-center h-full">
                 <RefreshCw className="w-8 h-8 text-primary animate-spin opacity-50" />
               </div>
            ) : (
               <CrowdHeatmap />
            )}
          </div>
        </Card>
      </div>

      {/* Visualization Grid 2: Bar Chart & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <Card 
          title="Priority System Alerts" 
          icon={ShieldCheck}
          className="flex flex-col h-[380px] lg:col-span-1"
        >
          <div className="flex-1 overflow-y-auto pr-2 styled-scrollbar flex flex-col gap-1 mt-2">
            {isLoading ? (
               <div className="space-y-3"><Skeleton className="h-16" /><Skeleton className="h-16" /></div>
            ) : alerts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-50">
                <ShieldCheck className="w-12 h-12 text-emerald-500 mb-3" />
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Platform Stable</p>
              </div>
            ) : (
              <AnimatePresence>
                {alerts.map(alert => (
                  <AlertBanner
                    key={alert.id}
                    id={alert.id}
                    type={alert.type}
                    message={alert.message}
                    timestamp={alert.timestamp}
                    onDismiss={removeAlert}
                  />
                ))}
              </AnimatePresence>
            )}
          </div>
        </Card>

        <Card 
          title="Linear Density Vectors" 
          icon={BarChart2}
          className="lg:col-span-2 h-[380px] flex flex-col"
        >
          <div className="flex-1 w-full mt-4 relative">
            {isLoading ? (
               <div className="absolute inset-0 flex items-end justify-around gap-2 pb-6">
                 {[100, 75, 40, 90, 60, 30, 80, 50, 10, 20].map((h, i) => (
                   <Skeleton key={i} className="w-[8%]" style={{ height: `${h}%` }} />
                 ))}
               </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                  <defs>
                    <linearGradient id="barRed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0.3}/>
                    </linearGradient>
                    <linearGradient id="barAmber" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    </linearGradient>
                    <linearGradient id="barEmerald" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.3}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickMargin={12} angle={-30} textAnchor="end" tick={{fontFamily: 'JetBrains Mono'}} />
                  <YAxis stroke="#71717a" fontSize={11} tickCount={5} tickFormatter={(val) => `${val}%`} tick={{fontFamily: 'JetBrains Mono'}} />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.05)'}} 
                    contentStyle={{ backgroundColor: '#111118', borderColor: '#27272a', borderRadius: '12px', color: '#fff', fontSize: '12px', fontWeight: 'bold' }} 
                  />
                  <Bar dataKey="density" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`url(#bar${entry.density >= 85 ? 'Red' : entry.density >= 60 ? 'Amber' : 'Emerald'})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <div className="mt-6 mb-8">
         <CrowdTrendChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 mb-8">
         <QueueMonitor />
         <WaitTimeChart />
      </div>

      {appConfig.features.enableRecommendations && <Recommendations />}

      {/* Simulation Engine Panel */}
      {appConfig.features.enableSimulation && (
        <Card title="Global Simulation Engine" icon={Zap} glowing={sim.isRunning}>
          <div className="flex flex-col xl:flex-row gap-6 items-start xl:items-center justify-between mt-2">
            
            <div className="flex gap-3 w-full xl:w-auto">
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={sim.isRunning ? sim.pause : sim.start}
                className={cn("flex-1 xl:flex-none flex items-center justify-center gap-2 py-3.5 px-8 rounded-xl border text-[11px] font-black tracking-[0.18em] uppercase transition-all shadow-lg", 
                  sim.isRunning 
                    ? "bg-amber-500/10 border-amber-500/50 text-amber-400 hover:bg-amber-500 hover:text-black shadow-[0_0_20px_rgba(245,158,11,0.3)]" 
                    : "bg-primary text-white border-primary shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:bg-primary-hover"
                )}
              >
                <Zap className="w-4 h-4" />
                {sim.isRunning ? 'Pause Engine' : 'Start Simulation'}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={sim.stop} disabled={!sim.isRunning && sim.scenario === 'normal'}
                className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl border border-white/10 bg-white/5 hover:bg-red-500 hover:text-white hover:border-red-500 text-textMuted text-[10px] font-black transition-all disabled:opacity-30 disabled:hover:bg-white/5 disabled:hover:text-textMuted disabled:hover:border-white/10 uppercase tracking-widest"
              >
                Halt
              </motion.button>
            </div>
            
            <div className="flex flex-col gap-2 w-full xl:w-auto bg-black/40 p-3.5 rounded-xl border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <span className="text-[9px] text-textMuted font-black uppercase tracking-[0.2em]">Scenario Injection</span>
                <div className="flex flex-wrap gap-2">
                  {['normal', 'entry', 'halftime', 'exit'].map(scen => (
                    <button 
                      key={scen} onClick={() => {
                        if (!sim.isRunning) sim.start();
                        sim.triggerScenario(scen);
                      }}
                      className={cn("px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border",
                        sim.scenario === scen 
                          ? "bg-primary text-white border-primary shadow-[0_0_15px_rgba(99,102,241,0.5)]" 
                          : "bg-white/5 text-textMuted border-white/10 hover:border-white/20 hover:text-white"
                      )}
                    >
                      {scen}
                    </button>
                  ))}
                </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {[
              { label: 'Deploy Staff',       scen: 'halftime' }, 
              { label: 'Trigger Evacuation', scen: 'exit' }, 
              { label: 'Broadcast Intercom', scen: 'normal' }, 
              { label: 'Lockdown Matrix',    scen: 'entry' }
            ].map((action) => (
              <button 
                key={action.label} 
                onClick={() => {
                  if (!sim.isRunning) sim.start();
                  sim.triggerScenario(action.scen);
                }}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-primary/20 bg-primary/10 text-primary hover:bg-primary hover:text-white text-[9px] font-black uppercase tracking-widest transition-all"
              >
                {action.label}
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
