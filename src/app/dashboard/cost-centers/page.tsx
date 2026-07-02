'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import {
  Plus,
  Search,
  TrendingUp,
  DollarSign,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import CostCentersTable from '@/components/admin/CostCentersTable/CostCentersTable';
import CostCenterModal from '@/components/admin/CostCenterModal';
import { CostCenter } from '@/types/cost-center';
import { Input } from '@/components/ui/Input';
import { usePermission } from '@/hooks/usePermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import { StatCard } from '@/components/dashboard/StatCard';
import { formatCurrency } from '@/lib/utils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import './page.scss';

interface CostCenterStats extends CostCenter {
  income: number;
  expense: number;
  balance: number;
  history: number[];
}

interface StatsData {
  summary: {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
  };
  history: Array<{
    month: string;
    fullMonth: string;
    income: number;
    expenses: number;
    balance: number;
  }>;
  costCenters: CostCenterStats[];
}

interface ParticipationItem {
  name: string;
  fullName: string;
  value: number;
  percentage?: string;
}

// Custom Legend Component for better legibility
const CustomPieLegend = ({
  data,
  colors,
}: {
  data: ParticipationItem[];
  colors: string[];
}) => {
  return (
    <div className="cost-centers-page__custom-legend">
      {data.map((entry, index) => (
        <div key={index} className="cost-centers-page__legend-item">
          <div
            className="cost-centers-page__legend-color"
            style={{ backgroundColor: colors[index % colors.length] }}
          />
          <div className="cost-centers-page__legend-info">
            <span className="cost-centers-page__legend-name">
              {entry.fullName || entry.name}
            </span>
            <span className="cost-centers-page__legend-percentage">
              {entry.percentage}%
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default function CostCentersPage() {
  const { toast } = useToast();
  const { hasPermission } = usePermission();
  const canCreate = hasPermission(
    ModuleName.COST_CENTERS,
    PermissionAction.CREATE
  );

  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Estados para controlar el modal de creación/edición
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCostCenter, setSelectedCostCenter] = useState<CostCenter | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/costcenters/stats');
      if (!res.ok) throw new Error('Error al cargar estadísticas');
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description:
          'No se pudieron cargar las estadísticas de los centros de costo',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este centro de costo?'))
      return;

    try {
      const res = await fetch(`/api/costcenters?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Error al eliminar');
      toast({
        title: 'Éxito',
        description: 'Centro de costo eliminado correctamente',
      });
      fetchStats();
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'No se pudo desactivar el centro de costo',
        variant: 'destructive',
      });
    }
  };

  const filteredCostCenters =
    data?.costCenters.filter(
      (cc) =>
        cc.name.toLowerCase().includes(search.toLowerCase()) ||
        cc.code.toLowerCase().includes(search.toLowerCase())
    ) || [];

  const COLORS = [
    '#3b82f6', // blue-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#8b5cf6', // violet-500
    '#06b6d4', // cyan-500
    '#ec4899', // pink-500
    '#f97316', // orange-500
    '#6366f1', // indigo-500
    '#14b8a6', // teal-500
    '#94a3b8', // slate-400 (for Others)
  ];

  const processParticipationData = useCallback(
    (type: 'income' | 'expense') => {
      if (!data) return [];

      const items = data.costCenters
        .filter((cc) => cc[type] > 0)
        .map((cc) => ({
          name: cc.code,
          fullName: cc.name,
          value: cc[type],
        }))
        .sort((a, b) => b.value - a.value);

      const total = items.reduce((sum, item) => sum + item.value, 0);
      if (total === 0) return [];

      const topItems = items.slice(0, 5);
      const others = items.slice(5);

      const result: ParticipationItem[] = topItems.map((item) => ({
        ...item,
        percentage: ((item.value / total) * 100).toFixed(1),
      }));

      if (others.length > 0) {
        const othersTotal = others.reduce((sum, item) => sum + item.value, 0);
        result.push({
          name: 'OTROS',
          fullName: 'Otros centros de costo',
          value: othersTotal,
          percentage: ((othersTotal / total) * 100).toFixed(1),
        });
      }

      return result;
    },
    [data]
  );

  const incomeParticipation = useMemo(
    () => processParticipationData('income'),
    [processParticipationData]
  );
  const expenseParticipation = useMemo(
    () => processParticipationData('expense'),
    [processParticipationData]
  );

  return (
    <div className="cost-centers-page">
      <div className="cost-centers-page__header">
        <div className="cost-centers-page__title-group">
          <h1 className="cost-centers-page__title">
            Dashboard de Centros de Costo
          </h1>
          <p className="cost-centers-page__subtitle">
            Gestión financiera y análisis de rendimiento por área.
          </p>
        </div>
        <div className="cost-centers-page__actions">
          {canCreate && (
            <Button
              onClick={() => {
                setSelectedCostCenter(null);
                setIsModalOpen(true);
              }}
              className="cost-centers-page__new-btn"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Centro
            </Button>
          )}
        </div>
      </div>

      {!loading && data && (
        <>
          {/* Summary Cards */}
          <div className="cost-centers-page__stats-grid">
            <StatCard
              title="Ingresos Totales"
              value={formatCurrency(data.summary.totalIncome)}
              icon={TrendingUp}
              variant="flow"
              sparklineData={data.history.map((h) => h.income)}
            />
            <StatCard
              title="Egresos Totales"
              value={formatCurrency(data.summary.totalExpenses)}
              icon={DollarSign}
              variant="ebb"
              sparklineData={data.history.map((h) => h.expenses)}
            />
            <StatCard
              title="Resultado Neto"
              value={formatCurrency(data.summary.balance)}
              icon={PieChartIcon}
              variant="balance"
              sparklineData={data.history.map((h) => h.balance)}
            />
          </div>

          {/* New Participation Row */}
          <div className="cost-centers-page__participation-grid">
            <Card className="cost-centers-page__chart-card">
              <CardHeader className="pb-2">
                <CardTitle
                  as="h2"
                  className="text-sm font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Participación en Ingresos
                </CardTitle>
              </CardHeader>
              <CardContent className="cost-centers-page__chart-container cost-centers-page__chart-container--pie">
                <div className="cost-centers-page__pie-wrapper">
                  <div className="cost-centers-page__pie-main">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          data={incomeParticipation as any}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={100}
                          paddingAngle={4}
                          dataKey="value"
                          nameKey="fullName"
                          stroke="none"
                        >
                          {incomeParticipation.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          formatter={
                            ((val: number) => formatCurrency(val)) as any
                          }
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            borderColor: 'hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="cost-centers-page__pie-center">
                      <span className="text-2xl font-bold">
                        {incomeParticipation.length > 0
                          ? `${incomeParticipation[0].percentage}%`
                          : '0%'}
                      </span>
                      <span className="text-xs text-muted-foreground uppercase">
                        {incomeParticipation.length > 0
                          ? incomeParticipation[0].name
                          : ''}
                      </span>
                    </div>
                  </div>
                  <CustomPieLegend data={incomeParticipation} colors={COLORS} />
                </div>
              </CardContent>
            </Card>

            <Card className="cost-centers-page__chart-card">
              <CardHeader className="pb-2">
                <CardTitle
                  as="h2"
                  className="text-sm font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Participación en Egresos
                </CardTitle>
              </CardHeader>
              <CardContent className="cost-centers-page__chart-container cost-centers-page__chart-container--pie">
                <div className="cost-centers-page__pie-wrapper">
                  <div className="cost-centers-page__pie-main">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          data={expenseParticipation as any}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={100}
                          paddingAngle={4}
                          dataKey="value"
                          nameKey="fullName"
                          stroke="none"
                        >
                          {expenseParticipation.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          formatter={
                            ((val: number) => formatCurrency(val)) as any
                          }
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            borderColor: 'hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="cost-centers-page__pie-center">
                      <span className="text-2xl font-bold">
                        {expenseParticipation.length > 0
                          ? `${expenseParticipation[0].percentage}%`
                          : '0%'}
                      </span>
                      <span className="text-xs text-muted-foreground uppercase">
                        {expenseParticipation.length > 0
                          ? expenseParticipation[0].name
                          : ''}
                      </span>
                    </div>
                  </div>
                  <CustomPieLegend
                    data={expenseParticipation}
                    colors={COLORS}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="cost-centers-page__charts-grid">
            <Card className="cost-centers-page__chart-card">
              <CardHeader>
                <CardTitle as="h2">Evolución de Ingresos vs Egresos</CardTitle>
              </CardHeader>
              <CardContent className="cost-centers-page__chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.history}>
                    <defs>
                      <linearGradient
                        id="colorIncome"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="hsl(var(--success))"
                          stopOpacity={0.1}
                        />
                        <stop
                          offset="95%"
                          stopColor="hsl(var(--success))"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorExpense"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="hsl(var(--danger))"
                          stopOpacity={0.1}
                        />
                        <stop
                          offset="95%"
                          stopColor="hsl(var(--danger))"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fontSize: 12,
                        fill: 'hsl(var(--muted-foreground))',
                      }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fontSize: 12,
                        fill: 'hsl(var(--muted-foreground))',
                      }}
                      tickFormatter={(val) => `$${val / 1000000}M`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={
                        ((val: number) =>
                          val !== undefined ? formatCurrency(val) : '') as any
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="income"
                      name="Ingresos"
                      stroke="hsl(var(--success))"
                      fillOpacity={1}
                      fill="url(#colorIncome)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="expenses"
                      name="Egresos"
                      stroke="hsl(var(--danger))"
                      fillOpacity={1}
                      fill="url(#colorExpense)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="cost-centers-page__chart-card">
              <CardHeader>
                <CardTitle as="h2">Resultado por Centro</CardTitle>
              </CardHeader>
              <CardContent className="cost-centers-page__chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.costCenters
                      .sort((a, b) => b.balance - a.balance)
                      .slice(0, 8)}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="code"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fontSize: 12,
                        fill: 'hsl(var(--muted-foreground))',
                      }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fontSize: 12,
                        fill: 'hsl(var(--muted-foreground))',
                      }}
                      tickFormatter={(val) => `$${val / 1000000}M`}
                    />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={
                        ((val: number) =>
                          val !== undefined ? formatCurrency(val) : '') as any
                      }
                    />
                    <Bar
                      dataKey="balance"
                      name="Resultado"
                      radius={[4, 4, 0, 0]}
                    >
                      {data.costCenters.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.balance >= 0
                              ? 'hsl(var(--success))'
                              : 'hsl(var(--danger))'
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Table Section */}
      <div className="cost-centers-page__table-section">
        <div className="cost-centers-page__table-header">
          <div className="cost-centers-page__table-title">
            <h2 className="text-xl font-semibold">Listado de Centros</h2>
            <p className="text-sm text-muted-foreground">
              {filteredCostCenters.length} centros encontrados
            </p>
          </div>
          <div className="cost-centers-page__search-container">
            <Search className="cost-centers-page__search-icon" />
            <Input
              placeholder="Buscar por código o nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="cost-centers-page__search"
            />
          </div>
        </div>

        <CostCentersTable
          costCenters={filteredCostCenters}
          loading={loading}
          onEdit={(cc) => {
            setSelectedCostCenter(cc);
            setIsModalOpen(true);
          }}
          onDelete={handleDelete}
        />
      </div>

      <CostCenterModal
        isOpen={isModalOpen}
        costCenter={selectedCostCenter}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchStats}
      />
    </div>
  );
}
