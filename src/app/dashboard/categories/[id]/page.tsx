'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Category } from '@/types/category';
import { useToast } from '@/components/ui/Toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { formatCurrency } from '@/lib/utils';

interface Movement {
  _id: string;
  date: string;
  description: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
}

import './category-detail.scss';

export default function CategoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const { toast } = useToast();
  const [category, setCategory] = useState<Category | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch category
        const catRes = await fetch(
          `/api/finance/categories/${unwrappedParams.id}`
        );
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
  }, [unwrappedParams.id, toast]);

  if (loading)
    return <div className="category-detail__loading">Cargando...</div>;
  if (!category)
    return (
      <div className="category-detail__error">Categoría no encontrada</div>
    );

  return (
    <div className="category-detail">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="category-detail__back-btn"
      >
        <ArrowLeft className="category-detail__icon" /> Volver
      </Button>

      <div className="category-detail__header">
        <div className="category-detail__title-group">
          <h1 className="category-detail__title">{category.name}</h1>
          {category.description && (
            <p className="category-detail__description">
              {category.description}
            </p>
          )}
        </div>
        <div className="category-detail__badges">
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

      <div className="category-detail__content">
        <h2 className="category-detail__section-title">
          Movimientos Asociados
        </h2>
        {movements.length === 0 ? (
          <p className="category-detail__empty">
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
                      className="category-detail__link"
                      onClick={() =>
                        router.push(`/dashboard/movements/${mov._id}`)
                      }
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
                        ? 'category-detail__amount--income'
                        : 'category-detail__amount--expense'
                    }
                  >
                    {mov.type === 'INCOME' ? '+' : '-'}
                    {formatCurrency(mov.amount)}
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
