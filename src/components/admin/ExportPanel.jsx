import { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import {
  Download, FileJson, FileText, Route, FileImage,
  CheckCircle2, Loader2, AlertTriangle, Database
} from 'lucide-react';
import { useCrowdData } from '../../context/CrowdContext';
import {
  exportCrowdDataJSON,
  exportAlertsCSV,
  exportRouteHistoryJSON,
  generatePDFReport,
} from '../../utils/export';
import { toast } from '../Toast';
import appConfig from '../../config/appConfig';
import { cn } from '../../utils/cn';

// ── Status states per button ──────────────────────────────────────────────────
const STATUS = { idle: 'idle', loading: 'loading', done: 'done', error: 'error' };

function useExportAction(fn, successMessage, failureMessage, emptyMessage) {
  const [status, setStatus] = useState(STATUS.idle);

  const run = async (...args) => {
    if (status === STATUS.loading) return;
    setStatus(STATUS.loading);
    try {
      const result = await fn(...args);
      if (result === false) {
        toast.warning({ title: 'System Empty', message: emptyMessage ?? 'No payload available for export.' });
      } else {
        toast.success({ title: 'Export Generated', message: successMessage, icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> });
      }
      setStatus(STATUS.done);
    } catch (err) {
      toast.error({ title: 'Export Failed', message: failureMessage ?? err.message ?? 'File generation failed.' });
      setStatus(STATUS.error);
    } finally {
      setTimeout(() => setStatus(STATUS.idle), 3000);
    }
  };

  return { status, run };
}

function ExportButton({ icon: Icon, label, description, accent, status, onClick }) {
  const isLoading = status === STATUS.loading;
  const isDone    = status === STATUS.done;
  const isError   = status === STATUS.error;

  const StateIcon = isLoading ? Loader2 : isDone ? CheckCircle2 : isError ? AlertTriangle : Download;
  const stateColor = isDone ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' 
                   : isError ? 'text-red-400 bg-red-500/10 border-red-500/30' 
                   : 'text-white/60 bg-white/5 border-white/10 group-hover:bg-primary group-hover:border-primary group-hover:text-white group-hover:shadow-[0_0_15px_rgba(99,102,241,0.5)]';

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={isLoading}
      className={cn(
        'group relative flex items-center justify-between gap-4 w-full p-5 rounded-2xl border bg-[#0a0a0f] text-left transition-all disabled:opacity-50 overflow-hidden',
        accent
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      
      <div className="flex items-center gap-4 relative z-10 w-full">
        <div className={cn(
          "p-3 rounded-xl border border-white/10 shrink-0 transition-colors", 
          isDone ? "bg-emerald-500/10 border-emerald-500/30" : 
          isError ? "bg-red-500/10 border-red-500/30" : 
          "bg-white/5 group-hover:bg-white/10"
        )}>
          <Icon className={cn("w-5 h-5 transition-colors", isDone ? "text-emerald-400" : isError ? "text-red-400" : "text-white/80 group-hover:text-white")} />
        </div>

        <div className="flex-1 min-w-0 pr-4">
          <p className="text-[13px] font-black text-white tracking-wide">{label}</p>
          <p className="text-[10px] text-textMuted mt-1 leading-relaxed font-medium">{description}</p>
        </div>

        <div className={cn('p-2.5 rounded-xl border shrink-0 transition-all', stateColor)}>
          <StateIcon className={cn('w-4 h-4', isLoading && 'animate-spin')} />
        </div>
      </div>
    </motion.button>
  );
}

ExportButton.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  accent: PropTypes.string.isRequired,
  status: PropTypes.oneOf(['idle', 'loading', 'done', 'error']).isRequired,
  onClick: PropTypes.func.isRequired,
};

export function ExportPanel() {
  const { zones, queues, alerts } = useCrowdData();
  const reportRef = useRef(null);

  const jsonExport    = useExportAction(() => exportCrowdDataJSON({ zones, queues, alerts }), 'Snapshot Payload generated.', 'Unable to download crowd snapshot.');
  const csvExport     = useExportAction(() => exportAlertsCSV(alerts), 'Alert Log CSV saved.', 'Unable to download alert log.');
  const routeExport   = useExportAction(() => exportRouteHistoryJSON([]), 'Vector History JSON saved.', 'Unable to download route history.', 'No vector history available for extraction.');
  const pdfExport     = useExportAction(() => generatePDFReport('#admin-export-target', 'admin_panel'), 'Dashboard PNG rendered.', 'Unable to generate PNG report.');

  const EXPORTS = [
    {
      icon: FileJson,
      label: 'System Diagnostics & Telemetry',
      description: `Full venue snapshot — ${zones.length} zones, ${queues.length} queues, ${alerts.length} alerts exported as structured JSON payload.`,
      accent: 'border-indigo-500/20 hover:border-indigo-500/40 hover:shadow-[0_0_30px_rgba(99,102,241,0.1)]',
      hook: jsonExport,
    },
    {
      icon: FileText,
      label: 'Security Infraction Logs',
      description: `Compile all ${alerts.length} active global network alerts into a spreadsheet-ready comma-separated file.`,
      accent: 'border-amber-500/20 hover:border-amber-500/40 hover:shadow-[0_0_30px_rgba(245,158,11,0.1)]',
      hook: csvExport,
    },
    {
      icon: Route,
      label: 'DFS Vector Route History',
      description: 'Export accumulated pathfinding matrices including all requested nodes, latency times, and density cost equations.',
      accent: 'border-emerald-500/20 hover:border-emerald-500/40 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)]',
      hook: routeExport,
    },
    {
      icon: FileImage,
      label: 'Screen Print Admin Dashboard',
      description: 'Execute html2canvas render to generate a local high-fidelity PNG of the current tactical terminal view.',
      accent: 'border-violet-500/20 hover:border-violet-500/40 hover:shadow-[0_0_30px_rgba(139,92,246,0.1)]',
      hook: pdfExport,
    },
  ];

  if (!appConfig.features.enableExport) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center opacity-40 bg-[#08080c] border border-white/5 rounded-3xl m-6">
        <AlertTriangle className="w-12 h-12 mb-5 text-textMuted" />
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">Extraction Protocols Disabled</h3>
        <p className="text-[11px] font-bold text-textMuted max-w-sm mt-3 tracking-wider leading-relaxed">
          Data export capabilities are restricted via active environment telemetry. Contact your system admin bypass protocol to enable payload dumping.
        </p>
      </div>
    );
  }

  return (
    <div id="admin-export-target" ref={reportRef} className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-5 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
            <Database className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-[13px] font-black text-white tracking-[0.2em] uppercase">Data Extraction Bay</h3>
            <p className="text-[10px] uppercase font-bold tracking-widest text-textMuted mt-1">
              Dump live system memory into hard formats for external matrix analysis.
            </p>
          </div>
        </div>
      </div>

      {/* Quick stats strip */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Active Zones', value: zones.length },
          { label: 'Chokepoints', value: queues.length },
          { label: 'Infractions', value: alerts.length },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col items-center justify-center py-5 px-4 rounded-2xl bg-[#08080c] border border-white/5 hover:border-white/10 transition-colors shadow-inner">
            <span className="text-3xl font-black text-white tracking-tighter drop-shadow-sm mb-1">{value}</span>
            <span className="text-[9px] text-textMuted uppercase tracking-[0.2em] font-black">{label}</span>
          </div>
        ))}
      </div>

      {/* Export buttons grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {EXPORTS.map(({ icon, label, description, accent, hook }) => (
          <ExportButton
            key={label}
            icon={icon}
            label={label}
            description={description}
            accent={accent}
            status={hook.status}
            onClick={hook.run}
          />
        ))}
      </div>

      <p className="text-[9px] uppercase font-black tracking-widest text-textMuted/40 text-center pt-8">
        Terminal processes payloads client-side. Web-sockets do not transmit file data externally.
      </p>
    </div>
  );
}
