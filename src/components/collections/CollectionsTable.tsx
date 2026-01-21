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
import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Collection } from '@/types/collection';
import { usePermission } from '@/hooks/usePermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import './CollectionsTable.scss';

interface CollectionsTableProps {
  collections: Collection[];
  loading: boolean;
  onEdit: (collection: Collection) => void;
  onDelete: (id: string) => void;
}

export default function CollectionsTable({
  collections,
  loading,
  onEdit,
  onDelete,
}: CollectionsTableProps) {
  const { hasPermission } = usePermission();
  const canUpdate = hasPermission(
    ModuleName.COLLECTIONS,
    PermissionAction.UPDATE
  );
  const canDelete = hasPermission(
    ModuleName.COLLECTIONS,
    PermissionAction.DELETE
  );

  if (loading) {
    return (
      <div className="collections-table__loading">Cargando colecciones...</div>
    );
  }

  if (collections.length === 0) {
    return (
      <div className="collections-table__empty">
        No hay colecciones registradas.
      </div>
    );
  }

  return (
    <div className="collections-table">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="collections-table__actions-head">
              Acciones
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {collections.map((collection) => (
            <TableRow key={collection._id}>
              <TableCell className="collections-table__name">
                {collection.name}
              </TableCell>
              <TableCell className="collections-table__description">
                {collection.description || '-'}
              </TableCell>
              <TableCell>
                <Badge variant={collection.isActive ? 'outline' : 'warning'}>
                  {collection.isActive ? 'Activo' : 'Inactivo'}
                </Badge>
              </TableCell>
              <TableCell className="collections-table__actions-cell">
                <div className="collections-table__actions">
                  {canUpdate && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(collection)}
                      title="Editar"
                    >
                      <Pencil className="collections-table__icon" />
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(collection._id)}
                      className="collections-table__delete-btn"
                      title="Eliminar"
                    >
                      <Trash2 className="collections-table__icon" />
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
