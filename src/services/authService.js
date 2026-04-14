/**
 * Auth Service — Smart Crowd AI
 * ================================
 * Clean service layer over Firebase Authentication.
 * Consumed by useAdminAuth hook and AdminLogin component.
 *
 * When Firebase is NOT configured (placeholder credentials),
 * falls back to a local demo login so the app remains usable.
 *
 * DEMO credentials (mock mode):
 *  Email:    admin@smartcrowd.ai
 *  Password: admin123
 */

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../config/firebase';

// ── Detect if real Firebase credentials are present ───────────────────────────
function isFirebaseConfigured() {
  try {
    const projectId = auth?.app?.options?.projectId ?? '';
    return projectId.length > 0 && !projectId.includes('YOUR_');
  } catch {
    return false;
  }
}

// ── Local demo session (mock mode only) ───────────────────────────────────────
const DEMO_EMAIL    = 'admin@smartcrowd.ai';
const DEMO_PASSWORD = 'admin123';
const DEMO_USER     = {
  uid:         'demo-admin-uid',
  email:       DEMO_EMAIL,
  displayName: 'Admin User',
  isDemo:      true,
};

let _mockUser     = null;
let _mockListener = null;

/** Notify the active auth observer (mock mode). */
function _notifyMock(user) {
  _mockUser = user;
  if (typeof _mockListener === 'function') _mockListener(user);
}


// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC SERVICE FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sign in with email + password.
 * Uses Firebase when configured; falls back to demo check in mock mode.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ user: Object }>}
 * @throws {Error} with a human-friendly `message` on failure
 */
export async function loginAdmin(email, password) {
  if (!isFirebaseConfigured()) {
    // Demo mode validation
    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      _notifyMock(DEMO_USER);
      return { user: DEMO_USER };
    }
    throw new Error(`Invalid credentials.\nDemo login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  }

  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return { user: credential.user };
  } catch (err) {
    // Map Firebase error codes to friendly messages
    const friendly = {
      'auth/user-not-found':     'No admin account found for this email.',
      'auth/wrong-password':     'Incorrect password. Please try again.',
      'auth/invalid-credential': 'Invalid email or password.',
      'auth/too-many-requests':  'Too many failed attempts. Please wait a moment.',
      'auth/network-request-failed': 'Network error — check your connection.',
    };
    throw new Error(friendly[err.code] ?? err.message);
  }
}

/**
 * Sign out the current admin user.
 */
export async function logoutAdmin() {
  if (!isFirebaseConfigured()) {
    _notifyMock(null);
    return;
  }
  await signOut(auth);
}

/**
 * Attach an observer that fires whenever auth state changes.
 * Returns an unsubscribe function — call it in useEffect cleanup.
 *
 * @param {Function} callback  (user: Object | null) => void
 * @returns {Function} unsubscribe
 */
export function observeAuthState(callback) {
  if (!isFirebaseConfigured()) {
    // Register the single mock listener
    _mockListener = callback;
    // Fire immediately with current state
    callback(_mockUser);
    return () => { _mockListener = null; };
  }

  return onAuthStateChanged(auth, callback);
}

/**
 * Returns the currently signed-in user synchronously (or null).
 * Useful for one-off checks outside of React.
 */
export function getCurrentUser() {
  if (!isFirebaseConfigured()) return _mockUser;
  return auth.currentUser;
}
