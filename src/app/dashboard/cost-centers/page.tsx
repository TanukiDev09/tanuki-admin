'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Plus, Search, TrendingUp, DollarSign, PieChart } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import CostCentersTable from '@/components/admin/CostCentersTable/CostCentersTable';
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

export default function CostCentersPage() {
  const { toast } = useToast();
  const { hasPermission } = usePermission();
  const canCreate = hasPermission(ModuleName.COST_CENTERS, PermissionAction.CREATE);

  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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
        description: 'No se pudieron cargar las estadísticas de los centros de costo',
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
    if (!confirm('¿Estás seguro de que deseas eliminar este centro de costo?')) return;

    try {
      const res = await fetch(`/api/costcenters?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      toast({ title: 'Éxito', description: 'Centro de costo eliminado correctamente' });
      fetchStats();
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el centro de costo',
        variant: 'destructive',
      });
    }
  };

  const filteredCostCenters = data?.costCenters.filter(
    (cc) =>
      cc.name.toLowerCase().includes(search.toLowerCase()) ||
      cc.code.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="cost-centers-page">
      <div className="cost-centers-page__header">
        <div className="cost-centers-page__title-group">
          <h1 className="cost-centers-page__title">Dashboard de Centros de Costo</h1>
          <p className="cost-centers-page__subtitle">
            Gestión financiera y análisis de rendimiento por área.
          </p>
        </div>
        <div className="cost-centers-page__actions">
          {canCreate && (
            <Button
              onClick={() =>
                toast({
                  title: 'Próximamente',
                  description: 'La creación desde esta vista está en construcción.',
                })
              }
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
              icon={PieChart}
              variant="balance"
              sparklineData={data.history.map((h) => h.balance)}
            />
          </div>

          {/* Charts Row */}
          <div className="cost-centers-page__charts-grid">
            <Card className="cost-centers-page__chart-card">
              <CardHeader>
                <CardTitle>Evolución de Ingresos vs Egresos</CardTitle>
              </CardHeader>
              <CardContent className="cost-centers-page__chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.history}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--danger))" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="hsl(var(--danger))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(val) => `$${val / 1000000}M`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      formatter={(val: number | undefined) => (val !== undefined ? formatCurrency(val) : '')}
                    />
                    <Area type="monotone" dataKey="income" name="Ingresos" stroke="hsl(var(--success))" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
                    <Area type="monotone" dataKey="expenses" name="Egresos" stroke="hsl(var(--danger))" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="cost-centers-page__chart-card">
              <CardHeader>
                <CardTitle>Resultado por Centro</CardTitle>
              </CardHeader>
              <CardContent className="cost-centers-page__chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.costCenters.sort((a, b) => b.balance - a.balance).slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="code" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(val) => `$${val / 1000000}M`} />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      formatter={(val: number | undefined) => (val !== undefined ? formatCurrency(val) : '')}
                    />
                    <Bar dataKey="balance" name="Resultado" radius={[4, 4, 0, 0]}>
                      {data.costCenters.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.balance >= 0 ? 'hsl(var(--success))' : 'hsl(var(--danger))'} />
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
            <p className="text-sm text-muted-foreground">{filteredCostCenters.length} centros encontrados</p>
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
          onEdit={() =>
            toast({
              title: 'Próximamente',
              description: 'La edición estará disponible pronto.',
            })
          }
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
