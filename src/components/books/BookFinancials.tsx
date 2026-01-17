'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, Activity } from 'lucide-react';

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
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-24 bg-muted rounded"></div>
          <div className="h-24 bg-muted rounded"></div>
          <div className="h-24 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !data) return null;

  const { totals, health } = data;
  const isProfitable = totals.balance >= 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Finanzas del Centro de Costos
        </h3>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
          {costCenterName}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${totals.income.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Acumulado histórico
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos Totales</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${totals.expenses.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Acumulado histórico
            </p>
          </CardContent>
        </Card>

        <Card className={isProfitable ? "border-green-200 bg-green-50/20" : "border-red-200 bg-red-50/20"}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance Neto</CardTitle>
            <DollarSign className={`h-4 w-4 ${isProfitable ? 'text-green-500' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isProfitable ? 'text-green-700' : 'text-red-700'}`}>
              ${totals.balance.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Margen: {health.profitMargin.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
