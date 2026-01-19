import * as React from 'react';
import './Badge.scss';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | 'default'
    | 'secondary'
    | 'destructive'
    | 'outline'
    | 'success'
    | 'info'
    | 'warning';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div className={`badge badge--${variant} ${className || ''}`} {...props} />
  );
}

export { Badge };
