import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  subscribeToUpdates,
  saveCrowdData,
  saveAlert,
  deleteAlertById,
  saveQueue,
  seedInitialData,
  clearAllData as clearAllDataStore,
  getCrowdData,
  getQueues,
  getAlerts,
} from '../services/firebaseService';
import { toast } from '../components/Toast';

// ─────────────────────────────────────────────────────────────────────────────
// Mock data — used as seed values and as the local fallback when Firebase
// is not yet configured (placeholder credentials detected).
// ─────────────────────────────────────────────────────────────────────────────

export const mockZones = [
  { id: 'z1',  name: 'North Gate',       density: 85, capacity: 5000  },
  { id: 'z2',  name: 'South Gate',       density: 42, capacity: 5000  },
  { id: 'z3',  name: 'East Stand',       density: 95, capacity: 15000 },
  { id: 'z4',  name: 'West Stand',       density: 88, capacity: 15000 },
  { id: 'z5',  name: 'VIP Lounge',       density: 30, capacity: 500   },
  { id: 'z6',  name: 'Concession A',     density: 75, capacity: 300   },
  { id: 'z7',  name: 'Concession B',     density: 60, capacity: 300   },
  { id: 'z8',  name: 'Restroom Block 1', density: 90, capacity: 100   },
  { id: 'z9',  name: 'Restroom Block 2', density: 40, capacity: 100   },
  { id: 'z10', name: 'Medical Tent',     density: 10, capacity: 50    },
];

const mockQueues = [
  { id: 'q1', name: 'Concession A Line', waitTime: 12, queueLength: 35  },
  { id: 'q2', name: 'Concession B Line', waitTime: 5,  queueLength: 12  },
  { id: 'q3', name: 'Restroom 1 Line',   waitTime: 8,  queueLength: 20  },
  { id: 'q4', name: 'North Gate Entry',  waitTime: 15, queueLength: 120 },
];

const mockAlerts = [
  { id: 'a1', type: 'warning',  message: 'High congestion detected at East Stand exit',   timestamp: new Date().toISOString(),                      zone: 'z3' },
  { id: 'a2', type: 'critical', message: 'Restroom Block 1 near capacity limit',           timestamp: new Date(Date.now() - 5  * 60000).toISOString(), zone: 'z8' },
  { id: 'a3', type: 'info',     message: 'South Gate flowing smoothly',                    timestamp: new Date(Date.now() - 15 * 60000).toISOString(), zone: 'z2' },
];

