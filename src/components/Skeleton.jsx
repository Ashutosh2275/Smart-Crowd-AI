import { memo } from 'react';
import PropTypes from 'prop-types';
import { cn } from '../utils/cn';

export const Skeleton = memo(function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-surfaceHover border border-border/10", className)}
      {...props}
    />
  );
});

Skeleton.propTypes = {
  className: PropTypes.string,
};
