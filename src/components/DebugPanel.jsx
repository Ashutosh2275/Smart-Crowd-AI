import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, RefreshCw, Trash2, Activity, Database, Gauge } from 'lucide-react';
import { useCrowdData } from '../context/CrowdContext';
import { toast } from './Toast';

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return 'n/a';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[index]}`;
}

export function DebugPanel() {
  const {
    zones,
    queues,
    alerts,
    paths,
    isLoading,
    isConnected,
    dbError,
    firebaseEnabled,
    lastSyncAt,
    refreshData,
    clearAllData,
  } = useCrowdData();

  const [isOpen, setIsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fps, setFps] = useState(0);
  const [memory, setMemory] = useState(null);

  useEffect(() => {
    let frameCount = 0;
    let lastTick = performance.now();
    let rafId = 0;
    let cancelled = false;

    const loop = (now) => {
      frameCount += 1;

      if (now - lastTick >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastTick)));
        frameCount = 0;
        lastTick = now;

        const memoryInfo = performance.memory;
        if (memoryInfo) {
          setMemory({
            used: memoryInfo.usedJSHeapSize,
            total: memoryInfo.totalJSHeapSize,
            limit: memoryInfo.jsHeapSizeLimit,
          });
        }
      }

      if (!cancelled) {
        rafId = requestAnimationFrame(loop);
      }
    };

    rafId = requestAnimationFrame(loop);
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, []);

  const metrics = useMemo(() => {
    const densityAverage = zones.length
      ? Math.round(zones.reduce((sum, zone) => sum + zone.density, 0) / zones.length)
      : 0;
    const waitAverage = queues.length
      ? Math.round(queues.reduce((sum, queue) => sum + queue.waitTime, 0) / queues.length)
      : 0;
    const lastSyncLabel = lastSyncAt ? new Date(lastSyncAt).toLocaleTimeString() : 'n/a';

    return [
      { label: 'Zones', value: zones.length },
      { label: 'Queues', value: queues.length },
      { label: 'Alerts', value: alerts.length },
      { label: 'Paths', value: paths.length },
      { label: 'Avg Density', value: `${densityAverage}%` },
      { label: 'Avg Wait', value: `${waitAverage}m` },
      { label: 'FPS', value: fps || 'n/a' },
      { label: 'Last Sync', value: lastSyncLabel },
    ];
  }, [zones, queues, alerts, paths, fps, lastSyncAt]);

  const contextState = useMemo(() => ({
    isLoading,
    isConnected,
    firebaseEnabled,
    dbError,
    lastSyncAt,
    zones,
    queues,
    alerts,
    paths,
  }), [isLoading, isConnected, firebaseEnabled, dbError, lastSyncAt, zones, queues, alerts, paths]);

  if (!import.meta.env.DEV) return null;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
      toast.success({ title: 'Refresh complete', message: 'Crowd data was reloaded successfully.' });
    } catch (err) {
      toast.error({ title: 'Refresh failed', message: err.message ?? 'Unable to reload crowd data.' });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClear = async () => {
    const confirmed = window.confirm('Clear all current crowd data?');
    if (!confirmed) return;

    setIsRefreshing(true);
    try {
      await clearAllData();
      toast.success({ title: 'Data cleared', message: 'All live crowd data has been cleared.' });
    } catch (err) {
      toast.error({ title: 'Clear failed', message: err.message ?? 'Unable to clear crowd data.' });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[70] pointer-events-none">
      <AnimatePresence>
        {!isOpen ? (
          <motion.button
            key="debug-toggle-closed"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            onClick={() => setIsOpen(true)}
            className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-primary/30 bg-surface/95 px-4 py-3 text-xs font-black uppercase tracking-widest text-white shadow-2xl shadow-black/30 backdrop-blur-xl hover:border-primary hover:bg-surface"
          >
            <Activity className="h-4 w-4 text-primary" />
            Debug
          </motion.button>
        ) : (
          <motion.div
            key="debug-panel-open"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            className="pointer-events-auto w-[min(92vw,24rem)] overflow-hidden rounded-3xl border border-border bg-background/95 shadow-2xl shadow-black/40 backdrop-blur-2xl"
          >
            <div className="flex items-center justify-between border-b border-border bg-surface/60 px-4 py-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">Development</p>
                <h2 className="text-sm font-bold text-white">Debug Panel</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg border border-border/60 bg-black/20 p-2 text-textMuted transition-colors hover:border-border hover:text-white"
                aria-label="Hide debug panel"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button
                  onClick={handleClear}
                  disabled={isRefreshing}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear All
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {metrics.map(item => (
                  <div key={item.label} className="rounded-xl border border-border/60 bg-black/20 p-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-textMuted">{item.label}</p>
                    <p className="mt-1 text-sm font-bold text-white">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-border/60 bg-black/20 p-3">
                <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-textMuted">
                  <Database className="h-3.5 w-3.5 text-primary" />
                  Context State
                </div>
                <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-xl bg-background/80 p-3 text-[10px] leading-relaxed text-textMuted styled-scrollbar">
{JSON.stringify(contextState, null, 2)}
                </pre>
              </div>

              <div className="rounded-2xl border border-border/60 bg-black/20 p-3">
                <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-textMuted">
                  <Gauge className="h-3.5 w-3.5 text-primary" />
                  Performance
                </div>
                <div className="space-y-2 text-xs text-textMuted">
                  <div className="flex items-center justify-between">
                    <span>Render FPS</span>
                    <span className="font-bold text-white">{fps || 'n/a'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>JS Heap</span>
                    <span className="font-bold text-white">{memory ? formatBytes(memory.used) : 'n/a'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Heap Total</span>
                    <span className="font-bold text-white">{memory ? formatBytes(memory.total) : 'n/a'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Heap Limit</span>
                    <span className="font-bold text-white">{memory ? formatBytes(memory.limit) : 'n/a'}</span>
                  </div>
                </div>
              </div>

              {dbError && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-200">
                  <p className="mb-1 font-black uppercase tracking-widest text-red-300">Data Error</p>
                  <p className="whitespace-pre-wrap">{dbError}</p>
                </div>
              )}

              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-black/20 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-textMuted">
                <span>{isLoading ? 'Syncing' : isConnected ? 'Live' : 'Local'}</span>
                <span>{firebaseEnabled ? 'Firebase' : 'Mock'}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isOpen && (
        <button
          type="button"
          aria-label="Open debug panel"
          className="sr-only"
          onClick={() => setIsOpen(true)}
        />
      )}
    </div>
  );
}
