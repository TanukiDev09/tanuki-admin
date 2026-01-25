'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Package, DollarSign, AlertTriangle, XCircle, Building2, Boxes } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import './InventoryStats.scss';

interface StatsProps {
  stats: {
    totalUnits: number;
    totalValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    editorialUnits: number;
    otherUnits: number;
  };
  isLoading: boolean;
}

export function InventoryStats({ stats, isLoading }: StatsProps) {
  if (isLoading) {
    return (
      <div className="inventory-stats">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="inventory-stats__skeleton">
            <CardHeader className="inventory-stats__header">
              <div className="inventory-stats__skeleton-title"></div>
            </CardHeader>
            <CardContent>
              <div className="inventory-stats__skeleton-value"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="inventory-stats">
      <Card className="inventory-stats__card">
        <CardHeader className="inventory-stats__header">
          <CardTitle className="inventory-stats__title">
            Unidades Totales
          </CardTitle>
          <Package className="inventory-stats__icon" />
        </CardHeader>
        <CardContent>
          <div className="inventory-stats__value">
            {formatNumber(stats.totalUnits)}
          </div>
          <p className="inventory-stats__description">En todas las bodegas</p>
        </CardContent>
      </Card>

      <Card className="inventory-stats__card">
        <CardHeader className="inventory-stats__header">
          <CardTitle className="inventory-stats__title">
            Bodega Editorial
          </CardTitle>
          <Building2 className="inventory-stats__icon" />
        </CardHeader>
        <CardContent>
          <div className="inventory-stats__value">
            {formatNumber(stats.editorialUnits)}
          </div>
          <p className="inventory-stats__description">Stock en oficina central</p>
        </CardContent>
      </Card>

      <Card className="inventory-stats__card">
        <CardHeader className="inventory-stats__header">
          <CardTitle className="inventory-stats__title">
            Otras Bodegas
          </CardTitle>
          <Boxes className="inventory-stats__icon" />
        </CardHeader>
        <CardContent>
          <div className="inventory-stats__value">
            {formatNumber(stats.otherUnits)}
          </div>
          <p className="inventory-stats__description">Puntos de venta y terceros</p>
        </CardContent>
      </Card>

      <Card className="inventory-stats__card">
        <CardHeader className="inventory-stats__header">
          <CardTitle className="inventory-stats__title">
            Valor del Inventario
          </CardTitle>
          <DollarSign className="inventory-stats__icon" />
        </CardHeader>
        <CardContent>
          <div className="inventory-stats__value">
            {formatCurrency(stats.totalValue)}
          </div>
          <p className="inventory-stats__description">Costo estimado total</p>
        </CardContent>
      </Card>

      <Card className="inventory-stats__card inventory-stats__card--warning">
        <CardHeader className="inventory-stats__header">
          <CardTitle className="inventory-stats__title">Stock Bajo</CardTitle>
          <AlertTriangle className="inventory-stats__icon inventory-stats__icon--warning" />
        </CardHeader>
        <CardContent>
          <div className="inventory-stats__value inventory-stats__value--warning">
            {formatNumber(stats.lowStockCount)}
          </div>
          <p className="inventory-stats__description">
            Items por debajo del mínimo
          </p>
        </CardContent>
      </Card>

      <Card className="inventory-stats__card inventory-stats__card--danger">
        <CardHeader className="inventory-stats__header">
          <CardTitle className="inventory-stats__title">Sin Stock</CardTitle>
          <XCircle className="inventory-stats__icon inventory-stats__icon--danger" />
        </CardHeader>
        <CardContent>
          <div className="inventory-stats__value inventory-stats__value--danger">
            {formatNumber(stats.outOfStockCount)}
          </div>
          <p className="inventory-stats__description">Items agotados</p>
        </CardContent>
      </Card>
    </div>
  );
}
