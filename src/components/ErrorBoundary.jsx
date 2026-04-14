import { Component } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp, Terminal } from 'lucide-react';

/**
 * ErrorBoundary
 * ==============
 * Class component — must remain a class, React error boundaries don't support hooks.
 *
 * Props:
 *   children       — subtree to guard
 *   fallback       — optional custom JSX fallback (overrides the built-in UI)
 *   context        — short label shown in the error card, e.g. "Dashboard Charts"
 *   onError        — optional (err, info) => void callback for external logging
 *
 * Features:
 *   • Catches render, lifecycle, and constructor errors in child tree
 *   • Logs error + component stack to console.error
 *   • Friendly card UI with retry button (resets boundary state)
 *   • Expandable component stack for developer inspection
 *   • Forwards to optional `onError` prop for Sentry / Firebase Crashlytics etc.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError:    false,
      error:       null,
      errorInfo:   null,
      showStack:   false,
      retryCount:  0,
    };
    this.handleRetry   = this.handleRetry.bind(this);
    this.toggleStack   = this.toggleStack.bind(this);
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });

    // Always log — visible in DevTools even in production
    console.error(
      `[ErrorBoundary] Caught in "${this.props.context ?? 'unknown'}" section:\n`,
      error,
      '\nComponent stack:',
      errorInfo?.componentStack ?? '—'
    );

    // Forward to optional external logger (Sentry, Firebase, etc.)
    if (typeof this.props.onError === 'function') {
      this.props.onError(error, errorInfo);
    }
  }

  // ── Handlers ────────────────────────────────────────────────────────────────

  handleRetry() {
    this.setState(prev => ({
      hasError:   false,
      error:      null,
      errorInfo:  null,
      showStack:  false,
      retryCount: prev.retryCount + 1,
    }));
  }

  toggleStack() {
    this.setState(prev => ({ showStack: !prev.showStack }));
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  render() {
    if (!this.state.hasError) {
      // key forces a full remount on retry, clearing any lingering child state
      return (
        <RetryKeyWrapper key={this.state.retryCount}>
          {this.props.children}
        </RetryKeyWrapper>
      );
    }

    // Custom fallback prop takes priority
    if (this.props.fallback) return this.props.fallback;

    const { error, errorInfo, showStack } = this.state;
    const context    = this.props.context ?? 'Application Section';
    const message    = error?.message ?? 'An unexpected error occurred.';
    const stack      = errorInfo?.componentStack ?? '';

    return (
      <ErrorCard
        context={context}
        message={message}
        stack={stack}
        showStack={showStack}
        onRetry={this.handleRetry}
        onToggleStack={this.toggleStack}
      />
    );
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.node,
  context: PropTypes.string,
  onError: PropTypes.func,
};


// ── Pure helper — forces remount via `key` on retry ──────────────────────────
function RetryKeyWrapper({ children }) {
  return children;
}

RetryKeyWrapper.propTypes = {
  children: PropTypes.node.isRequired,
};


// ── Presentational error card (functional — easier to style) ─────────────────
function ErrorCard({ context, message, stack, showStack, onRetry, onToggleStack }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="w-full rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-500/10 to-red-500/5 p-6 shadow-lg shadow-red-500/5"
      role="alert"
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="shrink-0 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="w-5 h-5 text-red-400" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-red-400/70 mb-0.5">
                {context}
              </p>
              <h3 className="text-sm font-black text-white">Something went wrong</h3>
            </div>

            {/* Retry button */}
            <button
              onClick={onRetry}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-red-400 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>

          {/* Message */}
          <p className="text-xs text-red-300/80 leading-relaxed font-mono bg-black/20 rounded-lg px-3 py-2 border border-red-500/10 break-all">
            {message}
          </p>

          {/* Stack toggle */}
          {stack && (
            <div className="mt-3">
              <button
                onClick={onToggleStack}
                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-textMuted hover:text-white transition-colors"
              >
                <Terminal className="w-3 h-3" />
                {showStack ? 'Hide' : 'Show'} component stack
                {showStack
                  ? <ChevronUp className="w-3 h-3" />
                  : <ChevronDown className="w-3 h-3" />
                }
              </button>

              {showStack && (
                <motion.pre
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 text-[9px] font-mono text-textMuted/60 bg-black/30 border border-border/30 rounded-xl p-3 overflow-x-auto max-h-48 whitespace-pre-wrap styled-scrollbar"
                >
                  {stack.trim()}
                </motion.pre>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

ErrorCard.propTypes = {
  context: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  stack: PropTypes.string.isRequired,
  showStack: PropTypes.bool.isRequired,
  onRetry: PropTypes.func.isRequired,
  onToggleStack: PropTypes.func.isRequired,
};
