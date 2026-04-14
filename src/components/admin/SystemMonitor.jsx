import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Clock, RefreshCw, Terminal, Cpu, Database, Network } from 'lucide-react';
import { Card } from '../Card';
import { cn } from '../../utils/cn';

export function SystemMonitor() {
  const [uptime, setUptime] = useState(0);
  const [logs, setLogs] = useState([]);
  const [isAutoUpdate, setIsAutoUpdate] = useState(false);
  const [refreshRate, setRefreshRate] = useState(2000);
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleTimeString());
  
  // Simulated System Load
  const [cpu] = useState(12);
  const [memory] = useState(384);
  const [latency, setLatency] = useState(42);

  // Tick Uptime
  useEffect(() => {
    const uptimeTimer = setInterval(() => setUptime(prev => prev + 1), 1000);
    return () => clearInterval(uptimeTimer);
  }, []);

  // Tick Simulated Networking Load
  useEffect(() => {
    if (!isAutoUpdate) return;

    const apiLoop = setInterval(() => {
      const ping = Math.floor(Math.random() * 40) + 20;
      setLatency(ping);
      setLastUpdate(new Date().toLocaleTimeString());
      
      const endpoints = ['/api/v1/telemetry/zones', '/api/v1/queues/active', '/ws/stream/events', '/matrix/calculateDFS'];
      const status = Math.random() > 0.96 ? '500 ERR' : '200 OK';
      const target = endpoints[Math.floor(Math.random() * endpoints.length)];
      
      const pad = (n) => n.toString().padStart(3, '0');
      const newLog = `[${new Date().toLocaleTimeString()}] HTTP GET ${target.padEnd(25)} -> ${status} (${pad(ping)}ms)`;
      setLogs(prev => [newLog, ...prev].slice(0, 45));
    }, refreshRate);

    return () => clearInterval(apiLoop);
  }, [isAutoUpdate, refreshRate]);

  // Uptime formatting
  const formatUptime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-6">
      
      {/* Left Column: Metrics & Configuration */}
      <div className="lg:col-span-1 space-y-6">
        
        <Card title="Pulse Monitor" icon={Activity} className="border-white/10 shadow-lg">
           <div className="space-y-4">
              
              <div className="flex items-center justify-between p-4 bg-[#0a0a0f] rounded-xl border border-white/5">
                <span className="text-[9px] font-black text-textMuted uppercase tracking-[0.2em] flex items-center gap-2">
                  <Network className="w-3.5 h-3.5 text-primary" /> Web Socket Status
                </span>
                <span className="flex items-center gap-1.5 text-[9px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
                  <div className="w-1 h-1 rounded-full bg-emerald-400 status-dot-live" /> Live Sync
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#0a0a0f] rounded-xl border border-white/5">
                <span className="text-[9px] font-black text-textMuted uppercase tracking-[0.2em] flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-primary" /> Platform Uptime
                </span>
                <span className="text-sm font-black text-white font-mono tracking-wider bg-white/5 px-3 py-1 rounded-lg border border-white/5">{formatUptime(uptime)}</span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-[#0a0a0f] rounded-xl border border-white/5">
                <span className="text-[9px] font-black text-textMuted uppercase tracking-[0.2em] flex items-center gap-2">
                  <RefreshCw className={cn("w-3.5 h-3.5 text-cyan-400", isAutoUpdate && "animate-spin")} /> Last Ping Sync
                </span>
                <span className="text-[11px] font-black text-white font-mono tracking-wider">{lastUpdate}</span>
              </div>
           </div>
        </Card>

        {/* Configuration Core */}
        <Card title="Traffic Settings" icon={Network} className="border-white/10 shadow-lg">
           <div className="space-y-6">
             <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-black text-white tracking-[0.16em] uppercase">Auto-Sync Override</h4>
                  <p className="text-[9px] text-textMuted uppercase tracking-[0.1em] font-medium max-w-[200px] leading-relaxed">Toggle to inject mock API GET requests into terminal stream.</p>
                </div>
                
                {/* Custom Toggle Switch */}
                <button 
                  onClick={() => setIsAutoUpdate(!isAutoUpdate)}
                  className={cn(
                    "w-12 h-6 rounded-full relative transition-all duration-300 shadow-inner flex items-center shrink-0", 
                    isAutoUpdate ? "bg-primary border border-primary/50 shadow-[0_0_20px_rgba(99,102,241,0.3)]" : "bg-black/40 border border-white/10"
                  )}
                >
                  <motion.div 
                     layout 
                     initial={false}
                     animate={{ x: isAutoUpdate ? 24 : 2 }}
                     className="absolute w-5 h-5 bg-white rounded-full shadow-md"
                     transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
             </div>

             <div className="space-y-3 pt-5 border-t border-white/5">
                <label className="text-[9px] font-black text-textMuted uppercase tracking-[0.2em] flex items-center gap-2">
                  <div className={cn("w-1 h-1 rounded-full transition-colors", isAutoUpdate ? "bg-primary" : "bg-white/20")} />
                  Polling Frequency
                </label>
                <select 
                  disabled={!isAutoUpdate}
                  value={refreshRate} 
                  onChange={(e) => setRefreshRate(parseInt(e.target.value))}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white appearance-none focus:outline-none focus:ring-1 focus:border-primary/50 disabled:opacity-30 disabled:cursor-not-allowed hover:border-white/20 transition-all cursor-pointer"
                >
                  <option value={500}>Extreme (500ms / High Load)</option>
                  <option value={1000}>Fast (1 Second)</option>
                  <option value={2000}>Normal (2 Seconds)</option>
                  <option value={5000}>Relaxed (5 Seconds)</option>
                </select>
             </div>
           </div>
        </Card>
      </div>

      {/* Right Column: Virtual Diagnostics Logs */}
      <div className="lg:col-span-2 space-y-6 flex flex-col h-full">
        
        {/* Resource Telemetry Board */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
           {/* CPU */}
           <div className="bg-[#0a0a0f] border border-white/5 p-5 rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-primary/20 transition-colors" />
              <div className="flex justify-between items-start mb-4 relative z-10">
                 <span className="text-[9px] uppercase font-black tracking-[0.2em] text-textMuted flex items-center gap-2">
                   <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20"><Cpu className="w-3.5 h-3.5 text-primary" /></div> Core Load
                 </span>
                 <span className={cn("text-xl font-black tracking-tighter drop-shadow-sm", cpu > 80 ? 'text-red-400' : 'text-white')}>{Math.round(cpu)}%</span>
              </div>
              <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-primary transition-all duration-300 shadow-[0_0_10px_rgba(99,102,241,0.8)]" style={{ width: `${Math.round(cpu)}%` }} />
              </div>
           </div>

           {/* RAM */}
           <div className="bg-[#0a0a0f] border border-white/5 p-5 rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-400/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-cyan-400/20 transition-colors" />
              <div className="flex justify-between items-start mb-4 relative z-10">
                 <span className="text-[9px] uppercase font-black tracking-[0.2em] text-textMuted flex items-center gap-2">
                   <div className="p-1.5 rounded-lg bg-cyan-400/10 border border-cyan-400/20"><Database className="w-3.5 h-3.5 text-cyan-400" /></div> Active RAM
                 </span>
                 <span className="text-xl font-black tracking-tighter drop-shadow-sm text-white">{Math.round(memory)}<span className="text-[10px] text-textMuted ml-0.5">MB</span></span>
              </div>
              <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-cyan-400 transition-all duration-300 shadow-[0_0_10px_rgba(34,211,238,0.6)]" style={{ width: `${(memory / 1024) * 100}%` }} />
              </div>
           </div>

           {/* Ping */}
           <div className="bg-[#0a0a0f] border border-white/5 p-5 rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-emerald-500/20 transition-colors" />
              <div className="flex justify-between items-start mb-4 relative z-10">
                 <span className="text-[9px] uppercase font-black tracking-[0.2em] text-textMuted flex items-center gap-2">
                   <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20"><Activity className="w-3.5 h-3.5 text-emerald-400" /></div> API Ping
                 </span>
                 <span className={cn("text-xl font-black tracking-tighter drop-shadow-sm", latency > 100 ? 'text-amber-400' : 'text-white')}>{latency}<span className="text-[10px] text-textMuted ml-0.5">MS</span></span>
              </div>
              <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-emerald-500 transition-all duration-300 shadow-[0_0_10px_rgba(16,185,129,0.8)]" style={{ width: `${Math.min((latency / 120) * 100, 100)}%` }} />
              </div>
           </div>
        </div>

        {/* Live Network Stream Logs */}
        <Card className="border-white/10 p-0 overflow-hidden flex-1 flex flex-col shadow-lg min-h-[350px]" noPadding>
           <div className="p-5 border-b border-white/5 bg-[#08080c] flex items-center justify-between z-10 relative">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-2.5">
                <div className="p-1 rounded bg-primary/10"><Terminal className="w-3.5 h-3.5 text-primary" /></div> Network Stream Console
              </h4>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-white/5 border border-white/10 text-textMuted text-[8px] font-black tracking-[0.2em] uppercase rounded flex items-center gap-1 blur-[0.2px] hover:blur-none transition-all">
                  Read Only <div className="w-1 h-1 rounded-full bg-red-500" />
                </span>
              </div>
           </div>
           
           <div className="flex-1 p-5 bg-[#050508] overflow-y-auto styled-scrollbar font-mono text-xs relative">
             <AnimatePresence>
               {logs.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-full items-center justify-center opacity-30 text-textMuted font-bold tracking-widest uppercase text-[10px]">
                    Auto-sync stream paused. Toggle override to initiate.
                  </motion.div>
               ) : (
                 logs.map((log, i) => {
                   const isError = log.includes('ERR');
                   return (
                     <motion.div 
                       key={`log-${i}-${log.substring(0,25)}`} 
                       initial={{ opacity: 0, x: -10, filter: 'blur(2px)' }} 
                       animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }} 
                       className={cn(
                         "mb-2.5 pb-2.5 border-b border-white/5 tracking-wider leading-relaxed", 
                         isError ? 'text-red-400 font-bold' : 'text-emerald-400/80 mb-1 pb-1 border-transparent'
                       )}
                     >
                       {log}
                       {isError && <span className="block text-[10px] text-red-500/50 mt-0.5 ml-[82px] italic">↳ Packet loss simulated during frame calculation. Resetting buffer.</span>}
                     </motion.div>
                   );
                 })
               )}
             </AnimatePresence>
             {/* Gradient fade at bottom to simulate stream depth */}
             <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-[#050508] to-transparent pointer-events-none" />
           </div>
        </Card>

      </div>

    </div>
  );
}
