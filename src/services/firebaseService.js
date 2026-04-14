/**
 * Firebase Service Layer — Smart Crowd AI
 * ==========================================
 * Clean, high-level service functions consumed by CrowdContext.
 * Sits between the raw firebase.js config helpers and application logic.
 *
 * All functions degrade gracefully when Firebase is not yet configured
 * (i.e., credentials still contain 'YOUR_' placeholders) and emit a
 * clear console warning rather than crashing the app.
 *
 * Exported functions:
 *  saveCrowdData(zoneData)        — upsert a zone document in Firestore
 *  getCrowdData()                 — one-time fetch of all zones
 *  subscribeToUpdates(callback)   — real-time listener for zones + queues + alerts
 *  saveAlert(alertData)           — write a new alert to Firestore
 *  getAlerts()                    — one-time fetch of all alerts
 *  deleteAlertById(id)            — remove an alert document
 *  saveQueue(queueData)           — upsert a queue document
 *  getQueues()                    — one-time fetch of all queues
 *  seedInitialData(zones, queues, alerts) — bulk-write mock data on first run
 */

import {
  db,
  COLLECTIONS,
  subscribeToZones,
  subscribeToQueues,
  subscribeToAlerts,
  writeZone,
  writeAlert,
  deleteAlert,
} from '../config/firebase';

import {
  collection,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  deleteDoc,
} from 'firebase/firestore';

// ── Guards ────────────────────────────────────────────────────────────────────

/** Returns true if the project looks like it has real credentials. */
function isFirebaseConfigured() {
  try {
    return (
      db &&
      db.app.options.projectId &&
      !db.app.options.projectId.includes('YOUR_')
    );
  } catch {
    return false;
  }
}

