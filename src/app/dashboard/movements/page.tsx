'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Eye, Plus, Trash2, Pencil } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Movement } from '@/types/movement';
import { Input } from '@/components/ui/input';

export default function MovementsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (typeFilter !== 'ALL') params.append('type', typeFilter);

      const res = await fetch(`/api/finance/movements?${params.toString()}`);
      if (!res.ok) throw new Error('Error al cargar movimientos');
      const data = await res.json();
      setMovements(data.data || []);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los movimientos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMovements();
    }, 500); // Debounce search
    return () => clearTimeout(timer);
  }, [search, typeFilter]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este movimiento? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const res = await fetch(`/api/finance/movements/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Error al eliminar');

      toast({
        title: 'Éxito',
        description: 'Movimiento eliminado correctamente',
      });
      fetchMovements();
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el movimiento',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Movimientos Financieros</h1>
          <Button onClick={() => router.push('/dashboard/movements/crear')}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Movimiento
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Buscar por descripción, categoría, beneficiario..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="flex h-10 w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="ALL">Todos los Tipos</option>
            <option value="INCOME">Ingresos</option>
            <option value="EXPENSE">Egresos</option>
          </select>
        </div>

        <div className="bg-card border rounded-md shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : movements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No hay movimientos registrados.
                  </TableCell>
                </TableRow>
              ) : (
                movements.map((movement) => (
                  <TableRow key={movement._id}>
                    <TableCell>
                      {new Date(movement.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium">
                      <a href={`/dashboard/movements/${movement._id}`} className="hover:underline hover:text-primary">
                        {movement.description}
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge variant={movement.type === 'INCOME' ? 'default' : 'destructive'}>
                        {movement.type === 'INCOME' ? 'Ingreso' : 'Egreso'}
                      </Badge>
                    </TableCell>
                    <TableCell>{typeof movement.category === 'string' ? movement.category : movement.category.name}</TableCell>
                    <TableCell>
                      <span className={movement.type === 'INCOME' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                        {movement.type === 'INCOME' ? '+' : '-'}{movement.currency} ${movement.amount.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      {movement.status && <Badge variant="outline">{movement.status}</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/dashboard/movements/${movement._id}`)}
                          title="Ver detalle"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/dashboard/movements/${movement._id}/editar`)}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(movement._id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>

                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

    </div>
  );
}
