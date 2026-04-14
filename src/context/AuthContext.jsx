import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { loginAdmin, logoutAdmin, observeAuthState } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(undefined); // undefined = resolving
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    const unsubscribe = observeAuthState(currentUser => {
      setUser(currentUser ?? null);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async (email, password) => {
    setError(null);
    setLoading(true);
    try {
      await loginAdmin(email, password);
      // observer will update `user` reactively
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setError(null);
    await logoutAdmin();
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, signIn, signOut, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
