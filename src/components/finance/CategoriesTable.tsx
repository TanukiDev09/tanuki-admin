'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Category } from '@/types/category';
import { useRouter } from 'next/navigation';

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

  if (loading) {
    return (
      <div className="w-full text-center py-8 bg-card border rounded-md">
        Cargando categorías...
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="w-full text-center py-8 bg-card border rounded-md">
        No hay categorías registradas.
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-md shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Total Acumulado</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <TableRow key={category._id}>
              <TableCell className="font-medium">
                <span
                  className="cursor-pointer hover:underline hover:text-primary"
                  onClick={() => router.push(`/dashboard/categories/${category._id}`)}
                >
                  {category.name}
                </span>
              </TableCell>
              <TableCell className="font-mono">
                ${(category.totalAmount || 0).toLocaleString()}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    category.type === 'Ingreso'
                      ? 'default'
                      : category.type === 'Egreso'
                        ? 'destructive'
                        : 'secondary'
                  }
                >
                  {category.type}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={category.isActive ? 'outline' : 'secondary'}>
                  {category.isActive ? 'Activo' : 'Inactivo'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      router.push(`/dashboard/categories/${category._id}`)
                    }
                    title="Ver detalle"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(category)}
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(category._id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
