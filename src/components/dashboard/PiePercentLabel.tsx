const RADIAN = Math.PI / 180;
const LABEL_OFFSET = 14;
// Porciones menores a este porcentaje no llevan etiqueta para evitar solapes.
const MIN_PERCENT_TO_LABEL = 0.03;

interface PiePercentLabelProps {
  cx?: number;
  cy?: number;
  midAngle?: number;
  outerRadius?: number;
  percent?: number;
}

/**
 * Etiqueta con el porcentaje de cada porción, dibujada fuera del anillo de
 * una dona de Recharts. Úsala como `label={renderPiePercentLabel}`.
 */
export function renderPiePercentLabel({
  cx = 0,
  cy = 0,
  midAngle = 0,
  outerRadius = 0,
  percent = 0,
}: PiePercentLabelProps) {
  if (percent < MIN_PERCENT_TO_LABEL) return null;

  const radius = outerRadius + LABEL_OFFSET;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="var(--color-foreground)"
      fontSize={12}
      fontWeight={600}
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
    >
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  );
}
