import { memo } from 'react';
import PropTypes from 'prop-types';
import { cn } from '../utils/cn';

export const Card = memo(function Card({ 
  title = '', 
  subtitle = '',
  children, 
  className = '',
  headerAction = null,
  glowing = false,
  icon: Icon = null,
  noPadding = false,
}) {
  return (
    <div className={cn(
      "glass rounded-2xl shadow-card transition-all duration-300 relative overflow-hidden",
      glowing && "card-glow data-border",
      noPadding ? "" : "p-6",
      className
    )}>
      {/* Subtle inner top highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

      {title && (
        <div className={cn("flex items-center justify-between mb-5", noPadding && "px-6 pt-6")}>
          <div className="flex items-center gap-2.5">
            {Icon && (
              <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
                <Icon className="w-4 h-4 text-primary" />
              </div>
            )}
            <div>
              <h3 className="text-[13px] font-black uppercase tracking-[0.18em] text-white leading-none">
                {title}
              </h3>
              {subtitle && (
                <p className="text-[10px] text-textMuted mt-1 font-medium tracking-wide">{subtitle}</p>
              )}
            </div>
          </div>
          {headerAction && (
            <div className="shrink-0">{headerAction}</div>
          )}
        </div>
      )}

      <div className="w-full">
        {children}
      </div>
    </div>
  );
});

Card.propTypes = {
  title:        PropTypes.node,
  subtitle:     PropTypes.string,
  children:     PropTypes.node.isRequired,
  className:    PropTypes.string,
  headerAction: PropTypes.node,
  glowing:      PropTypes.bool,
  icon:         PropTypes.elementType,
  noPadding:    PropTypes.bool,
};
