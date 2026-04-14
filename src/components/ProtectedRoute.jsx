import { Navigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute
 * ===============
 * Wraps a route element:
 *   - While auth resolves → shows a spinner
 *   - Unauthenticated → redirects to /login, preserving intended destination
 *   - Authenticated → renders children
 *
 * Usage in App.jsx:
 *   <Route path="admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
 */
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Still resolving Firebase auth state — show spinner to avoid flash
  if (loading) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4 text-textMuted"
        >
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
              className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary"
            />
          </div>
          <p className="text-xs font-black uppercase tracking-widest">Verifying Access</p>
        </motion.div>
      </div>
    );
  }

  // Not logged in — redirect preserving the route they tried to hit
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};
