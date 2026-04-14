import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const listeners = new Set();
let nextToastId = 0;

function normalizeToast(input, variant) {
  if (typeof input === 'string') {
    return { message: input, variant };
  }

  return {
    title: input?.title ?? '',
    message: input?.message ?? '',
    variant: input?.variant ?? variant,
    duration: input?.duration,
  };
}

function emitToast(input, variant = 'info') {
  const toast = {
    id: `toast-${++nextToastId}`,
    title: '',
    message: '',
    variant,
    duration: 4500,
    ...normalizeToast(input, variant),
  };

  listeners.forEach(listener => listener({ type: 'add', toast }));
  return toast.id;
}

export const toast = {
  success: (input) => emitToast(input, 'success'),
  error: (input) => emitToast(input, 'error'),
  info: (input) => emitToast(input, 'info'),
  warning: (input) => emitToast(input, 'warning'),
  dismiss: (id) => listeners.forEach(listener => listener({ type: 'remove', id })),
  clear: () => listeners.forEach(listener => listener({ type: 'clear' })),
};

const ToastContext = createContext(null);

function ToastIcon({ variant }) {
  if (variant === 'success') return <CheckCircle2 className="h-4 w-4" />;
  if (variant === 'error') return <AlertTriangle className="h-4 w-4" />;
  return <Info className="h-4 w-4" />;
}

ToastIcon.propTypes = {
  variant: PropTypes.oneOf(['success', 'error', 'info', 'warning']).isRequired,
};

function ToastItem({ toastItem, onDismiss }) {
  const toneClasses = {
    success: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-100',
    error: 'border-red-500/25 bg-red-500/10 text-red-100',
    warning: 'border-amber-500/25 bg-amber-500/10 text-amber-100',
    info: 'border-primary/25 bg-primary/10 text-white',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.98 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-2xl shadow-black/25 backdrop-blur-xl ${toneClasses[toastItem.variant] ?? toneClasses.info}`}
    >
      <div className="mt-0.5 shrink-0 rounded-full bg-black/20 p-2 text-current">
        <ToastIcon variant={toastItem.variant} />
      </div>

      <div className="min-w-0 flex-1">
        {toastItem.title && <p className="text-xs font-black uppercase tracking-widest">{toastItem.title}</p>}
        <p className="text-sm leading-relaxed text-current/95">{toastItem.message}</p>
      </div>

      <button
        type="button"
        onClick={() => onDismiss(toastItem.id)}
        className="rounded-lg p-1 text-current/70 transition-colors hover:bg-black/20 hover:text-current"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

ToastItem.propTypes = {
  toastItem: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string,
    message: PropTypes.string.isRequired,
    variant: PropTypes.oneOf(['success', 'error', 'info', 'warning']).isRequired,
  }).isRequired,
  onDismiss: PropTypes.func.isRequired,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const removeToast = useCallback((id) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts(prev => prev.filter(item => item.id !== id));
  }, []);

  useEffect(() => {
    const timers = timersRef.current;

    const listener = (event) => {
      if (event.type === 'add') {
        setToasts(prev => {
          const nextToasts = [event.toast, ...prev].slice(0, 4);
          return nextToasts;
        });

        if (event.toast.duration !== 0) {
          const timer = window.setTimeout(() => removeToast(event.toast.id), event.toast.duration ?? 4500);
          timers.set(event.toast.id, timer);
        }
      }

      if (event.type === 'remove') {
        removeToast(event.id);
      }

      if (event.type === 'clear') {
        timers.forEach(timer => clearTimeout(timer));
        timers.clear();
        setToasts([]);
      }
    };

    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      timers.forEach(timer => clearTimeout(timer));
      timers.clear();
    };
  }, [removeToast]);

  const value = useMemo(() => ({
    toasts,
    dismissToast: removeToast,
  }), [toasts, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {typeof document !== 'undefined' && createPortal(
        <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(92vw,24rem)] flex-col gap-3">
          <AnimatePresence initial={false}>
            {toasts.map(item => (
              <ToastItem key={item.id} toastItem={item} onDismiss={removeToast} />
            ))}
          </AnimatePresence>
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

ToastProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return {
    ...ctx,
    toast,
  };
}
