'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Pencil, Trash2, Eye } from 'lucide-react';
import { CostCenter } from '@/types/cost-center';
import { usePermission } from '@/hooks/usePermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import { useRouter } from 'next/navigation';
import './CostCentersTable.scss';

interface CostCentersTableProps {
  costCenters: CostCenter[];
  loading: boolean;
  onEdit: (costCenter: CostCenter) => void;
  onDelete: (id: string) => void;
}

export default function CostCentersTable({
  costCenters,
  loading,
  onEdit,
  onDelete,
}: CostCentersTableProps) {
  const router = useRouter();
  const { hasPermission } = usePermission();
  const canUpdate = hasPermission(
    ModuleName.COST_CENTERS,
    PermissionAction.UPDATE
  );
  const canDelete = hasPermission(
    ModuleName.COST_CENTERS,
    PermissionAction.DELETE
  );

  if (loading) {
    return (
      <div className="cost-centers-table__loading">
        Cargando centros de costo...
      </div>
    );
  }

  if (costCenters.length === 0) {
    return (
      <div className="cost-centers-table__empty">
        No hay centros de costo registrados.
      </div>
    );
  }

  return (
    <div className="cost-centers-table">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead className="cost-centers-table__actions-head">
              Acciones
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {costCenters.map((cc) => (
            <TableRow key={cc._id}>
              <TableCell className="cost-centers-table__code">
                {cc.code}
              </TableCell>
              <TableCell className="cost-centers-table__name">
                <span
                  style={{
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    textUnderlineOffset: '4px',
                  }}
                  onClick={() =>
                    router.push(`/dashboard/cost-centers/${cc._id}`)
                  }
                >
                  {cc.name}
                </span>
              </TableCell>
              <TableCell>{cc.description || '-'}</TableCell>
              <TableCell className="cost-centers-table__actions-cell">
                <div className="cost-centers-table__actions">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      router.push(`/dashboard/cost-centers/${cc._id}`)
                    }
                    title="Ver Detalle"
                  >
                    <Eye className="cost-centers-table__icon" />
                  </Button>
                  {canUpdate && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(cc)}
                      title="Editar"
                    >
                      <Pencil className="cost-centers-table__icon" />
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(cc._id)}
                      className="cost-centers-table__delete-btn"
                      title="Eliminar"
                    >
                      <Trash2 className="cost-centers-table__icon" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
