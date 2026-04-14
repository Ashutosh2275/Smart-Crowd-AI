import { memo, useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../utils/cn';

const alertConfig = {
  info: {
    icon: Info,
    containerClass: 'bg-indigo-500/10 border-indigo-500/20 shadow-[inset_4px_0_0_0_rgba(99,102,241,1)]',
    iconClass: 'text-indigo-400 bg-indigo-500/20',
    dotClass: 'bg-indigo-400',
    titleClass: 'text-indigo-100',
  },
  warning: {
    icon: AlertTriangle,
    containerClass: 'bg-amber-500/10 border-amber-500/20 shadow-[inset_4px_0_0_0_rgba(245,158,11,1)]',
    iconClass: 'text-amber-400 bg-amber-500/20',
    dotClass: 'bg-amber-400',
    titleClass: 'text-amber-100',
  },
  critical: {
    icon: AlertCircle,
    containerClass: 'bg-red-500/10 border-red-500/25 shadow-[inset_4px_0_0_0_rgba(239,68,68,1)]',
    iconClass: 'text-red-400 bg-red-500/20',
    dotClass: 'bg-red-400 critical-pulse',
    titleClass: 'text-red-100',
  }
};

export const AlertBanner = memo(function AlertBanner({ 
  id, 
  type = 'info', 
  message, 
  timestamp, 
  onDismiss 
}) {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
  }, []);

  const handleAnimationComplete = useCallback(() => {
    if (!isVisible && onDismiss && id) {
      onDismiss(id);
    }
  }, [isVisible, onDismiss, id]);

  useEffect(() => {
    const timer = setTimeout(handleDismiss, 12000); // slightly longer for reading
    return () => clearTimeout(timer);
  }, [handleDismiss]);

  const config = alertConfig[type] || alertConfig.info;
  const Icon = config.icon;
  const timeString = timestamp 
    ? formatDistanceToNow(new Date(timestamp), { addSuffix: true }) 
    : 'just now';

  return (
    <AnimatePresence onExitComplete={handleAnimationComplete}>
      {isVisible && (
        <motion.div
          layout
          initial={{ opacity: 0, x: -30, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.7}
          onDragEnd={(e, { offset, velocity }) => {
            if (offset.x > 100 || velocity.x > 500) {
              handleDismiss();
            }
          }}
          className={cn(
            "relative w-full rounded-r-xl border-y border-r p-4 mb-3 backdrop-blur-md transition-shadow",
            "hover:shadow-lg touch-pan-y cursor-grab active:cursor-grabbing",
            config.containerClass
          )}
        >
          <div className="flex items-start gap-3.5">
            <div className={cn("p-2 rounded-lg shrink-0 border border-white/5", config.iconClass)}>
              <Icon className="w-4 h-4" />
            </div>
            
            <div className="flex-1 pr-6">
              <div className="flex items-center gap-2 mb-1">
                <div className={cn("w-1.5 h-1.5 rounded-full", config.dotClass)} />
                <span className={cn("text-[10px] font-black uppercase tracking-widest leading-none", config.titleClass)}>
                  {type}
                </span>
                <span className="text-[10px] font-bold text-white/40 tracking-wider">·</span>
                <span className="text-[10px] font-bold text-white/40 tracking-wider data-value">
                  {timeString}
                </span>
              </div>
              <p className="text-sm font-medium text-white/90 leading-relaxed pr-2">
                {message}
              </p>
            </div>
            
            <button 
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/40 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

AlertBanner.propTypes = {
  id: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['info', 'warning', 'critical']),
  message: PropTypes.node.isRequired,
  timestamp: PropTypes.string,
  onDismiss: PropTypes.func,
};
