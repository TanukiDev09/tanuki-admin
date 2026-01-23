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
import { Badge } from '@/components/ui/Badge';
import { Category } from '@/types/category';
import { useRouter } from 'next/navigation';
import { usePermission } from '@/hooks/usePermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import { formatCurrency } from '@/lib/utils';
import './CategoriesTable.scss';

interface CategoriesTableProps {
  categories: Category[];
  loading: boolean;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
}

export default function CategoriesTable({
  categories,
  loading,
  onEdit,
  onDelete,
}: CategoriesTableProps) {
  const router = useRouter();
  const { hasPermission } = usePermission();
  const canUpdate = hasPermission(
    ModuleName.CATEGORIES,
    PermissionAction.UPDATE
  );
  const canDelete = hasPermission(
    ModuleName.CATEGORIES,
    PermissionAction.DELETE
  );

  if (loading) {
    return (
      <div className="categories-table__loading">Cargando categorías...</div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="categories-table__empty">
        No hay categorías registradas.
      </div>
    );
  }

  return (
    <div className="categories-table">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Total Acumulado</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="categories-table__actions-head">
              Acciones
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <TableRow key={category._id}>
              <TableCell className="categories-table__name">
                <div className="categories-table__name-container">
                  <div
                    className="categories-table__color-dot"
                    style={{ backgroundColor: category.color || '#64748b' }}
                  />
                  <span
                    onClick={() =>
                      router.push(`/dashboard/categories/${category._id}`)
                    }
                  >
                    {category.name}
                  </span>
                </div>
              </TableCell>
              <TableCell className="categories-table__amount">
                {formatCurrency(category.totalAmount || 0)}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    category.type === 'Ingreso'
                      ? 'success'
                      : category.type === 'Egreso'
                        ? 'destructive'
                        : 'secondary'
                  }
                >
                  {category.type}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={category.isActive ? 'outline' : 'warning'}>
                  {category.isActive ? 'Activo' : 'Inactivo'}
                </Badge>
              </TableCell>
              <TableCell className="categories-table__actions-cell">
                <div className="categories-table__actions">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      router.push(`/dashboard/categories/${category._id}`)
                    }
                    title="Ver detalle"
                  >
                    <Eye className="categories-table__icon" />
                  </Button>
                  {canUpdate && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(category)}
                      title="Editar"
                    >
                      <Pencil className="categories-table__icon" />
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(category._id)}
                      className="categories-table__delete-btn"
                      title="Eliminar"
                    >
                      <Trash2 className="categories-table__icon" />
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
