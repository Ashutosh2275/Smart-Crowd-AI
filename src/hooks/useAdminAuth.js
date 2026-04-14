/**
 * useAdminAuth hook
 * ==================
 * Manages Firebase admin authentication state.
 * Provides login, logout, and reactive current-user tracking.
 *
 * Usage (in AdminLogin component or Admin page guard):
 *   const { user, loading, error, signIn, signOut } = useAdminAuth();
 */

import { useState, useEffect } from 'react';
import { onAdminAuthChange, adminSignIn, adminSignOut } from '../config/firebase';

export function useAdminAuth() {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);  // true while Firebase resolves initial state
  const [error,   setError]   = useState(null);

  useEffect(() => {
    // Firebase resolves auth state asynchronously on page load
    const unsubscribe = onAdminAuthChange(currentUser => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async (email, password) => {
    setError(null);
    setLoading(true);
    try {
      await adminSignIn(email, password);
      // onAdminAuthChange will update `user` reactively
    } catch (err) {
      setError(err.message ?? 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setError(null);
    try {
      await adminSignOut();
    } catch (err) {
      setError(err.message ?? 'Sign-out failed');
    }
  };

  return { user, loading, error, signIn, signOut, isAuthenticated: !!user };
}
