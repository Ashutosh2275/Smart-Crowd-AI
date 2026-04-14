/**
 * Firebase Configuration — Smart Crowd AI
 * =========================================
 * SETUP INSTRUCTIONS:
 *  1. Go to https://console.firebase.google.com
 *  2. Create a project (or open an existing one)
 *  3. Click "Add app" → Web (</>)
 *  4. Register the app and copy the firebaseConfig object
 *  5. Replace the placeholder values below with your real config
 *  6. In Firebase Console: enable Firestore (Build → Firestore Database)
 *  7. (Optional) Enable Authentication (Build → Authentication → Sign-in method → Email/Password)
 *
 * ⚠️  Never commit real API keys to a public repository.
 *     Use environment variables in production:
 *       VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, etc.
 */

import { initializeApp } from 'firebase/app';
import appConfig from './appConfig';
import {
  getFirestore,
  collection,
  doc,
  onSnapshot,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';

// ── Firebase project config ───────────────────────────────────────────────────
// Replace each value with the credentials from your Firebase Console project.
// Use import.meta.env.VITE_* variables in production builds.

const firebaseConfig = {
  apiKey:            appConfig.firebase.apiKey            ?? 'YOUR_API_KEY',
  authDomain:        appConfig.firebase.authDomain        ?? 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId:         appConfig.firebase.projectId         ?? 'YOUR_PROJECT_ID',
  storageBucket:     appConfig.firebase.storageBucket     ?? 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: appConfig.firebase.messagingSenderId ?? 'YOUR_SENDER_ID',
  appId:             appConfig.firebase.appId             ?? 'YOUR_APP_ID',
};

function hasRealFirebaseValue(value) {
  return typeof value === 'string' && value.length > 0 && !value.includes('YOUR_');
}

const FIREBASE_AUTH_CONFIGURED = hasRealFirebaseValue(firebaseConfig.apiKey)
  && hasRealFirebaseValue(firebaseConfig.projectId);

// ── Initialise Firebase ───────────────────────────────────────────────────────
const app  = initializeApp(firebaseConfig);
const db   = getFirestore(app);
const auth = FIREBASE_AUTH_CONFIGURED ? getAuth(app) : null;

// ── Collection names (single source of truth) ─────────────────────────────────
export const COLLECTIONS = {
  ZONES:  'zones',
  QUEUES: 'queues',
  ALERTS: 'alerts',
};

// ─────────────────────────────────────────────────────────────────────────────
// FIRESTORE REAL-TIME LISTENERS
// Each function accepts a callback and returns an unsubscribe function.
// Call the returned function inside a React useEffect cleanup.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Subscribe to real-time zone updates from Firestore.
 * @param {Function} onData   (zones: Array) => void
 * @param {Function} onError  (err: Error) => void
 * @returns {Function} unsubscribe
 */
export function subscribeToZones(onData, onError) {
  const ref = collection(db, COLLECTIONS.ZONES);
  return onSnapshot(
    ref,
    snapshot => {
      const zones = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      onData(zones);
    },
    onError ?? console.error
  );
}

/**
 * Subscribe to real-time queue updates from Firestore.
 */
export function subscribeToQueues(onData, onError) {
  const ref = collection(db, COLLECTIONS.QUEUES);
  return onSnapshot(
    ref,
    snapshot => {
      const queues = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      onData(queues);
    },
    onError ?? console.error
  );
}

/**
 * Subscribe to real-time alert updates from Firestore.
 */
export function subscribeToAlerts(onData, onError) {
  const ref = collection(db, COLLECTIONS.ALERTS);
  return onSnapshot(
    ref,
    snapshot => {
      const alerts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      onData(alerts);
    },
    onError ?? console.error
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FIRESTORE WRITE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Overwrite a zone document (upsert). */
export async function writeZone(zone) {
  const ref = doc(db, COLLECTIONS.ZONES, zone.id);
  await setDoc(ref, { ...zone, updatedAt: serverTimestamp() }, { merge: true });
}

/** Write a new alert document. Returns the new document ID. */
export async function writeAlert(alert) {
  const ref = collection(db, COLLECTIONS.ALERTS);
  const docRef = await addDoc(ref, {
    ...alert,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/** Update specific fields on a queue document. */
export async function updateQueue(queueId, fields) {
  const ref = doc(db, COLLECTIONS.QUEUES, queueId);
  await updateDoc(ref, { ...fields, updatedAt: serverTimestamp() });
}

/** Delete an alert document by ID. */
export async function deleteAlert(alertId) {
  const ref = doc(db, COLLECTIONS.ALERTS, alertId);
  await deleteDoc(ref);
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTHENTICATION HELPERS (Admin access only)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sign in an admin user with email + password.
 * @returns {Promise<import('firebase/auth').UserCredential>}
 */
export async function adminSignIn(email, password) {
  if (!auth) throw new Error('Firebase Auth is not configured.');
  return signInWithEmailAndPassword(auth, email, password);
}

/** Sign out the current user. */
export async function adminSignOut() {
  if (!auth) return;
  return signOut(auth);
}

/**
 * Subscribe to auth state changes.
 * @param {Function} callback (user: User | null) => void
 * @returns {Function} unsubscribe
 */
export function onAdminAuthChange(callback) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

// ─────────────────────────────────────────────────────────────────────────────
// Named exports for direct use
// ─────────────────────────────────────────────────────────────────────────────
export { app, db, auth };
