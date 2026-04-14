import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Users, BellRing, Activity, ShieldCheck, Database } from 'lucide-react';
import { CrowdSimulator } from '../components/admin/CrowdSimulator';
import { AlertManager } from '../components/admin/AlertManager';
import { QueueController } from '../components/admin/QueueController';
import { SystemMonitor } from '../components/admin/SystemMonitor';
import { ExportPanel } from '../components/admin/ExportPanel';
import { cn } from '../utils/cn';

const tabs = [
  { id: 'simulation', label: 'Crowd Matrix', icon: Users,      color: 'text-cyan-400' },
  { id: 'alerts',     label: 'Alerts',       icon: BellRing,   color: 'text-amber-400' },
  { id: 'settings',   label: 'System',       icon: Settings,   color: 'text-emerald-400' },
  { id: 'exports',    label: 'Export',       icon: Database,   color: 'text-violet-400' },
];

export function Admin() {
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  return (
    <div className="space-y-6 pb-12 w-full max-w-7xl mx-auto h-full flex flex-col pt-2">
      
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tighter text-white mb-2 flex items-center gap-3">
            Admin Terminal <ShieldCheck className="w-7 h-7 text-primary" />
          </h1>
          <p className="text-textMuted text-sm font-medium tracking-wide">
            Demilitarized Zone for manually simulating system telemetry and broadcasting overriding alerts.
          </p>
        </div>
        
        {/* Status indicator */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-black uppercase tracking-[0.2em]">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400 critical-pulse" />
          Restricted Access
        </div>
      </div>

      {/* Futuristic Tab Navigation */}
      <div className="relative p-1.5 rounded-2xl border border-white/10 bg-[#08080c]/80 backdrop-blur-md inline-flex overflow-x-auto styled-scrollbar max-w-full">
        {/* Top edge highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent z-0 pointer-events-none" />
        
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex-1 sm:flex-none flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl text-[10px] font-black uppercase tracking-[0.16em] transition-all whitespace-nowrap overflow-hidden group min-w-[140px]",
                isActive ? "text-white" : "text-textMuted hover:text-white"
              )}
            >
              {isActive && (
                <motion.div 
                  layoutId="admintab-bg"
                  className="absolute inset-0 bg-white/10 border border-white/5 rounded-xl z-0 shadow-inner"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                />
              )}
              {isActive && (
                <motion.div 
                  layoutId="admintab-line"
                  className="absolute bottom-0 inset-x-6 h-0.5 bg-primary rounded-t-full shadow-[0_-2px_8px_rgba(99,102,241,0.8)] z-10"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                />
              )}
              
              <tab.icon className={cn(
                "w-4 h-4 relative z-10 transition-transform", 
                isActive ? tab.color : "group-hover:scale-110"
              )} />
              <span className="relative z-10 drop-shadow-sm">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Payload Container */}
      <div className="flex-1 min-h-[600px] relative">
        <AnimatePresence mode="wait">
          
          {/* CROWD SIMULATION TAB */}
          {activeTab === 'simulation' && (
            <motion.div key="sim" className="space-y-6 anim-fade-in-up">
              <CrowdSimulator />
              <QueueController />
            </motion.div>
          )}

          {/* ALERT MANAGEMENT TAB */}
          {activeTab === 'alerts' && (
            <motion.div key="alerts" className="anim-fade-in-up h-full">
              <AlertManager />
            </motion.div>
          )}

          {/* SYSTEM SETTINGS TAB */}
          {activeTab === 'settings' && (
            <motion.div key="settings" className="anim-fade-in-up">
              <SystemMonitor />
            </motion.div>
          )}

          {/* EXPORT DATA TAB */}
          {activeTab === 'exports' && (
            <motion.div key="exports" className="anim-fade-in-up">
              <ExportPanel />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
