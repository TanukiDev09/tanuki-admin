'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Pencil } from 'lucide-react';
import { Movement } from '@/types/movement';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function MovementDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [movement, setMovement] = useState<Movement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovement = async () => {
      try {
        const res = await fetch(`/api/finance/movements/${params.id}`);
        if (!res.ok) throw new Error('No se encontró el movimiento');
        const data = await res.json();
        setMovement(data.data);
      } catch (error) {
        console.error(error);
        toast({ title: 'Error', description: 'No se pudo cargar el movimiento', variant: 'destructive' });
        router.push('/dashboard/movimientos');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) fetchMovement();
  }, [params.id, router, toast]);

  if (loading) return <div className="p-8 text-center">Cargando...</div>;
  if (!movement) return <div className="p-8 text-center">Movimiento no encontrado</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6 pl-0">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver
      </Button>

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Detalle de Movimiento</h1>
          <Badge variant="outline" className="text-sm">
            {movement.status || 'COMPLETED'}
          </Badge>
        </div>
        <Button onClick={() => router.push(`/dashboard/movements/${movement._id}/editar`)}>
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{movement.description}</CardTitle>
          <p className="text-sm text-muted-foreground">{new Date(movement.date).toLocaleDateString()}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Tipo</h3>
              <p className={movement.type === 'INCOME' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                {movement.type === 'INCOME' ? 'INGRESO' : 'EGRESO'}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Monto</h3>
              <p className="text-xl font-bold">${movement.amount.toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Unidad</h3>
              <p>{movement.unit || '-'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Cantidad</h3>
              <p>{movement.quantity ? Number(movement.quantity).toLocaleString() : '-'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Valor Unitario</h3>
              <p>{movement.unitValue ? `$${Number(movement.unitValue).toLocaleString()}` : '-'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Categoría</h3>
              <p>{typeof movement.category === 'string' ? movement.category : movement.category.name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Centro de Costos</h3>
              <p>{movement.costCenter || '-'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Beneficiario / Pagador</h3>
              <p>{movement.beneficiary}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Canal de Pago</h3>
              <p>{movement.paymentChannel}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Notas</h3>
            <p className="whitespace-pre-wrap">{movement.notes || 'Sin notas adicionales.'}</p>
          </div>

          {movement.invoiceRef && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Referencia Factura</h3>
              <p>{movement.invoiceRef}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
