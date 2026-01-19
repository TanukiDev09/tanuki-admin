import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DollarSign, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import './BookFinancials.scss';

interface BookFinancialsProps {
  costCenterName: string;
}

interface FinancialData {
  totals: {
    income: number;
    expenses: number;
    balance: number;
  };
  health: {
    profitMargin: number;
  };
}

export default function BookFinancials({ costCenterName }: BookFinancialsProps) {
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!costCenterName) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(`/api/finance/summary?costCenter=${encodeURIComponent(costCenterName)}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const jsonData = await res.json();
        setData(jsonData);
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [costCenterName]);

  if (!costCenterName) return null;

  if (loading) {
    return (
      <div className="book-financials__skeleton">
        <div className="book-financials__skeleton-bar"></div>
        <div className="book-financials__skeleton-grid">
          <div className="book-financials__skeleton-card"></div>
          <div className="book-financials__skeleton-card"></div>
          <div className="book-financials__skeleton-card"></div>
        </div>
      </div>
    );
  }

  if (error || !data) return null;

  const { totals, health } = data;
  const isProfitable = totals.balance >= 0;

  return (
    <div className="book-financials">
      <div className="book-financials__header">
        <h3 className="book-financials__title">
          <Activity className="book-financials__icon" />
          Finanzas del Centro de Costos
        </h3>
        <span className="book-financials__cost-center-badge">
          {costCenterName}
        </span>
      </div>

      <div className="book-financials__grid">
        <Card>
          <CardHeader className="book-financials__card-header">
            <CardTitle className="book-financials__card-title">Ingresos Totales</CardTitle>
            <TrendingUp className="book-financials__trend-icon book-financials__trend-icon--up" />
          </CardHeader>
          <CardContent>
            <div className="book-financials__value book-financials__value--income">
              {formatCurrency(totals.income)}
            </div>
            <p className="book-financials__subtext">
              Acumulado histórico
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="book-financials__card-header">
            <CardTitle className="book-financials__card-title">Gastos Totales</CardTitle>
            <TrendingDown className="book-financials__trend-icon book-financials__trend-icon--down" />
          </CardHeader>
          <CardContent>
            <div className="book-financials__value book-financials__value--expense">
              {formatCurrency(totals.expenses)}
            </div>
            <p className="book-financials__subtext">
              Acumulado histórico
            </p>
          </CardContent>
        </Card>

        <Card className={isProfitable ? "book-financials__card--profitable" : "book-financials__card--loss"}>
          <CardHeader className="book-financials__card-header">
            <CardTitle className="book-financials__card-title">Balance Neto</CardTitle>
            <DollarSign className="book-financials__trend-icon book-financials__trend-icon--balance" />
          </CardHeader>
          <CardContent>
            <div className="book-financials__value book-financials__value--balance">
              {formatCurrency(totals.balance)}
            </div>
            <p className="book-financials__subtext">
              Margen: {formatNumber(health.profitMargin.toFixed(1))}%
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
