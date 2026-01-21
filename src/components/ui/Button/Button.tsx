import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import './Button.scss';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      asChild = false,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';

    const buttonClasses = [
      'button',
      `button--${variant}`,
      `button--${size}`,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return <Comp className={buttonClasses} ref={ref} type={type} {...props} />;
  }
);

Button.displayName = 'Button';

export { Button };
