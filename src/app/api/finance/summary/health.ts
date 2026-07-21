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

export function calculateHealthMetrics(
  totalIncome: string,
  totalExpenses: string,
  netBalance: string,
  formattedMonthlyData: MonthlyData[],
  yearParam: string | null,
  monthParam: string | null
) {
  const isAnnual = yearParam && !monthParam;
  const currentYear = new Date().getUTCFullYear();
  const currentMonth = new Date().getUTCMonth() + 1;

  // For annual view of current year, only use months up to now for average
  let relevantMonths = formattedMonthlyData;
  if (isAnnual && parseInt(yearParam) === currentYear) {
    relevantMonths = formattedMonthlyData.slice(0, currentMonth);
  }

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
    ? toNumber(divide(netBalance, netBurnRate))
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

  const runwayProjection = generateRunwayProjection(netBalance, netBurnRate);

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
