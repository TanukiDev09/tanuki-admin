/**
 * Tanuki Admin - Design System Type Definitions
 *
 * This file provides TypeScript types for the design system variables
 * defined in globals.css. Use these types for type-safe component development.
 */

// ============================================
// COLOR TYPES
// ============================================

export type SemanticColor = 'success' | 'danger' | 'info' | 'warning';

export type ChartColor =
  | 'chart-1'
  | 'chart-2'
  | 'chart-3'
  | 'chart-4'
  | 'chart-5'
  | 'chart-6'
  | 'chart-7'
  | 'chart-8';

export type BaseColor =
  | 'background'
  | 'foreground'
  | 'card'
  | 'card-foreground'
  | 'popover'
  | 'popover-foreground'
  | 'primary'
  | 'primary-foreground'
  | 'secondary'
  | 'secondary-foreground'
  | 'muted'
  | 'muted-foreground'
  | 'accent'
  | 'accent-foreground'
  | 'destructive'
  | 'destructive-foreground'
  | 'border'
  | 'input'
  | 'ring';

export type LegacyColor =
  | 'flow'
  | 'flow-bg'
  | 'ebb'
  | 'ebb-bg'
  | 'balance'
  | 'balance-bg';

export type ColorVariable =
  | BaseColor
  | SemanticColor
  | ChartColor
  | LegacyColor;

// ============================================
// SPACING TYPES
// ============================================

export type SpacingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

export type Spacing = `var(--spacing-${SpacingSize})`;

// ============================================
// TYPOGRAPHY TYPES
// ============================================

export type FontSize =
  | 'xs'
  | 'sm'
  | 'base'
  | 'lg'
  | 'xl'
  | '2xl'
  | '3xl'
  | '4xl';

export type FontWeight = 'normal' | 'medium' | 'semibold' | 'bold';

export type LineHeight = 'tight' | 'normal' | 'relaxed';

// ============================================
// SHADOW TYPES
// ============================================

export type ShadowSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export type Shadow = `var(--shadow-${ShadowSize})`;

// ============================================
// BORDER RADIUS TYPES
// ============================================

export type RadiusSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

export type Radius = `var(--radius-${RadiusSize})`;

// ============================================
// ICON TYPES
// ============================================

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type IconCircleVariant = 'success' | 'danger' | 'info' | 'muted';

// ============================================
// COMPONENT TYPES
// ============================================

export type StatCardVariant = 'success' | 'danger' | 'info';

export type BadgeVariant = 'success' | 'danger' | 'info' | 'warning';

export type ChartHeight = 'sm' | 'md' | 'lg';

// ============================================
// TRANSITION TYPES
// ============================================

export type TransitionSpeed = 'fast' | 'base' | 'slow';

// ============================================
// COMPONENT PROPS INTERFACES
// ============================================

export interface StatCardProps {
  variant: StatCardVariant;
  value: string | number;
  label: string;
  className?: string;
}

export interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export interface IconCircleProps {
  variant: IconCircleVariant;
  children: React.ReactNode;
  size?: IconSize;
  className?: string;
}

export interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export interface ChartContainerProps {
  children: React.ReactNode;
  height?: ChartHeight;
  className?: string;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get a CSS variable value
 * @param variable - The CSS variable name (without --)
 * @returns The CSS variable reference
 */
export function cssVar(variable: string): string {
  return `var(--${variable})`;
}

/**
 * Get a color HSL value
 * @param color - The color variable name
 * @returns The HSL color reference
 */
export function hslColor(color: ColorVariable): string {
  return `hsl(var(--${color}))`;
}

/**
 * Get a spacing value
 * @param size - The spacing size
 * @returns The spacing CSS variable
 */
export function spacing(size: SpacingSize): Spacing {
  return `var(--spacing-${size})`;
}

/**
 * Get a shadow value
 * @param size - The shadow size
 * @returns The shadow CSS variable
 */
export function shadow(size: ShadowSize): Shadow {
  return `var(--shadow-${size})`;
}

/**
 * Get a border radius value
 * @param size - The radius size
 * @returns The radius CSS variable
 */
export function radius(size: RadiusSize): Radius {
  return `var(--radius-${size})`;
}

// ============================================
// DESIGN TOKENS OBJECT
// ============================================

export const DesignTokens = {
  colors: {
    semantic: ['success', 'danger', 'info', 'warning'] as const,
    chart: [
      'chart-1',
      'chart-2',
      'chart-3',
      'chart-4',
      'chart-5',
      'chart-6',
      'chart-7',
      'chart-8',
    ] as const,
  },
  spacing: {
    sizes: ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'] as const,
    values: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '3rem',
      '3xl': '4rem',
    },
  },
  typography: {
    sizes: ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl'] as const,
    weights: ['normal', 'medium', 'semibold', 'bold'] as const,
    lineHeights: ['tight', 'normal', 'relaxed'] as const,
  },
  shadows: {
    sizes: ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const,
  },
  radius: {
    sizes: ['xs', 'sm', 'md', 'lg', 'xl', 'full'] as const,
  },
  icons: {
    sizes: ['xs', 'sm', 'md', 'lg', 'xl'] as const,
  },
} as const;

// ============================================
// EXAMPLE USAGE
// ============================================

/*
// In a React component:

import { hslColor, spacing, shadow, radius, type StatCardProps } from '@/types/design-system';

const StatCard: React.FC<StatCardProps> = ({ variant, value, label, className }) => {
  return (
    <div 
      className={`stat-card-${variant} ${className}`}
      style={{
        padding: spacing('lg'),
        borderRadius: radius('md'),
        boxShadow: shadow('sm'),
      }}
    >
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
};

// Or using the utility classes directly:
<div className="stat-card-success">
  <div className="stat-value">$ 77.454.940</div>
  <div className="stat-label">Entradas Totales</div>
</div>
*/
