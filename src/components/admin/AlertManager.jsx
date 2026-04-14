import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  BellRing, 
  Trash2, 
  Edit2, 
  Activity,
  Zap, 
  Settings, 
  ShieldAlert, 
  Trash,
  Users,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { useCrowdData } from '../../context/CrowdContext';
import { Card } from '../Card';
import { toast } from '../Toast';
import { cn } from '../../utils/cn';

const templates = [
  { id: 't1', label: 'Overcrowding Spiked', type: 'warning', message: 'Density levels approaching critical safety limits. Prepare redirect procedures.', icon: Users },
  { id: 't2', label: 'Emergency Evacuation', type: 'critical', message: 'IMMEDIATE EVACUATION REQUIRED. Please proceed to the nearest emergency exits calmly.', icon: ShieldAlert },
  { id: 't3', label: 'Routine Maintenance', type: 'info', message: 'Facility zone closed temporarily for 15-minute scheduled maintenance protocols.', icon: Settings }
];

export function AlertManager() {
  const { alerts, setAlerts, zones } = useCrowdData();
  const [editingId, setEditingId] = useState(null);
  const alertIdCounterRef = useRef(0);
  
  const initialFormState = { message: '', type: 'info', zone: '', priority: 'normal' };
  const [formData, setFormData] = useState(initialFormState);

  const handleAlertSubmit = (e) => {
    e.preventDefault();
    if (!formData.message) return;
    
    if (editingId) {
      setAlerts(prev => prev.map(a => a.id === editingId ? { 
        ...a, 
        message: formData.message, 
        type: formData.type, 
        zone: formData.zone || null,
        priority: formData.priority
      } : a));
      setEditingId(null);
      toast.success({ title: 'Alert updated', message: 'The selected alert was updated successfully.', icon: <CheckCircle2 className="w-4 h-4 text-emerald-400"/> });
    } else {
      const alertObj = {
        id: `manual-${++alertIdCounterRef.current}`,
        type: formData.type,
        message: formData.message,
        zone: formData.zone || null,
        priority: formData.priority,
        timestamp: new Date().toISOString()
      };
      setAlerts(prev => [alertObj, ...prev]);
      toast.success({ title: 'Alert broadcast', message: 'System alert dispatched.', icon: <BellRing className="w-4 h-4 text-emerald-400"/> });
    }
    setFormData(initialFormState);
  };

  const executeTemplate = (template) => {
    const defaultZone = zones?.length > 0 ? zones[0].id : null;
    const alertObj = {
      id: `template-${template.id}-${++alertIdCounterRef.current}`,
      type: template.type,
      message: template.message,
      zone: defaultZone, 
      priority: template.type === 'critical' ? 'high' : 'normal',
      timestamp: new Date().toISOString()
    };
    setAlerts(prev => [alertObj, ...prev]);
    toast.info({ title: 'Template dispatched', message: `${template.label} was broadcast to the system.`, icon: <Zap className="w-4 h-4 text-primary" /> });
  };

  const triggerEditMode = (alert) => {
    setEditingId(alert.id);
    setFormData({
      message: alert.message,
      type: alert.type,
      zone: alert.zone || '',
      priority: alert.priority || 'normal'
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteAlert = (id) => {
    const alertMessage = alerts.find(alert => alert.id === id)?.message ?? 'Alert';
    setAlerts(prev => prev.filter(a => a.id !== id));
    toast.info({ title: 'Alert removed', message: `${alertMessage.slice(0,20)}... was deleted.` });
  };

  const clearAllAlerts = () => {
    setAlerts([]);
    toast.warning({ title: 'Alerts cleared', message: 'All active alerts were removed.' });
  };

  const getBadgeStyle = (type) => {
     if (type === 'critical') return 'bg-red-500/10 border-red-500/30 text-red-500 shadow-[inset_0_0_10px_rgba(239,68,68,0.2)]';
     if (type === 'warning')  return 'bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-[inset_0_0_10px_rgba(245,158,11,0.2)]';
     return 'bg-primary/10 border-primary/30 text-primary shadow-[inset_0_0_10px_rgba(99,102,241,0.2)]';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
      
      {/* LEFT COLUMN */}
      <div className="flex flex-col gap-6">
        <Card title="Broadcast Central" icon={BellRing} className="border-white/10 shadow-lg">
          <form onSubmit={handleAlertSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-5">
               {/* Alert Severity */}
               <div className="space-y-2 group">
                 <label className="text-[9px] font-black text-textMuted uppercase tracking-[0.2em] flex items-center gap-2">
                   <div className="w-1 h-1 rounded-full bg-white/20 group-focus-within:bg-primary transition-colors" /> Base Severity
                 </label>
                 <select 
                   value={formData.type} onChange={(e) => setFormData(prev => ({...prev, type: e.target.value}))}
                   className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 px-4 text-xs font-bold text-white appearance-none focus:outline-none focus:ring-1 focus:border-primary/50 focus:ring-primary/20 transition-all cursor-pointer hover:border-white/20"
                 >
                   <option value="info">Info (Standard)</option>
                   <option value="warning">Warning (Elevated)</option>
                   <option value="critical">Critical (Severe)</option>
                 </select>
               </div>
               
               {/* Priority Rating */}
               <div className="space-y-2 group">
                 <label className="text-[9px] font-black text-textMuted uppercase tracking-[0.2em] flex items-center gap-2">
                   <div className="w-1 h-1 rounded-full bg-white/20 group-focus-within:bg-primary transition-colors" /> Priority Override
                 </label>
                 <select 
                   value={formData.priority} onChange={(e) => setFormData(prev => ({...prev, priority: e.target.value}))}
                   className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 px-4 text-xs font-bold text-white appearance-none focus:outline-none focus:ring-1 focus:border-primary/50 focus:ring-primary/20 transition-all cursor-pointer hover:border-white/20"
                 >
                   <option value="normal">Normal Dispatch</option>
                   <option value="high">High Velocity (Force Push)</option>
                 </select>
               </div>
            </div>

            <div className="space-y-2 group">
              <label className="text-[9px] font-black text-textMuted uppercase tracking-[0.2em] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-white/20 group-focus-within:bg-primary transition-colors" /> Target Locus
                </div>
                <span className="opacity-50">OPTIONAL</span>
              </label>
              <select 
                value={formData.zone} onChange={(e) => setFormData(prev => ({...prev, zone: e.target.value}))}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 px-4 text-xs font-bold text-white appearance-none focus:outline-none focus:ring-1 focus:border-primary/50 focus:ring-primary/20 transition-all cursor-pointer hover:border-white/20"
              >
                <option value="">Global System Broadcast (All Nodes)</option>
                {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
              </select>
            </div>

            <div className="space-y-2 group">
              <label className="text-[9px] font-black text-textMuted uppercase tracking-[0.2em] flex items-center gap-2">
                 <div className="w-1 h-1 rounded-full bg-white/20 group-focus-within:bg-primary transition-colors" /> Transmission Payload
              </label>
              <textarea 
                required placeholder="Enter dispatch protocol content..." rows={3}
                value={formData.message} onChange={(e) => setFormData(prev => ({...prev, message: e.target.value}))}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 px-4 text-sm font-medium text-white resize-none focus:outline-none focus:ring-1 focus:border-primary/50 focus:ring-primary/20 transition-all placeholder-white/20 hover:border-white/20"
              />
            </div>

            <div className="flex gap-4">
              <motion.button 
                type="submit" 
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className={cn(
                  "flex-1 py-4 text-white text-[11px] font-black tracking-[0.2em] uppercase rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 border",
                  editingId 
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500 hover:text-black shadow-[0_0_20px_rgba(245,158,11,0.2)]" 
                    : "bg-primary border-primary/50 hover:bg-primary-hover shadow-[0_0_30px_rgba(99,102,241,0.4)]"
                )}
              >
                {editingId ? <><Edit2 className="w-4 h-4" /> Commit Update</> : <><Zap className="w-4 h-4" /> Broadcast Event</>}
              </motion.button>
              
              <AnimatePresence>
                {editingId && (
                  <motion.button 
                    initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }}
                    type="button" 
                    onClick={() => { setEditingId(null); setFormData(initialFormState); }}
                    className="px-6 py-4 border border-white/10 bg-white/5 text-textMuted hover:text-white rounded-xl transition-all font-black text-[11px] tracking-widest uppercase hover:bg-white/10 whitespace-nowrap"
                  >
                    Cancel
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </form>
        </Card>

        {/* Quick Execution Templates */}
        <Card title="Templated Execution" icon={Zap} className="border-white/10">
          <p className="text-[10px] font-bold tracking-widest uppercase text-textMuted mb-5 pb-5 border-b border-white/5 leading-relaxed">
            Instantly dispatch verified emergency schemas across the routing network. Bypasses standard verification delays.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {templates.map(tmp => (
               <motion.button
                 key={tmp.id}
                 whileHover={{ y: -4, scale: 1.02 }}
                 whileTap={{ scale: 0.98 }}
                 onClick={() => executeTemplate(tmp)}
                 className="flex flex-col items-center justify-center gap-3 p-4 bg-[#0a0a0f] border border-white/5 hover:border-white/20 rounded-2xl transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] group relative overflow-hidden text-center"
               >
                 <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                 
                 <div className={cn(
                    "p-2.5 rounded-xl border relative z-10",
                    tmp.type === 'critical' ? 'bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]' :
                    tmp.type === 'warning' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]' :
                    'bg-primary/10 border-primary/30 text-primary shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                 )}>
                   <tmp.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                 </div>
                 <span className="text-[10px] font-black uppercase text-white tracking-widest mt-1 z-10 leading-tight">
                   {tmp.label}
                 </span>
               </motion.button>
            ))}
          </div>
        </Card>
      </div>

      {/* RIGHT COLUMN: Active Log Control */}
      <Card title="Active Network Logs" icon={Activity} className="border-white/10 flex flex-col h-full shadow-lg min-h-[600px] lg:col-span-1" noPadding>
        
        {/* Bulk Action Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/5">
           <span className="text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
             <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]" /> 
             {alerts.length} Active Payloads
           </span>
           {alerts.length > 0 && (
             <button 
               onClick={clearAllAlerts} 
               className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-[0.16em] text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all hover:shadow-[0_0_15px_rgba(239,68,68,0.4)]"
             >
               <Trash className="w-3.5 h-3.5" /> Nuke Logs
             </button>
           )}
        </div>

        {/* Scrollable Array */}
        <div className="flex-1 p-6 space-y-4 h-[400px] overflow-y-auto styled-scrollbar">
          <AnimatePresence>
            {alerts.length === 0 ? (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center p-12 h-full opacity-50">
                 <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl mb-5">
                   <ShieldAlert className="w-8 h-8 text-emerald-400 shrink-0" />
                 </div>
                 <p className="text-textMuted text-[11px] font-black tracking-[0.2em] uppercase text-center leading-relaxed">
                   System Secure.<br/>No Infractions Logged.
                 </p>
               </motion.div>
            ) : alerts.map(alert => {
              const isEditing = editingId === alert.id;
              
              return (
                <motion.div 
                  key={alert.id}
                  layoutId={alert.id}
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  className={cn(
                    "p-5 rounded-2xl flex items-start justify-between gap-4 group transition-all relative overflow-hidden",
                    isEditing 
                      ? "bg-[#0f0f15]/90 border border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.15)]" 
                      : "bg-[#08080c] border border-white/5 hover:border-white/15"
                  )}
                >
                  {/* Subtle left glow strictly based on type */}
                  <div className={cn(
                    "absolute left-0 top-0 bottom-0 w-1 opacity-60",
                    alert.type === 'critical' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' :
                    alert.type === 'warning' ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]' :
                    'bg-primary shadow-[0_0_10px_rgba(99,102,241,0.8)]'
                  )} />

                  <div className="flex-1 pl-2">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={cn("text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded border", getBadgeStyle(alert.type))}>
                        {alert.type}
                      </span>
                      {alert.priority === 'high' && (
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-red-300 bg-red-500/20 px-2 py-1 rounded border border-red-500/30 flex items-center gap-1.5 shadow-[0_0_10px_rgba(239,68,68,0.3)] critical-pulse">
                          <Zap className="w-2.5 h-2.5" /> High Velocity
                        </span>
                      )}
                    </div>
                    
                    <p className={cn("text-[13px] font-semibold mb-3 leading-relaxed", isEditing ? "text-amber-400" : "text-white/90")}>
                      {alert.message}
                    </p>
                    
                    <p className="text-[9px] flex items-center gap-1.5 text-textMuted font-black uppercase tracking-widest">
                       <MapPin className="w-3 h-3 text-primary opacity-80" /> 
                       Vector: <span className="text-white/70 ml-1">{alert.zone ? zones.find(z => z.id === alert.zone)?.name : 'Global Broadast'}</span>
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => triggerEditMode(alert)} 
                      className="p-2.5 bg-white/5 border border-white/5 text-textMuted rounded-xl transition-all hover:bg-amber-500/20 hover:text-amber-400 hover:border-amber-500/30"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => deleteAlert(alert.id)} 
                      className="p-2.5 bg-white/5 border border-white/5 text-textMuted rounded-xl transition-all hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

      </Card>
    </div>
  );
}
