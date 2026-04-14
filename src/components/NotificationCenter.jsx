import { useState, useRef, useEffect } from 'react';
import { Bell, Volume2, VolumeX, CheckCircle2, Trash2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCrowdData } from '../context/CrowdContext';
import { cn } from '../utils/cn';

export function NotificationCenter() {
  const { alerts, setAlerts } = useCrowdData();
  const [isOpen, setIsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [readIds, setReadIds] = useState([]);
  const prevCountRef = useRef(0);
  const wrapperRef = useRef(null);

  const unreadCount = alerts.filter(a => !readIds.includes(a.id)).length;

  // Click outside to collapse
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Emulate structural alerting sounds when completely new payload items spawn
  useEffect(() => {
    if (alerts.length > prevCountRef.current && soundEnabled && unreadCount > 0) {
      try {
         // Create structural beep entirely synthetically mapping a high-frequency sine wave mapping alerting limits
         const actx = new (window.AudioContext || window.webkitAudioContext)();
         const osc = actx.createOscillator();
         const gain = actx.createGain();
         osc.type = 'sine';
         osc.frequency.setValueAtTime(800, actx.currentTime);
         osc.frequency.exponentialRampToValueAtTime(1200, actx.currentTime + 0.1);
         gain.gain.setValueAtTime(0.1, actx.currentTime);
         gain.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 0.2);
         osc.connect(gain);
         gain.connect(actx.destination);
         osc.start();
         osc.stop(actx.currentTime + 0.2);
      } catch { /* Browser audio block safely ignored */ }
    }
    prevCountRef.current = alerts.length;
  }, [alerts.length, soundEnabled, unreadCount]);

  const markAllAsRead = () => {
    setReadIds(alerts.map(a => a.id));
  };
  
  const clearAll = () => {
    setAlerts([]);
    setReadIds([]);
  };

  const removeAlert = (id) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-amber-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div ref={wrapperRef} className="relative z-50">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2.5 transition-colors rounded-xl border",
          isOpen ? "bg-surface border-border text-white shadow-inner" : "text-textMuted hover:text-white hover:bg-surface border-transparent hover:border-border/50"
        )}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 mt-3 w-80 sm:w-96 bg-background/95 backdrop-blur-2xl border border-border shadow-2xl rounded-2xl overflow-hidden"
          >
            {/* Header Matrix */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-surface/50">
              <h3 className="text-sm font-black text-white tracking-widest uppercase">Platform Logs</h3>
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={cn("p-1.5 rounded-lg border transition-all", soundEnabled ? "bg-primary/20 border-primary/50 text-primary hover:bg-primary/30" : "bg-black/20 border-border border-transparent text-textMuted hover:text-white")}
                  title={soundEnabled ? "Mute Alarms" : "Enable Sound"}
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>
                <button 
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                  className="p-1.5 rounded-lg border border-transparent text-textMuted hover:text-white hover:bg-surface transition-all disabled:opacity-30"
                  title="Mark Everything Read"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={clearAll}
                  disabled={alerts.length === 0}
                  className="p-1.5 text-textMuted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-30 border border-transparent"
                  title="Clear Telemetry Array"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Scrolling Notification Body Container */}
            <div className="max-h-[350px] overflow-y-auto styled-scrollbar">
              {alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 opacity-50 px-6 text-center">
                  <Bell className="w-10 h-10 mb-3 text-textMuted" />
                  <p className="text-xs font-bold tracking-widest uppercase text-textMuted">Operational Matrices Optimized</p>
                  <p className="text-[10px] text-textMuted/70 mt-1">No active system warnings mapped today.</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {alerts.map(alert => {
                    const isRead = readIds.includes(alert.id);
                    return (
                      <div 
                        key={alert.id}
                        className={cn(
                          "flex items-start gap-3 px-4 py-3.5 border-b border-border/30 transition-colors group relative",
                          isRead ? "bg-black/40" : "bg-surface/20"
                        )}
                        onClick={() => { if (!isRead) setReadIds(prev => [...prev, alert.id]); }}
                      >
                        {/* Dot indicator */}
                        {!isRead && <div className="absolute left-1.5 top-[22px] w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_5px_rgba(99,102,241,0.8)]" />}
                        
                        <div className="shrink-0 mt-0.5">
                          {getAlertIcon(alert.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0 pr-6 cursor-pointer">
                          <p className={cn("text-xs font-bold leading-relaxed", alert.type === 'critical' ? "text-red-500 font-black" : isRead ? "text-textMuted" : "text-white")}>
                            {alert.message}
                          </p>
                          <p className="text-[9px] uppercase tracking-widest text-textMuted mt-1.5">
                            {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </p>
                        </div>
                        
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeAlert(alert.id); }}
                          className="absolute right-3 top-3.5 p-1.5 text-textMuted opacity-0 group-hover:opacity-100 transition-opacity hover:text-white rounded-lg hover:bg-surface border border-transparent"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {alerts.length > 0 && (
               <div className="px-4 py-2 bg-black/20 border-t border-border/50 text-center">
                  <span className="text-[9px] text-textMuted font-bold uppercase tracking-widest">{alerts.length} Total Registered Logs</span>
               </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
