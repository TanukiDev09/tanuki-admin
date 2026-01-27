'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import './RecentMovements.scss';

interface Movement {
  _id?: string;
  id?: string;
  date: string;
  description: string;
  amount: number | string;
  currency?: string;
  amountInCOP?: number | string;
  type: string;
  category: string | { name: string };
}

import { toNumber } from '@/lib/math';

interface RecentMovementsProps {
  movements: Movement[];
}

export function RecentMovements({ movements }: RecentMovementsProps) {
  return (
    <Card className="recent-movements recent-movements--no-border">
      <CardHeader className="recent-movements__header">
        <CardTitle className="recent-movements__title">
          Movimientos Recientes
        </CardTitle>
      </CardHeader>
      <CardContent className="recent-movements__content">
        <div className="recent-movements__list">
          {movements.map((movement) => {
            const isIncome =
              movement.type === 'INCOME' || movement.type === 'Ingreso';
            const movementId = movement._id || movement.id;

            return (
              <Link
                href={`/dashboard/movements/${movementId}`}
                key={movementId}
                className="recent-movements__item-link"
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'block',
                }}
              >
                <div className="recent-movements__item hover:bg-muted/50 transition-colors rounded-lg p-2 -mx-2">
                  <div
                    className={`recent-movements__icon-container ${isIncome ? 'recent-movements__icon-container--success' : 'recent-movements__icon-container--danger'}`}
                  >
                    {isIncome ? (
                      <ArrowUpCircle className="recent-movements__icon" />
                    ) : (
                      <ArrowDownCircle className="recent-movements__icon" />
                    )}
                  </div>

                  <div className="recent-movements__item-info">
                    <p className="recent-movements__item-description">
                      {movement.description}
                    </p>
                    <p className="recent-movements__item-meta">
                      {movement.category
                        ? typeof movement.category === 'string'
                          ? movement.category
                          : movement.category?.name
                        : 'Sin categoría'}{' '}
                      • {new Date(movement.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div
                    className={`recent-movements__item-amount ${isIncome ? 'recent-movements__item-amount--income' : 'recent-movements__item-amount--expense'}`}
                  >
                    {isIncome ? '+' : '-'}
                    {formatCurrency(
                      toNumber(movement.amountInCOP || movement.amount),
                      'COP'
                    )}
                    {movement.currency && movement.currency !== 'COP' && (
                      <span className="recent-movements__secondary-amount text-[10px] block opacity-70">
                        {formatCurrency(
                          toNumber(movement.amount),
                          movement.currency
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
