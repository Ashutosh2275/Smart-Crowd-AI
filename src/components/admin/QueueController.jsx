import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Plus, FastForward, Trash2, Clock, Users, Activity } from 'lucide-react';
import { useCrowdData } from '../../context/CrowdContext';
import { Card } from '../Card';
import { toast } from '../Toast';
import { cn } from '../../utils/cn';

export function QueueController() {
  const { queues, setQueues } = useCrowdData();
  const [newQueueName, setNewQueueName] = useState('');

  const handleWaitTimeChange = (id, newWaitTime) => {
    setQueues(prev => prev.map(q => q.id === id ? { ...q, waitTime: parseInt(newWaitTime) } : q));
  };
  
  const handleQueueLengthChange = (id, newLength) => {
    setQueues(prev => prev.map(q => q.id === id ? { ...q, queueLength: parseInt(newLength) } : q));
  };

  const addQueue = (e) => {
    e.preventDefault();
    if (!newQueueName.trim()) return;
    
    const newQ = {
      id: `q-${Date.now()}`,
      name: newQueueName,
      waitTime: 5, 
      queueLength: 15
    };
    
    setQueues(prev => [...prev, newQ]);
    setNewQueueName('');
    toast.success({ title: 'Queue added', message: `${newQ.name} instantiated.` });
  };

  const removeQueue = (id) => {
    const queueName = queues.find(queue => queue.id === id)?.name ?? 'Queue';
    setQueues(prev => prev.filter(q => q.id !== id));
    toast.info({ title: 'Queue removed', message: `${queueName} offline.` });
  };

  const simulateSurge = () => {
    setQueues(prev => prev.map(q => ({
      ...q,
      waitTime: Math.min(q.waitTime + Math.floor(Math.random() * 15) + 10, 120),
      queueLength: q.queueLength + Math.floor(Math.random() * 50) + 20 
    })));
    toast.warning({ 
      title: 'Surge Algorithm Executed', 
      message: 'Network choke point wait times spiked globally.',
      icon: <FastForward className="w-4 h-4 text-amber-500" />
    });
  };

  const exportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(queues, null, 2));
    const downloadNode = document.createElement('a');
    downloadNode.setAttribute("href", dataStr);
    downloadNode.setAttribute("download", `queue_system_export_${Date.now()}.json`);
    document.body.appendChild(downloadNode);
    downloadNode.click();
    downloadNode.remove();
  };

  return (
    <Card title="Bottleneck & Queue Matrix Control" icon={Activity} className="border-white/10 shadow-lg mt-6">
      
      {/* Top Menu: Actions & Macro Controls */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between mb-8 border-b border-white/5 pb-5 gap-6">
        <p className="text-[11px] font-medium text-textMuted max-w-xl leading-relaxed tracking-wide">
          Directly manipulate network choke points, manually spawn physical lines, or execute macro stress surges globally.
        </p>
        
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={simulateSurge}
            className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-4 py-2.5 text-[10px] font-black tracking-[0.16em] uppercase bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500 hover:text-black rounded-xl transition-all hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]"
          >
            <FastForward className="w-3.5 h-3.5" /> Trigger Surge
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={exportData}
            className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-4 py-2.5 text-[10px] font-black tracking-[0.16em] uppercase bg-black/40 border border-white/10 rounded-xl text-textMuted hover:text-white transition-all hover:bg-black/60 shadow-inner"
          >
            <Download className="w-3.5 h-3.5" /> Export Config
          </motion.button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        
        {/* Left Col: Master Roster */}
        <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5">
          <AnimatePresence>
            {queues.map(queue => {
              const isSevere = queue.waitTime > 15;
              
              return (
                <motion.div 
                  key={queue.id} 
                  layoutId={queue.id}
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  className={cn(
                    "bg-[#0a0a0f] p-5 rounded-2xl border transition-all group relative overflow-hidden",
                    isSevere ? "border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.1)]" : "border-white/5 hover:border-white/20 shadow-inner"
                  )}
                >
                  {isSevere && <div className="absolute inset-0 bg-amber-500/5 critical-pulse pointer-events-none rounded-2xl" />}
                  
                  <div className="flex justify-between items-start mb-5 relative z-10">
                    <span className={cn("text-[11px] font-black tracking-[0.18em] uppercase pr-6", isSevere ? "text-amber-400" : "text-white")}>{queue.name}</span>
                    <button 
                      onClick={() => removeQueue(queue.id)} 
                      className="absolute top-0 right-0 p-2 rounded-xl text-textMuted bg-white/5 border border-white/5 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  {/* Wait Time Slider */}
                  <div className="mb-5 relative z-10 group/slider">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[9px] text-textMuted font-black uppercase tracking-[0.2em] flex items-center gap-1.5">
                        <div className="p-1 rounded bg-primary/10 border border-primary/20"><Clock className="w-3 h-3 text-primary" /></div> Wait
                      </span>
                      <span className={cn("text-lg font-black tracking-tighter drop-shadow-sm", isSevere ? 'text-amber-400' : 'text-white')}>{queue.waitTime}<span className="text-[10px] text-textMuted ml-0.5">m</span></span>
                    </div>
                    <input 
                      type="range" min="0" max="60" 
                      value={queue.waitTime} 
                      onChange={(e) => handleWaitTimeChange(queue.id, e.target.value)}
                      className={cn(
                        "w-full h-1.5 rounded-full appearance-none flex cursor-ew-resize focus:outline-none transition-all group-hover/slider:h-2",
                        isSevere ? 'accent-amber-500 hover:accent-amber-400 bg-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'accent-primary hover:accent-primary-hover bg-primary/20'
                      )}
                    />
                  </div>

                  {/* Queue Length Slider */}
                  <div className="relative z-10 group/slider">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-[9px] text-textMuted font-black uppercase tracking-[0.2em] flex items-center gap-1.5">
                         <div className="p-1 rounded bg-cyan-400/10 border border-cyan-400/20"><Users className="w-3 h-3 text-cyan-400" /></div> Line Cap
                       </span>
                       <span className="text-lg font-black text-white drop-shadow-sm tracking-tighter">{queue.queueLength}<span className="text-[10px] text-textMuted ml-0.5">Px</span></span>
                    </div>
                    <input 
                      type="range" min="0" max="300" 
                      value={queue.queueLength} 
                      onChange={(e) => handleQueueLengthChange(queue.id, e.target.value)}
                      className="w-full h-1.5 rounded-full appearance-none flex cursor-ew-resize focus:outline-none transition-all group-hover/slider:h-2 accent-cyan-400 hover:accent-cyan-300 bg-cyan-400/20"
                    />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Right Col: Admin Form */}
        <div className="xl:col-span-1 bg-[#08080c] border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col h-full relative overflow-hidden">
          {/* Inner highlight */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[40px] pointer-events-none" />

          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white mb-6 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)] px-1" /> Instantiate Node
          </h4>
          
          <form onSubmit={addQueue} className="flex flex-col flex-1 relative z-10">
             <div className="space-y-2 mb-6 group w-full">
               <label className="text-[9px] font-black text-textMuted uppercase tracking-[0.2em] flex items-center gap-2 mb-1.5">
                 <div className="w-1 h-1 rounded-full bg-white/20 group-focus-within:bg-primary transition-colors" /> Identifier Label
               </label>
               <input 
                 type="text" 
                 placeholder="e.g. West Concourse ATM"
                 value={newQueueName}
                 onChange={(e) => setNewQueueName(e.target.value)}
                 className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 px-4 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:border-primary/50 focus:ring-primary/20 transition-all font-mono hover:border-white/20"
                 required
               />
             </div>
             
             <button 
               type="submit"
               disabled={!newQueueName.trim()}
               className="mt-auto w-full py-4 bg-primary border-primary/50 hover:bg-primary-hover shadow-[0_0_30px_rgba(99,102,241,0.3)] text-white text-[10px] font-black tracking-[0.2em] uppercase rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 border"
             >
               <Plus className="w-4 h-4" /> Deploy Line
             </button>
          </form>
        </div>

      </div>
    </Card>
  );
}
