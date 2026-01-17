'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Movement {
  _id: string;
  type: string;
  date: string;
  fromWarehouseId?: { name: string };
  toWarehouseId?: { name: string };
  items: { bookId: { title: string }; quantity: number }[];
  createdBy?: { name: string };
}

interface MovementsListProps {
  movements: Movement[];
  isLoading: boolean;
}

export function InventoryMovementsList({ movements, isLoading }: MovementsListProps) {
  if (isLoading) {
    return <div className="p-4 text-center">Cargando movimientos...</div>;
  }

  if (movements.length === 0) {
    return <div className="p-4 text-center text-muted-foreground">No hay movimientos recientes</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Origen / Destino</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Usuario</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.map((movement) => (
            <TableRow key={movement._id}>
              <TableCell>
                {format(new Date(movement.date), 'dd/MM/yyyy HH:mm', { locale: es })}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{movement.type}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex flex-col text-xs">
                  {movement.fromWarehouseId && (
                    <span className="text-muted-foreground">De: {movement.fromWarehouseId.name}</span>
                  )}
                  {movement.toWarehouseId && (
                    <span>A: {movement.toWarehouseId.name}</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="max-h-20 overflow-y-auto text-sm">
                  {movement.items.map((item, idx) => (
                    <div key={idx}>
                      {item.quantity} x {item.bookId?.title || 'Libro desconocido'}
                    </div>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {movement.createdBy?.name || 'Sistema'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
