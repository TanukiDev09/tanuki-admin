'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Category } from '@/types/category';
import { useToast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function CategoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const { toast } = useToast();
  const [category, setCategory] = useState<Category | null>(null);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch category
        const catRes = await fetch(`/api/finance/categories/${unwrappedParams.id}`);
        if (!catRes.ok) throw new Error('Category not found');
        const catData = await catRes.json();
        setCategory(catData.data);

        // Fetch movements associated with this category
        if (catData.data) {
          const movRes = await fetch(
            `/api/finance/movements?category=${unwrappedParams.id}`
          );
          if (movRes.ok) {
            const movData = await movRes.json();
            setMovements(movData.data || []);
          }
        }
      } catch (error) {
        console.error(error);
        toast({
          title: 'Error',
          description: 'Error cargando datos',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [unwrappedParams.id]);

  if (loading) return <div className="p-8">Cargando...</div>;
  if (!category) return <div className="p-8">Categoría no encontrada</div>;

  return (
    <div className="p-8 space-y-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver
      </Button>

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{category.name}</h1>
          {category.description && (
            <p className="text-muted-foreground mt-2">{category.description}</p>
          )}
        </div>
        <div className="flex gap-2">
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
          <Badge variant={category.isActive ? 'outline' : 'secondary'}>
            {category.isActive ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>
      </div>

      <div className="border rounded-lg p-6 bg-card shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Movimientos Asociados</h2>
        {movements.length === 0 ? (
          <p className="text-muted-foreground">
            No hay movimientos registrados que coincidan con esta categoría.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((mov) => (
                <TableRow key={mov._id}>
                  <TableCell>
                    {new Date(mov.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <span
                      className="cursor-pointer hover:underline hover:text-primary font-medium"
                      onClick={() => router.push(`/dashboard/movements/${mov._id}`)}
                    >
                      {mov.description}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        mov.type === 'INCOME' ? 'default' : 'destructive'
                      }
                    >
                      {mov.type === 'INCOME' ? 'Ingreso' : 'Egreso'}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={
                      mov.type === 'INCOME'
                        ? 'text-green-600 font-medium'
                        : 'text-red-600 font-medium'
                    }
                  >
                    {mov.type === 'INCOME' ? '+' : '-'}$
                    {mov.amount.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
