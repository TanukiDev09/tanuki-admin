'use client';

import { AlertTriangle } from 'lucide-react';
import {
  getAttentionItems,
  type BookOperations,
} from '@/lib/inventory/bookOperations';
import './BookAttention.scss';

/** Tiempo de reimpresión de referencia, igual al de la pestaña Reimpresión. */
const LEAD_TIME_MONTHS = 3;

interface BookAttentionProps {
  operations: BookOperations | null;
}

/** Excepciones primero: solo aparece si hay algo que decidir. */
export default function BookAttention({ operations }: BookAttentionProps) {
  if (!operations) return null;
  const items = getAttentionItems(operations, LEAD_TIME_MONTHS);
  if (items.length === 0) return null;

  return (
    <aside className="book-attention" aria-label="Requiere atención">
      <AlertTriangle className="book-attention__icon" aria-hidden="true" />
      <strong className="book-attention__title">Requiere atención</strong>
      <ul className="book-attention__list">
        {items.map((item) => (
          <li
            key={item.key}
            className={`book-attention__item book-attention__item--${item.level}`}
          >
            {item.text}
          </li>
        ))}
      </ul>
    </aside>
  );
}
