'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { FileText, ExternalLink } from 'lucide-react';
import { generateMovementPDF } from '@/lib/inventory/pdfGenerator';
import { FileText, ExternalLink, Eye } from 'lucide-react';
import { generateMovementPDF } from '@/lib/inventory/pdfGenerator';
import { EditorialSettings } from '@/types/settings';

import { formatNumber } from '@/lib/utils';
import './InventoryMovementsList.scss';

interface Movement {
  _id: string;
  type: string;
  consecutive?: number;
  date: string;
  fromWarehouseId?: {
    name: string;
    type: string;
    address?: string;
    city?: string;
    pointOfSaleId?: {
      name?: string;
      identificationType?: string;
      identificationNumber?: string;
      address?: string;
      city?: string;
      discountPercentage?: number;
    };
  };
  toWarehouseId?: {
    name: string;
    type: string;
    address?: string;
    city?: string;
    pointOfSaleId?: {
      name?: string;
      identificationType?: string;
      identificationNumber?: string;
      address?: string;
      city?: string;
      discountPercentage?: number;
    };
  };
  items: {
    bookId: {
      title: string;
      isbn: string;
      price: number;
    };
    quantity: number;
  }[];
  createdBy?: { name: string };
  observations?: string;
  financialMovementId?: string | { _id: string };
  subType?: string;
  invoiceRef?: string;
}


interface MovementsListProps {
  movements: Movement[];
  isLoading: boolean;
}

export function InventoryMovementsList({
  movements,
  isLoading,
}: MovementsListProps) {
  const router = useRouter();
  const [editorialSettings, setEditorialSettings] = useState<EditorialSettings | undefined>(undefined);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings/editorial');
        if (res.ok) {
          const result = await res.json();
          setEditorialSettings(result.data);
        }
      } catch (error) {
        console.error('Error fetching editorial settings for PDF:', error);
      }
    };
    fetchSettings();
  }, []);

  if (isLoading) {
    return (
      <div className="inventory-movements-list__loading">
        Cargando movimientos...
      </div>
    );
  }

  if (movements.length === 0) {
    return (
      <div className="inventory-movements-list__empty">
        No hay movimientos recientes
      </div>
    );
  }

  const canGeneratePDF = (type: string) => {
    return type === 'REMISION' || type === 'DEVOLUCION';
  };

  return (
    <div className="inventory-movements-list">
      <Table className="inventory-movements-list__table">
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Origen / Destino</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Usuario</TableHead>
            <TableHead className="inventory-movements-list__actions-head">
              Acciones
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.map((movement) => (
            <TableRow key={movement._id}>
              <TableCell className="inventory-movements-list__date">
                {format(new Date(movement.date), 'dd/MM/yyyy HH:mm', {
                  locale: es,
                })}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{movement.type}</Badge>
              </TableCell>
              <TableCell>
                <div className="inventory-movements-list__route">
                  {movement.fromWarehouseId && (
                    <span className="inventory-movements-list__route-from">
                      De: {movement.fromWarehouseId.name}
                    </span>
                  )}
                  {movement.toWarehouseId && (
                    <span className="inventory-movements-list__route-to">
                      A: {movement.toWarehouseId.name}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="inventory-movements-list__items-list">
                  {movement.items.map((item, idx) => (
                    <div key={idx} className="inventory-movements-list__item">
                      {formatNumber(item.quantity)} x{' '}
                      {item.bookId?.title || 'Libro desconocido'}
                    </div>
                  ))}
                </div>
              </TableCell>
              <TableCell className="inventory-movements-list__user">
                {movement.createdBy?.name || 'Sistema'}
              </TableCell>
              <TableCell className="inventory-movements-list__actions">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push(`/dashboard/inventory/${movement._id}`)}
                  title="Ver Detalles"
                >
                  <Eye className="inventory-movements-list__icon" />
                </Button>

                {canGeneratePDF(movement.type) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (movement.fromWarehouseId && movement.toWarehouseId) {
                        generateMovementPDF(
                          movement as Parameters<typeof generateMovementPDF>[0],
                          editorialSettings
                        );
                      }
                    }}
                    title="Descargar PDF"
                  >
                    <FileText className="inventory-movements-list__icon" />
                  </Button>
                )}
                {movement.financialMovementId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const id =
                        typeof movement.financialMovementId === 'object'
                          ? movement.financialMovementId?._id
                          : movement.financialMovementId;
                      if (id) window.open(`/dashboard/movements/${id}`, '_blank');
                    }}
                    title="Ver Movimiento Financiero"
                  >
                    <ExternalLink className="inventory-movements-list__icon text-primary" />
                  </Button>
                )}
              </TableCell>

            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
