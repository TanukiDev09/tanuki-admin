/**
 * Tanuki Admin - Design System Components
 * 
 * Example components demonstrating the use of the design system.
 * These components follow the UI design from the Tanuki Admin dashboard.
 */

import React from 'react';
import type {
  StatCardProps,
  BadgeProps,
  IconCircleProps,
  CardProps,
  ChartContainerProps,
  MovementItemProps
} from '@/types/design-system';

// ============================================
// STAT CARD COMPONENT
// ============================================

/**
 * StatCard - Display financial statistics
 * 
 * @example
 * <StatCard 
 *   variant="success" 
 *   value="$ 77.454.940" 
 *   label="Entradas Totales" 
 * />
 */
export const StatCard: React.FC<StatCardProps> = ({
  variant,
  value,
  label,
  className = ''
}) => {
  return (
    <div className={`stat-card stat-card--${variant} ${className}`}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
};

// ============================================
// BADGE COMPONENT
// ============================================

/**
 * Badge - Status indicator badge
 * 
 * @example
 * <Badge variant="success">Active</Badge>
 */
export const Badge: React.FC<BadgeProps> = ({
  variant,
  children,
  className = ''
}) => {
  return (
    <span className={`badge badge--${variant} ${className}`}>
      {children}
    </span>
  );
};

// ============================================
// ICON CIRCLE COMPONENT
// ============================================

/**
 * IconCircle - Circular icon container
 * 
 * @example
 * <IconCircle variant="success">
 *   <CheckIcon />
 * </IconCircle>
 */
export const IconCircle: React.FC<IconCircleProps> = ({
  variant,
  children,
  className = ''
}) => {
  return (
    <div className={`icon-circle icon-circle--${variant} ${className}`}>
      {children}
    </div>
  );
};

// ============================================
// CARD COMPONENT
// ============================================

/**
 * Card - Standard card container
 * 
 * @example
 * <Card>
 *   <h3>Card Title</h3>
 *   <p>Card content</p>
 * </Card>
 */
export const Card: React.FC<CardProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`card ${className}`}>
      {children}
    </div>
  );
};

// ============================================
// CHART CONTAINER COMPONENT
// ============================================

/**
 * ChartContainer - Container for charts with predefined heights
 * 
 * @example
 * <ChartContainer height="md">
 *   <BarChart data={data} />
 * </ChartContainer>
 */
export const ChartContainer: React.FC<ChartContainerProps> = ({
  children,
  height = 'md',
  className = ''
}) => {
  const heightClass = height !== 'md' ? `chart-container--${height}` : '';

  return (
    <div className={`chart-container ${heightClass} ${className}`}>
      {children}
    </div>
  );
};

import './design-system.scss';

// ... (imports remain)

/**
 * MovementItem - Display a transaction/movement item
 * 
 * @example
 * <MovementItem
 *   icon={<DollarIcon />}
 *   iconVariant="info"
 *   title="Carri Binranto"
 *   description="Material Design list item"
 *   amount="-$ 77.454.940"
 * />
 */
export const MovementItem: React.FC<MovementItemProps> = ({
  icon,
  iconVariant,
  title,
  description,
  amount,
  className = ''
}) => {
  return (
    <div className={`design-system-movement ${className}`}>
      <IconCircle variant={iconVariant}>
        {icon}
      </IconCircle>
      <div className="design-system-movement__content">
        <div className="design-system-movement__title">{title}</div>
        <div className="design-system-movement__description">{description}</div>
      </div>
      <div className="design-system-movement__amount">{amount}</div>
    </div>
  );
};

// ============================================
// DASHBOARD SECTION COMPONENT
// ============================================

export interface DashboardSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * DashboardSection - Section container with title
 * 
 * @example
 * <DashboardSection title="Salud del Negocio">
 *   <StatCard variant="success" value="$ 77.454.940" label="Entradas Totales" />
 * </DashboardSection>
 */
export const DashboardSection: React.FC<DashboardSectionProps> = ({
  title,
  children,
  className = ''
}) => {
  return (
    <div className={`design-system-section ${className}`}>
      <h2 className="design-system-section__title">{title}</h2>
      {children}
    </div>
  );
};

// ============================================
// STAT GRID COMPONENT
// ============================================

export interface StatGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

/**
 * StatGrid - Grid layout for stat cards
 * 
 * @example
 * <StatGrid columns={3}>
 *   <StatCard variant="success" value="$ 77.454.940" label="Entradas Totales" />
 *   <StatCard variant="info" value="$ 62.477.715" label="Disponible Real" />
 *   <StatCard variant="danger" value="$ 62.477.715" label="Salidas Totales" />
 * </StatGrid>
 */
export const StatGrid: React.FC<StatGridProps> = ({
  children,
  columns = 3,
  className = ''
}) => {
  const gridClass = `design-system-grid design-system-grid--cols-${columns}`;

  return (
    <div className={`${gridClass} ${className}`}>
      {children}
    </div>
  );
};

// ============================================
// EXAMPLE USAGE IN A PAGE
// ============================================

/*
export default function DashboardPage() {
  return (
    <div className="design-system-page">
      {/* Business Health Section *\/}
      <DashboardSection title="Salud del Negocio">
        <StatGrid columns={3}>
          <StatCard 
            variant="success" 
            value="$ 77.454.940" 
            label="Entradas Totales" 
          />
          <StatCard 
            variant="info" 
            value="$ 62.477.715" 
            label="Disponible Real" 
          />
          <StatCard 
            variant="danger" 
            value="$ 62.477.715" 
            label="Salidas Totales" 
          />
        </StatGrid>
      </DashboardSection>

      {/* Recent Movements Section *\/}
      <DashboardSection title="Movimientos Recientes">
        <Card>
          <div className="design-system-list">
            <MovementItem
              icon={<span>$</span>}
              iconVariant="info"
              title="Carri Binranto"
              description="Material Design list item"
              amount="-$ 77.454.940"
            />
            <MovementItem
              icon={<span>B</span>}
              iconVariant="danger"
              title="Departamento"
              description="Material Design list item"
              amount="-$ 77.454.940"
            />
            <MovementItem
              icon={<span>✓</span>}
              iconVariant="success"
              title="Resuvmiconme"
              description="Material Design list item"
              amount="-$ 62.477.715"
            />
          </div>
        </Card>
      </DashboardSection>

      {/* Charts Section *\/}
      <div className="design-system-grid design-system-grid--cols-1 design-system-grid--lg-cols-2">
        <Card>
          <h3 className="design-system-card-title">Flujo de Caja Histórico</h3>
          <ChartContainer height="md">
            {/* Your chart component here *\/}
          </ChartContainer>
        </Card>
        
        <Card>
          <h3 className="design-system-card-title">Gastos por Categoría</h3>
          <ChartContainer height="md">
            {/* Your chart component here *\/}
          </ChartContainer>
        </Card>
      </div>
    </div>
  );
}
*/
