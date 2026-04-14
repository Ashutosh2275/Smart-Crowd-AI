/**
 * useFirestore hook
 * ==================
 * Drop-in replacement for CrowdContext's in-memory mock data
 * when a real Firebase project is connected.
 *
 * Usage:
 *   const { zones, queues, alerts, isConnected, error } = useFirestore();
 *
 * Returns the same shape as CrowdContext so swapping is frictionless.
 * Falls back gracefully to empty arrays while connecting or on errors.
 */

import { useState, useEffect } from 'react';
import {
  subscribeToZones,
  subscribeToQueues,
  subscribeToAlerts,
} from '../config/firebase';

export function useFirestore() {
  const [zones,       setZones]       = useState([]);
  const [queues,      setQueues]      = useState([]);
  const [alerts,      setAlerts]      = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error,       setError]       = useState(null);

  useEffect(() => {
    const handleError = (err) => {
      console.error('[useFirestore]', err);
      setError(err.message ?? 'Firebase connection error');
      setIsConnected(false);
    };

    // Attach all three real-time listeners
    const unsubZones  = subscribeToZones(data  => { setZones(data);  setIsConnected(true); }, handleError);
    const unsubQueues = subscribeToQueues(data  => { setQueues(data); setIsConnected(true); }, handleError);
    const unsubAlerts = subscribeToAlerts(data  => { setAlerts(data); setIsConnected(true); }, handleError);

    // Cleanup all three listeners on unmount
    return () => {
      unsubZones();
      unsubQueues();
      unsubAlerts();
    };
  }, []);

  return { zones, queues, alerts, isConnected, error };
}
