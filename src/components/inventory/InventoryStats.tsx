'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, DollarSign, AlertTriangle, XCircle } from 'lucide-react';

interface StatsProps {
  stats: {
    totalUnits: number;
    totalValue: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
  isLoading: boolean;
}

export function InventoryStats({ stats, isLoading }: StatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="hover:shadow-lg transition-all duration-300 hover:border-primary/20 cursor-default group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">Unidades Totales</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalUnits.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">En todas las bodegas</p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-all duration-300 hover:border-primary/20 cursor-default group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">Valor del Inventario</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${stats.totalValue.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">Costo estimado total</p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-all duration-300 hover:border-yellow-500/20 cursor-default group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-yellow-600 transition-colors">Stock Bajo</CardTitle>
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{stats.lowStockCount}</div>
          <p className="text-xs text-muted-foreground">Items por debajo del mínimo</p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-all duration-300 hover:border-destructive/20 cursor-default group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-destructive transition-colors">Sin Stock</CardTitle>
          <XCircle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{stats.outOfStockCount}</div>
          <p className="text-xs text-muted-foreground">Items agotados</p>
        </CardContent>
      </Card>
    </div>
  );
}
