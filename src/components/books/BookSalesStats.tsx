'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { TrendingUp, ShoppingBag, DollarSign } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import './BookSalesStats.scss';

interface SalesHistoryItem {
  month: string;
  fullMonth: string;
  quantity: number;
  revenue: number;
}

interface BookSalesData {
  totalSold: number;
  totalRevenue: number;
  history: SalesHistoryItem[];
}

interface BookSalesStatsProps {
  bookId: string;
}

export default function BookSalesStats({ bookId }: BookSalesStatsProps) {
  const [data, setData] = useState<BookSalesData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSalesData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/books/${bookId}/sales`);
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching sales data:', error);
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    fetchSalesData();
  }, [fetchSalesData]);

  if (loading) {
    return (
      <div className="book-sales-stats__loading">
        <div className="book-sales-stats__loading-spinner" />
        <p>Cargando estadísticas de venta...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="book-sales-stats">
      <h2 className="book-sales-stats__section-title">Análisis de Ventas</h2>

      <div className="book-sales-stats__grid">
        {/* Total Quantity Card */}
        <Card className="book-sales-stats__summary-card">
          <CardContent className="book-sales-stats__summary-content">
            <div className="book-sales-stats__summary-icon book-sales-stats__summary-icon--blue">
              <ShoppingBag size={20} />
            </div>
            <div className="book-sales-stats__summary-info">
              <span className="book-sales-stats__summary-label">Ejemplares Vendidos</span>
              <div className="book-sales-stats__summary-value">
                {formatNumber(data.totalSold)}
                <span className="book-sales-stats__summary-unit">unds</span>
              </div>
              <Link
                href={`/dashboard/invoices?bookId=${bookId}`}
                className="book-sales-stats__view-invoices"
              >
                Ver facturas
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Total Revenue Card */}
        <Card className="book-sales-stats__summary-card">
          <CardContent className="book-sales-stats__summary-content">
            <div className="book-sales-stats__summary-icon book-sales-stats__summary-icon--green">
              <DollarSign size={20} />
            </div>
            <div className="book-sales-stats__summary-info">
              <span className="book-sales-stats__summary-label">Total facturado</span>
              <div className="book-sales-stats__summary-value">
                {formatCurrency(data.totalRevenue)}
              </div>
              <Link
                href={`/dashboard/invoices?bookId=${bookId}`}
                className="book-sales-stats__view-invoices"
              >
                Ver facturas
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historical Chart */}
      <Card className="book-sales-stats__chart-card">
        <CardHeader className="book-sales-stats__chart-header">
          <div className="book-sales-stats__chart-header-content">
            <CardTitle className="book-sales-stats__chart-title">
              <TrendingUp className="book-sales-stats__chart-title-icon" size={18} />
              Histórico de Ventas
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="book-sales-stats__chart-content">
          <div className="book-sales-stats__chart-scroll-container">
            <div
              className="book-sales-stats__chart-wrapper"
              style={{ width: `${Math.max(100, data.history.length * 60)}px`, minWidth: '100%' }}
            >
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.history} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorQuantity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-popover)',
                      borderColor: 'var(--color-border)',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    }}
                    itemStyle={{ fontSize: 13, fontWeight: 500 }}
                    labelStyle={{ fontSize: 12, marginBottom: 4, color: 'var(--color-muted-foreground)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="quantity"
                    name="Ejemplares"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorQuantity)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
