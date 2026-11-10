import { add, subtract, multiply, divide, toNumber, gtZero } from '@/lib/math';

export interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
}

function calculateHealthScore(
  cashRunway: number,
  grossProfitMargin: number,
  formattedMonthlyData: MonthlyData[]
) {
  // Runway Score (Max 40 points)
  let runwayScore = 0;
  if (cashRunway === Infinity || cashRunway >= 18) {
    runwayScore = 40;
  } else {
    runwayScore = Math.min(40, toNumber(multiply(divide(cashRunway, 12), 40)));
  }

  // Profit Margin Score (Max 30 points)
  const marginScore =
    grossProfitMargin >= 50
      ? 30
      : grossProfitMargin >= 0
        ? toNumber(add(15, multiply(divide(grossProfitMargin, 50), 15)))
        : 0;

  // Cash Flow Trend (Max 30 points)
  const last3Months = formattedMonthlyData.slice(-3);
  const prev3Months = formattedMonthlyData.slice(-6, -3);

  const getAvgNet = (data: MonthlyData[]) => {
    if (data.length === 0) return '0';
    const totalNet = data.reduce(
      (sum, m) => add(sum, subtract(m.income, m.expenses)),
      '0'
    );
    return divide(totalNet, data.length);
  };

  const last3Net = getAvgNet(last3Months);
  const prev3Net = getAvgNet(prev3Months);

  const trendScore = toNumber(last3Net) >= toNumber(prev3Net) ? 30 : 15;

  return Math.round(runwayScore + marginScore + trendScore);
}

function generateRunwayProjection(netBalance: string, netBurnRate: string) {
  const projection = [];
  for (let month = 0; month <= 18; month++) {
    // projected = current - (burn * month)
    const projectedCash = subtract(netBalance, multiply(netBurnRate, month));
    const finalProjected =
      toNumber(projectedCash) < 0 ? 0 : toNumber(projectedCash);

    projection.push({
      month: month === 0 ? 'Hoy' : `Mes ${month}`,
      balance: finalProjected,
    });
  }
  return projection;
}

export interface HealthOptions {
  /** Saldo de caja real (todas las cuentas). Si viene, reemplaza al saldo de los libros. */
  cashBase?: number | null;
  /** Meses (AAAA-MM) que no entran en los promedios: incompletos o todavía en curso. */
  excludeMonths?: string[];
}

function selectRelevantMonths(
  data: MonthlyData[],
  upToMonth: number | null,
  exclude: string[]
) {
  const upToNow = upToMonth === null ? data : data.slice(0, upToMonth);
  const complete = upToNow.filter((m) => !exclude.includes(m.month));
  // Si no queda ningún mes completo se usan todos (mejor eso que nada).
  return complete.length > 0 ? complete : upToNow;
}

export function calculateHealthMetrics(
  totalIncome: string,
  totalExpenses: string,
  netBalance: string,
  formattedMonthlyData: MonthlyData[],
  yearParam: string | null,
  monthParam: string | null,
  options: HealthOptions = {}
) {
  const currentYear = new Date().getUTCFullYear();
  const currentMonth = new Date().getUTCMonth() + 1;
  const isAnnualCurrentYear =
    !!yearParam && !monthParam && parseInt(yearParam) === currentYear;

  // Vista anual del año en curso: solo los meses hasta hoy, sin los incompletos.
  const relevantMonths = selectRelevantMonths(
    formattedMonthlyData,
    isAnnualCurrentYear ? currentMonth : null,
    options.excludeMonths ?? []
  );
  const cashBalance =
    typeof options.cashBase === 'number'
      ? String(options.cashBase)
      : netBalance;

  // Filter out months with no activity to avoid dragging down average?
  // Actually, standard burn rate usually counts all months.
  // But let's at least use the last 3 ACTIVE months if possible.
  const last3MonthsMetrics = relevantMonths.slice(-3);

  const avgMonthlyExpenses =
    last3MonthsMetrics.length > 0
      ? divide(
          last3MonthsMetrics.reduce((sum, m) => add(sum, m.expenses), '0'),
          last3MonthsMetrics.length
        )
      : divide(totalExpenses, relevantMonths.length || 1);

  const avgMonthlyIncome =
    last3MonthsMetrics.length > 0
      ? divide(
          last3MonthsMetrics.reduce((sum, m) => add(sum, m.income), '0'),
          last3MonthsMetrics.length
        )
      : divide(totalIncome, relevantMonths.length || 1);

  const netBurnRate = subtract(avgMonthlyExpenses, avgMonthlyIncome);

  const cashRunway = gtZero(netBurnRate)
    ? toNumber(divide(cashBalance, netBurnRate))
    : Infinity;

  const grossProfitMargin = gtZero(totalIncome)
    ? toNumber(
        multiply(divide(subtract(totalIncome, totalExpenses), totalIncome), 100)
      )
    : 0;

  const healthScore = calculateHealthScore(
    cashRunway,
    grossProfitMargin,
    relevantMonths
  );

  const runwayProjection = generateRunwayProjection(cashBalance, netBurnRate);

  return {
    runway: cashRunway,
    burnRate: {
      gross: toNumber(avgMonthlyExpenses),
      net: toNumber(netBurnRate),
    },
    profitMargin: grossProfitMargin,
    avgMonthlyIncome: toNumber(avgMonthlyIncome),
    avgMonthlyExpense: toNumber(avgMonthlyExpenses),
    healthScore,
    runwayProjection,
  };
}