const mockPaths = [
  { id: 'p1', from: 'z1', to: 'z3', status: 'congested', label: 'North to East'              },
  { id: 'p2', from: 'z1', to: 'z4', status: 'clear',     label: 'North to West'              },
  { id: 'p3', from: 'z2', to: 'z3', status: 'clear',     label: 'South to East'              },
  { id: 'p4', from: 'z3', to: 'z6', status: 'moderate',  label: 'East Stand to Concession A' },
  { id: 'p5', from: 'z6', to: 'z8', status: 'congested', label: 'Concession A to Restroom 1' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Detect whether Firebase credentials have been supplied.
// If not, the context stays in mock-data mode transparently.
// ─────────────────────────────────────────────────────────────────────────────
function detectFirebaseMode() {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '';
  return projectId.length > 0 && !projectId.includes('YOUR_');
}

const FIREBASE_ENABLED = detectFirebaseMode();

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────
const CrowdContext     = createContext(null);
const CrowdMetaContext = createContext(null); // Stable flags — separate to avoid cascade re-renders

const noop = () => {};
const noopAsync = async () => {};

const fallbackMeta = {
  isLoading: false,
  isConnected: false,
  dbError: null,
  lastSyncAt: null,
  firebaseEnabled: FIREBASE_ENABLED,
  updateZone: noopAsync,
  addAlert: noopAsync,
  removeAlert: noopAsync,
  updateQueueItem: noopAsync,
  refreshData: noopAsync,
  clearAllData: noopAsync,
};

const fallbackCrowd = {
  zones: [],
  setZones: noop,
  queues: [],
  setQueues: noop,
  alerts: [],
  setAlerts: noop,
  paths: [],
  setPaths: noop,
};

export function CrowdProvider({ children }) {
  const [zones,       setZones]       = useState([]);
  const [queues,      setQueues]      = useState([]);
  const [alerts,      setAlerts]      = useState([]);
  const [paths,       setPaths]       = useState([]);
  const [isLoading,   setIsLoading]   = useState(true);
  const [isConnected, setIsConnected] = useState(false); // true = Firebase live
  const [dbError,     setDbError]     = useState(null);
  const [lastSyncAt,   setLastSyncAt]   = useState(null);

  useEffect(() => {
    const MAX_RETRIES = 3;
    const RETRY_BASE_DELAY = 1200;
    let cancelled = false;
    let retryTimer = null;
    let unsubscribe = () => {};

    const clearRetry = () => {
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
    };

    const applyMockFallback = () => {
      setZones(mockZones);
      setQueues(mockQueues);
      setAlerts(mockAlerts);
      setPaths(mockPaths);
      setIsLoading(false);
      setIsConnected(false);
      setLastSyncAt(Date.now());
    };

    const scheduleRetry = (reason, nextAttempt) => {
      if (cancelled) return;
      setDbError(reason);

      if (nextAttempt > MAX_RETRIES) {
        toast.error({ title: 'Connection lost', message: 'Using cached demo data because live data could not be loaded.' });
        applyMockFallback();
        return;
      }

      const delay = RETRY_BASE_DELAY * (2 ** (nextAttempt - 1));
      toast.warning({ title: 'Retrying connection', message: `Attempt ${nextAttempt} of ${MAX_RETRIES} in ${Math.round(delay / 1000)}s.` });
      clearRetry();
      retryTimer = setTimeout(() => {
        void connectLive(nextAttempt);
      }, delay);
    };

    const connectLive = async (attempt = 1) => {
      if (cancelled) return;

      clearRetry();
      try {
        if (attempt === 1) {
          await seedInitialData(mockZones, mockQueues, mockAlerts);
        }

        setPaths(mockPaths);
        unsubscribe = subscribeToUpdates(
          ({ zones: z, queues: q, alerts: a }) => {
            // Always propagate incoming snapshots, including empty arrays,
            // so the UI never shows stale values after deletes.
            setZones(Array.isArray(z) ? z : []);
            setQueues(Array.isArray(q) ? q : []);
            setAlerts(Array.isArray(a) ? a : []);
            setIsLoading(false);
            setIsConnected(true);
            setLastSyncAt(Date.now());
          },
          err => {
            console.error('[CrowdContext] Firestore error:', err);
            scheduleRetry(err.message ?? 'Firestore connection failed', attempt + 1);
          }
        );
      } catch (err) {
        console.error('[CrowdContext] Firebase init error:', err);
        scheduleRetry(err.message ?? 'Firebase initialization failed', attempt + 1);
      }
    };

    if (!FIREBASE_ENABLED) {
      // ── MOCK MODE ── simulate network delay then load static data
      const timer = setTimeout(() => {
        applyMockFallback();
      }, 450);
      return () => clearTimeout(timer);
    }

    void connectLive(1);

    return () => {
      cancelled = true;
      clearRetry();
      unsubscribe();
    };
  }, []);

  // ── Write-through helpers ─────────────────────────────────────────────────
  // Components call these instead of setZones/setAlerts directly so that
  // changes propagate to Firestore when live, or stay local in mock mode.

  const updateZone = useCallback(async (updatedZone) => {
    setZones(prev => prev.map(z => z.id === updatedZone.id ? updatedZone : z));
    if (FIREBASE_ENABLED) await saveCrowdData(updatedZone).catch(console.error);
  }, []);

  const addAlert = useCallback(async (alert) => {
    setAlerts(prev => [alert, ...prev]);
    if (FIREBASE_ENABLED) await saveAlert(alert).catch(console.error);
  }, []);

  const removeAlert = useCallback(async (alertId) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
    if (FIREBASE_ENABLED) await deleteAlertById(alertId).catch(console.error);
  }, []);

  const updateQueueItem = useCallback(async (updatedQueue) => {
    setQueues(prev => prev.map(q => q.id === updatedQueue.id ? updatedQueue : q));
    if (FIREBASE_ENABLED) await saveQueue(updatedQueue).catch(console.error);
  }, []);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setDbError(null);

    const MAX_RETRIES = 3;
    let attempt = 0;

    const loadOnce = async () => {
      if (!FIREBASE_ENABLED) {
        setZones(mockZones);
        setQueues(mockQueues);
        setAlerts(mockAlerts);
        setPaths(mockPaths);
        setIsConnected(false);
        setLastSyncAt(Date.now());
        return;
      }

      const [nextZones, nextQueues, nextAlerts] = await Promise.all([
        getCrowdData(),
        getQueues(),
        getAlerts(),
      ]);

      setZones(nextZones.length ? nextZones : mockZones);
      setQueues(nextQueues.length ? nextQueues : mockQueues);
      setAlerts(nextAlerts.length ? nextAlerts : mockAlerts);
      setPaths(mockPaths);
      setIsConnected(true);
      setLastSyncAt(Date.now());
    };

    while (attempt < MAX_RETRIES) {
      try {
        await loadOnce();
        setIsLoading(false);
        return;
      } catch (err) {
        attempt += 1;
        const reason = err.message ?? 'Failed to refresh data';
        console.error('[CrowdContext.refreshData]', err);

        if (attempt >= MAX_RETRIES) {
          setDbError(reason);
          toast.error({ title: 'Refresh failed', message: 'Using fallback data until the connection recovers.' });
          setZones(mockZones);
          setQueues(mockQueues);
          setAlerts(mockAlerts);
          setPaths(mockPaths);
          setIsConnected(false);
          setLastSyncAt(Date.now());
          setIsLoading(false);
          throw err;
        }

        setDbError(reason);
        toast.warning({ title: 'Retrying refresh', message: `Attempt ${attempt + 1} of ${MAX_RETRIES}...` });
        await new Promise(resolve => setTimeout(resolve, 800 * attempt));
      }
    }

    setIsLoading(false);
  }, []);

  const clearAllData = useCallback(async () => {
    setIsLoading(true);
    setDbError(null);

    try {
      if (FIREBASE_ENABLED) {
        await clearAllDataStore();
      }

      setZones([]);
      setQueues([]);
      setAlerts([]);
      setPaths([]);
      setLastSyncAt(Date.now());
    } catch (err) {
      console.error('[CrowdContext.clearAllData]', err);
      setDbError(err.message ?? 'Failed to clear data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Memoise the meta values so their object identity is stable ─────────────
  // Components subscribing to CrowdMetaContext won't re-render on every zone tick.
  const metaValue = useMemo(() => ({
    isLoading,
    isConnected,
    dbError,
    lastSyncAt,
    firebaseEnabled: FIREBASE_ENABLED,
    updateZone,
    addAlert,
    removeAlert,
    updateQueueItem,
    refreshData,
    clearAllData,
  }), [isLoading, isConnected, dbError, lastSyncAt, updateZone, addAlert, removeAlert, updateQueueItem, refreshData, clearAllData]);

  // ── Memoise the live data values separately ───────────────────────────────
  // Simulation ticks change zones/queues frequently; alerts and paths change less often.
  const crowdValue = useMemo(() => ({
    zones,  setZones,
    queues, setQueues,
    alerts, setAlerts,
    paths,  setPaths,
  }), [zones, queues, alerts, paths]);

  return (
    <CrowdMetaContext.Provider value={metaValue}>
      <CrowdContext.Provider value={crowdValue}>
        {children}
      </CrowdContext.Provider>
    </CrowdMetaContext.Provider>
  );
}

CrowdProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/** Hook for live zone/queue/alert data — updates on simulation ticks. */
export function useCrowdData() {
  const rawCrowd = useContext(CrowdContext);
  const rawMeta = useContext(CrowdMetaContext);
  const ctx = rawCrowd ?? fallbackCrowd;
  const meta = rawMeta ?? fallbackMeta;

  if (import.meta.env.DEV && (!rawCrowd || !rawMeta)) {
    console.warn('[CrowdContext] useCrowdData called outside CrowdProvider. Using safe fallback values.');
  }

  // Merge meta values so existing call-sites need zero changes
  return { ...ctx, ...meta };
}

/**
 * Lightweight hook for components that only need stable flags.
 * Does NOT re-render on zone/queue/alert data changes.
 */
export function useCrowdMeta() {
  const ctx = useContext(CrowdMetaContext);
  if (ctx) return ctx;

  if (import.meta.env.DEV) {
    console.warn('[CrowdContext] useCrowdMeta called outside CrowdProvider. Using fallback meta values.');
  }

  return fallbackMeta;
}