function warnNotConfigured(caller) {
  console.warn(
    `[firebaseService.${caller}] Firebase is not yet configured.\n` +
    'Copy .env.example → .env.local and fill in your project credentials.'
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// ZONE SERVICES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Upsert (save or update) a single zone document in Firestore.
 * Uses the zone's `id` field as the document ID for deterministic addressing.
 *
 * @param {Object} zoneData — { id, name, density, capacity, ...any }
 */
export async function saveCrowdData(zoneData) {
  if (!isFirebaseConfigured()) { warnNotConfigured('saveCrowdData'); return; }

  try {
    await writeZone(zoneData);
  } catch (err) {
    console.error('[firebaseService.saveCrowdData]', err);
    throw err;
  }
}

/**
 * One-time fetch of all zone documents (not real-time).
 * Prefer subscribeToUpdates() for live data.
 *
 * @returns {Promise<Array>} array of zone objects
 */
export async function getCrowdData() {
  if (!isFirebaseConfigured()) { warnNotConfigured('getCrowdData'); return []; }

  try {
    const ref  = collection(db, COLLECTIONS.ZONES);
    const snap = await getDocs(ref);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error('[firebaseService.getCrowdData]', err);
    throw err;
  }
}

/**
 * Attach real-time Firestore listeners for zones, queues, and alerts.
 * Fires `callback({ zones, queues, alerts })` whenever any collection changes.
 * Returns a single cleanup function that unsubscribes all three listeners.
 *
 * @param {Function} callback — ({ zones, queues, alerts }) => void
 * @param {Function} [onError]
 * @returns {Function} unsubscribeAll
 */
export function subscribeToUpdates(callback, onError) {
  if (!isFirebaseConfigured()) {
    warnNotConfigured('subscribeToUpdates');
    return () => {}; // no-op cleanup
  }

  // Accumulate partial updates from each collection
  const latest = { zones: [], queues: [], alerts: [] };
  let flushScheduled = false;

  const flush = () => {
    if (flushScheduled) return;
    flushScheduled = true;
    queueMicrotask(() => {
      flushScheduled = false;
      callback({ ...latest });
    });
  };

  const unsubZones  = subscribeToZones(
    data  => { latest.zones  = data; flush(); },
    onError ?? console.error
  );
  const unsubQueues = subscribeToQueues(
    data  => { latest.queues = data; flush(); },
    onError ?? console.error
  );
  const unsubAlerts = subscribeToAlerts(
    data  => { latest.alerts = data; flush(); },
    onError ?? console.error
  );

  return () => {
    unsubZones();
    unsubQueues();
    unsubAlerts();
  };
}


// ─────────────────────────────────────────────────────────────────────────────
// ALERT SERVICES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Persist a new alert to Firestore.
 * Returns the Firestore-assigned document ID.
 *
 * @param {Object} alertData — { type, message, zone, priority, timestamp }
 * @returns {Promise<string|null>} new document ID, or null if unconfigured
 */
export async function saveAlert(alertData) {
  if (!isFirebaseConfigured()) { warnNotConfigured('saveAlert'); return null; }

  try {
    const id = await writeAlert({
      ...alertData,
      timestamp: alertData.timestamp ?? new Date().toISOString(),
    });
    return id;
  } catch (err) {
    console.error('[firebaseService.saveAlert]', err);
    throw err;
  }
}

/**
 * One-time fetch of all alerts, ordered by creation time (newest first).
 *
 * @param {number} [maxResults=50]
 * @returns {Promise<Array>}
 */
export async function getAlerts(maxResults = 50) {
  if (!isFirebaseConfigured()) { warnNotConfigured('getAlerts'); return []; }

  try {
    const ref  = collection(db, COLLECTIONS.ALERTS);
    const q    = query(ref, orderBy('createdAt', 'desc'), limit(maxResults));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error('[firebaseService.getAlerts]', err);
    throw err;
  }
}

/**
 * Delete an alert document by its Firestore document ID.
 *
 * @param {string} alertId
 */
export async function deleteAlertById(alertId) {
  if (!isFirebaseConfigured()) { warnNotConfigured('deleteAlertById'); return; }

  try {
    await deleteAlert(alertId);
  } catch (err) {
    console.error('[firebaseService.deleteAlertById]', err);
    throw err;
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// QUEUE SERVICES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Upsert a queue document by its `id` field.
 *
 * @param {Object} queueData — { id, name, waitTime, queueLength }
 */
export async function saveQueue(queueData) {
  if (!isFirebaseConfigured()) { warnNotConfigured('saveQueue'); return; }

  try {
    const ref = doc(db, COLLECTIONS.QUEUES, queueData.id);
    await setDoc(ref, { ...queueData, updatedAt: serverTimestamp() }, { merge: true });
  } catch (err) {
    console.error('[firebaseService.saveQueue]', err);
    throw err;
  }
}

/**
 * One-time fetch of all queue documents.
 *
 * @returns {Promise<Array>}
 */
export async function getQueues() {
  if (!isFirebaseConfigured()) { warnNotConfigured('getQueues'); return []; }

  try {
    const ref  = collection(db, COLLECTIONS.QUEUES);
    const snap = await getDocs(ref);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error('[firebaseService.getQueues]', err);
    throw err;
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// SEED HELPER — run once to push mock data into an empty Firestore DB
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Bulk-write initial mock data sets to Firestore.
 * Safe to call on first launch — uses setDoc with merge:true so existing
 * documents are not overwritten.
 *
 * @param {Array} zones
 * @param {Array} queues
 * @param {Array} alerts
 */
export async function seedInitialData(zones, queues, alerts) {
  if (!isFirebaseConfigured()) { warnNotConfigured('seedInitialData'); return; }

  try {
    const existingZones = await getDocs(query(collection(db, COLLECTIONS.ZONES), limit(1)));
    if (!existingZones.empty) {
      return;
    }

    const zoneWrites  = zones.map(z => {
      const ref = doc(db, COLLECTIONS.ZONES, z.id);
      return setDoc(ref, { ...z, updatedAt: serverTimestamp() }, { merge: true });
    });

    const queueWrites = queues.map(q => {
      const ref = doc(db, COLLECTIONS.QUEUES, q.id);
      return setDoc(ref, { ...q, updatedAt: serverTimestamp() }, { merge: true });
    });

    const alertWrites = alerts.map(a => {
      const ref = doc(db, COLLECTIONS.ALERTS, a.id);
      return setDoc(ref, { ...a, createdAt: serverTimestamp() }, { merge: true });
    });

    await Promise.all([...zoneWrites, ...queueWrites, ...alertWrites]);
    console.info('[firebaseService.seedInitialData] ✓ Seeded Firestore with initial data.');
  } catch (err) {
    console.error('[firebaseService.seedInitialData]', err);
  }
}

/**
 * Delete all zone, queue, and alert documents in the configured Firestore instance.
 */
export async function clearAllData() {
  if (!isFirebaseConfigured()) { warnNotConfigured('clearAllData'); return; }

  try {
    const [zoneSnap, queueSnap, alertSnap] = await Promise.all([
      getDocs(collection(db, COLLECTIONS.ZONES)),
      getDocs(collection(db, COLLECTIONS.QUEUES)),
      getDocs(collection(db, COLLECTIONS.ALERTS)),
    ]);

    await Promise.all([
      ...zoneSnap.docs.map(docSnapshot => deleteDoc(doc(db, COLLECTIONS.ZONES, docSnapshot.id))),
      ...queueSnap.docs.map(docSnapshot => deleteDoc(doc(db, COLLECTIONS.QUEUES, docSnapshot.id))),
      ...alertSnap.docs.map(docSnapshot => deleteDoc(doc(db, COLLECTIONS.ALERTS, docSnapshot.id))),
    ]);
  } catch (err) {
    console.error('[firebaseService.clearAllData]', err);
    throw err;
  }
}
