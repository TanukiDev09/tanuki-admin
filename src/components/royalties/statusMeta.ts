import { BadgeProps } from '@/components/ui/Badge';
import {
  RoyaltyStatementStatus,
  BalanceFavor,
} from '@/types/royalty';

export const STATUS_META: Record<
  RoyaltyStatementStatus,
  { label: string; variant: BadgeProps['variant'] }
> = {
  draft: { label: 'Borrador', variant: 'secondary' },
  approved: { label: 'Aprobada', variant: 'warning' },
  paid: { label: 'Pagada', variant: 'success' },
};

export const FAVOR_META: Record<
  BalanceFavor,
  { label: string; variant: BadgeProps['variant'] }
> = {
  author: { label: 'A favor del autor', variant: 'info' },
  publisher: { label: 'A favor de la editorial', variant: 'outline' },
  none: { label: 'Saldo en cero', variant: 'outline' },
};

export const roleLabel = (role: string) =>
  role === 'author'
    ? 'Autor'
    : role === 'illustrator'
      ? 'Ilustrador'
      : role === 'translator'
        ? 'Traductor'
        : role;
