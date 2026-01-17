import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

interface Movement {
  _id?: string;
  id?: string;
  date: string;
  description: string;
  amount: number;
  type: string;
  category: string | { name: string };
}

interface RecentMovementsProps {
  movements: Movement[];
}

export function RecentMovements({ movements }: RecentMovementsProps) {
  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-4 border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0 pb-4">
        <CardTitle className="font-serif text-xl font-normal text-foreground">Movimientos Recientes</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <div className="space-y-8">
          {movements.map((movement) => (
            <div key={movement._id || movement.id} className="flex items-center gap-3">
              {/* Circular Icon */}
              <div className={(movement.type === 'INCOME' || movement.type === 'Ingreso') ? 'icon-circle-success' : 'icon-circle-danger'}>
                {(movement.type === 'INCOME' || movement.type === 'Ingreso') ? (
                  <ArrowUpCircle className="w-5 h-5" />
                ) : (
                  <ArrowDownCircle className="w-5 h-5" />
                )}
              </div>

              <div className="space-y-1 min-w-0 pr-4 flex-1">
                <p className="text-sm leading-none font-medium truncate">
                  {movement.description}
                </p>
                <p className="text-muted-foreground text-xs">
                  {typeof movement.category === 'string' ? movement.category : movement.category.name} •{' '}
                  {new Date(movement.date).toLocaleDateString()}
                </p>
              </div>
              <div
                className={`ml-auto font-medium font-sans ${(movement.type === 'INCOME' || movement.type === 'Ingreso') ? 'text-flow' : 'text-ebb'}`}>
                {(movement.type === 'INCOME' || movement.type === 'Ingreso') ? '+' : '-'}
                {new Intl.NumberFormat('es-CO', {
                  style: 'currency',
                  currency: 'COP',
                  maximumFractionDigits: 0,
                }).format(movement.amount)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
