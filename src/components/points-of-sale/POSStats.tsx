'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  Package,
  RotateCw,
  ShoppingBag,
  BarChart3,
  Loader2,
  AlertCircle,
  ExternalLink,
  DollarSign,
  Percent
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { DataTable, Column } from '@/components/ui/DataTable';
import './POSStats.scss';

interface POSStatsProps {
  posId: string;
  posName: string;
  warehouseId?: string;
}

interface TopProduct {
  _id: string;
  title: string;
  quantity: number;
  totalRevenue: number;
  globalRevenue: number;
}

interface CatalogItem {
  _id: string;
  title: string;
  quantity: number;
  revenue: number;
  globalRevenue: number;
  globalQuantity: number;
  contributionPercentage: number;
}

interface StatsData {
  billingHistory: Array<{
    month: string;
    fullMonth: string;
    revenue: number;
  }>;
  inventoryMetrics: {
    totalStock: number;
    soldLast30Days: number;
    soldLastYear: number;
    turnoverRatio: number;
  };
  topProducts: TopProduct[];
  catalogContribution: CatalogItem[];
  globalRevenueSummary: {
    posTotal: number;
    globalTotal: number;
    contributionPercentage: number;
  };
}

export function POSStats({ posId, posName }: POSStatsProps) {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(`/api/points-of-sale/${posId}/stats`);
        if (!res.ok) throw new Error('Error al cargar estadísticas');
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [posId]);

  if (loading) {
    return (
      <div className="pos-stats__loading">
        <Loader2 className="pos-stats__loading-icon animate-spin" />
        <p>Calculando estadísticas...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="pos-stats__empty">
        <AlertCircle className="pos-stats__empty-icon" />
        <p>{error || 'No se pudieron cargar los datos'}</p>
      </div>
    );
  }

  const { billingHistory, inventoryMetrics, topProducts, catalogContribution, globalRevenueSummary } = data;

  const invoicesLink = `/dashboard/invoices?search=${encodeURIComponent(posName.replace(/\s+(Librerías|Librería|S\.?A\.?S\.?|S\.?A\.?|Libros)\s*$/i, '').trim())}`;
  const stockLink = `/dashboard/points-of-sale/${posId}?tab=stock`;

  return (
    <div className="pos-stats">
      <div className="pos-stats__top-metrics">
        {/* Total Facturado */}
        <div className="pos-stats__metric-card pos-stats__metric-card--primary stats-interactive-card">
          <div className="pos-stats__metric-card-content">
            <div className="pos-stats__metric-card-header">
              <span className="pos-stats__metric-card-title">Total Facturado</span>
              <DollarSign className="pos-stats__metric-card-icon" />
            </div>
            <div className="pos-stats__metric-card-body">
              <div className="pos-stats__metric-card-value">
                {formatCurrency(globalRevenueSummary.posTotal)}
              </div>
              <div className="pos-stats__metric-card-footer">
                Ingresos históricos de este POS
              </div>
            </div>
          </div>
        </div>

        {/* Aporte a la Facturación Total */}
        <div className="pos-stats__metric-card pos-stats__metric-card--accent stats-interactive-card">
          <div className="pos-stats__metric-card-content">
            <div className="pos-stats__metric-card-header">
              <span className="pos-stats__metric-card-title">Aporte a la facturación total</span>
              <Percent className="pos-stats__metric-card-icon" />
            </div>
            <div className="pos-stats__metric-card-body">
              <div className="pos-stats__metric-card-value">
                {globalRevenueSummary.contributionPercentage.toFixed(2)}%
              </div>
              <div className="pos-stats__metric-card-footer">
                Participación en los ingresos de la editorial
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pos-stats__grid">
        {/* Billing Chart */}
        <Link href={invoicesLink} className="pos-stats__link-wrapper pos-stats__link-wrapper--chart">
          <Card className="pos-stats__chart-card stats-interactive-card">
            <div className="pos-stats__card-header">
              <div className="pos-stats__card-title-group">
                <div className="pos-stats__card-title-row">
                  <span className="pos-stats__card-title">Histórico de Ventas</span>
                  <ExternalLink className="pos-stats__card-icon-external" />
                </div>
                <CardDescription>Perfil de facturación histórica (Clic para ver facturas)</CardDescription>
              </div>
              <TrendingUp className="pos-stats__card-trend-icon" />
            </div>
            <CardContent>
              <div className="pos-stats__chart-scroll-container">
                <div
                  className="pos-stats__chart-container"
                  style={{ width: `${Math.max(100, billingHistory.length * 60)}px`, minWidth: '100%' }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={billingHistory}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 11 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        tickFormatter={(value) => `$${value / 1000000}M`}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '12px',
                          border: 'none',
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                        }}
                        formatter={(value: number | string | undefined) => [
                          formatCurrency(value === undefined ? 0 : Number(value)),
                          'Ventas'
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Inventory Turnover */}
        <Link href={stockLink} className="pos-stats__link-wrapper">
          <div className="pos-stats__stat-card pos-stats__stat-card--success stats-interactive-card">
            <div className="pos-stats__stat-card-header">
              <span className="pos-stats__stat-card-title">Rotación de Inventario</span>
              <RotateCw className="pos-stats__stat-card-icon" />
            </div>
            <div>
              <div className="pos-stats__stat-card-value">
                {inventoryMetrics.turnoverRatio > 0 ? inventoryMetrics.turnoverRatio.toFixed(2) : '0.00'}x
              </div>
              <div className="pos-stats__stat-card-footer">
                Ventas 1Y / Stock actual (Clic para ver inventario)
              </div>
            </div>
          </div>
        </Link>

        {/* Current Stock */}
        <Link href={stockLink} className="pos-stats__link-wrapper">
          <div className="pos-stats__stat-card pos-stats__stat-card--highlight stats-interactive-card">
            <div className="pos-stats__stat-card-header">
              <span className="pos-stats__stat-card-title">Stock Actual</span>
              <Package className="pos-stats__stat-card-icon" />
            </div>
            <div>
              <div className="pos-stats__stat-card-value">
                {formatNumber(inventoryMetrics.totalStock)}
              </div>
              <div className="pos-stats__stat-card-footer">
                Unidades en bodega (Clic para ver inventario)
              </div>
            </div>
          </div>
        </Link>

        {/* Cumulative Sales */}
        <Link href={invoicesLink} className="pos-stats__link-wrapper">
          <div className="pos-stats__stat-card pos-stats__stat-card--warning stats-interactive-card">
            <div className="pos-stats__stat-card-header">
              <span className="pos-stats__stat-card-title">Ventas (12 Meses)</span>
              <ShoppingBag className="pos-stats__stat-card-icon" />
            </div>
            <div>
              <div className="pos-stats__stat-card-value">
                {formatNumber(inventoryMetrics.soldLastYear)}
              </div>
              <div className="pos-stats__stat-card-footer">
                Unidades vendidas (Clic para ver facturas)
              </div>
            </div>
          </div>
        </Link>

        {/* Top Products */}
        <Card className="pos-stats__product-card">
          <div className="pos-stats__card-header">
            <BarChart3 className="pos-stats__card-icon-list" />
            <span className="pos-stats__card-title--small">Más Vendidos (Histórico)</span>
          </div>
          <CardContent>
            <div className="pos-stats__top-products">
              {topProducts.length > 0 ? (
                topProducts.map((product) => {
                  const contribution = product.globalRevenue > 0
                    ? (product.totalRevenue / product.globalRevenue) * 100
                    : 100;

                  return (
                    <Link
                      key={product._id}
                      href={`/dashboard/catalog/${product._id}`}
                      className="pos-stats__product-link"
                    >
                      <div className="pos-stats__product-item">
                        <div className="pos-stats__product-item-info">
                          <span className="pos-stats__product-item-title" title={product.title}>
                            {product.title}
                          </span>
                          <div className="pos-stats__product-item-row">
                            <span className="pos-stats__product-item-meta">
                              {formatCurrency(product.totalRevenue)}
                            </span>
                            <span className="pos-stats__product-item-badge">
                              {contribution.toFixed(1)}% del total
                            </span>
                          </div>
                        </div>
                        <div className="pos-stats__product-item-row">
                          <div className="pos-stats__product-item-value">
                            {product.quantity} uds
                          </div>
                          <ExternalLink className="pos-stats__product-item-icon-link" />
                        </div>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <p className="text-center text-slate-400 py-4">No hay datos de ventas</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="pos-stats__full-width">
        <CatalogContributionTable items={catalogContribution || []} />
      </div>
    </div>
  );
}

function CatalogContributionTable({ items }: { items: CatalogItem[] }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = items.filter((item) =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: Column<CatalogItem>[] = [
    {
      header: 'Título',
      accessorKey: 'title',
      sortable: true,
      cell: (item) => (
        <Link
          href={`/dashboard/catalog/${item._id}`}
          className="pos-stats__table-title"
        >
          {item.title}
        </Link>
      ),
    },
    {
      header: 'Ventas POS',
      accessorKey: 'quantity',
      sortable: true,
      className: 'text-right font-semibold',
      headerClassName: 'text-right',
      cell: (item) => `${item.quantity} uds`,
    },
    {
      header: 'Ventas Global',
      accessorKey: 'globalQuantity',
      sortable: true,
      className: 'text-right font-medium text-slate-400',
      headerClassName: 'text-right',
      cell: (item) => `${item.globalQuantity} uds`,
    },
    {
      header: 'Facturación',
      accessorKey: 'revenue',
      sortable: true,
      className: 'text-right font-medium',
      headerClassName: 'text-right',
      cell: (item) => formatCurrency(item.revenue),
    },
    {
      header: 'Contribución',
      accessorKey: 'contributionPercentage',
      sortable: true,
      cell: (item) => (
        <div className="pos-stats__progress-group">
          <div className="pos-stats__progress-bar">
            <div
              className="pos-stats__progress-fill"
              style={{
                width: `${Math.min(item.contributionPercentage, 100)}%`,
              }}
            />
          </div>
          <span className="pos-stats__progress-value">
            {item.contributionPercentage.toFixed(1)}%
          </span>
        </div>
      ),
    },
  ];

  return (
    <Card className="pos-stats__catalog-card">
      <CardHeader className="pos-stats__catalog-header">
        <div className="pos-stats__catalog-header-main">
          <div>
            <CardTitle className="text-xl">
              Impacto Total en el Catálogo
            </CardTitle>
            <CardDescription>
              Análisis histórico de contribución por título
            </CardDescription>
          </div>
          <div className="pos-stats__catalog-search">
            <input
              type="text"
              placeholder="Filtrar por título..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pos-stats__search-input"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <DataTable
          data={filteredItems}
          columns={columns}
          initialSort={{ key: 'contributionPercentage', direction: 'desc' }}
          emptyMessage="No se encontraron registros que coincidan con la búsqueda"
        />
      </CardContent>
    </Card>
  );
}
