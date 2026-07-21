import * as mongoose from 'mongoose';
import { add, multiply, toNumber, DecimalValue } from '@/lib/math';
import {
  Item,
  MovementDoc,
  FormattedMovement,
  ccArrayIncludes,
} from './types';

export function formatMovements(
  movements: MovementDoc[],
  costCenterCode?: string
): FormattedMovement[] {
  return movements.map((m: MovementDoc) => {
    let normalizedType = m.type;
    if (m.type === 'Ingreso') normalizedType = 'INCOME';
    else if (m.type === 'Egreso') normalizedType = 'EXPENSE';

    const amountInCOP = toNumber(m.amountInCOP);
    let relevantAmount = amountInCOP;

    if (costCenterCode) {
      if (m.items && m.items.length > 0) {
        const matchingTotal = m.items.reduce((sum, item) => {
          const itemCC = item.costCenter || m.costCenter;
          if (ccArrayIncludes(itemCC, costCenterCode)) {
            return add(sum, item.total?.toString() || '0');
          }
          return sum;
        }, '0');
        relevantAmount = toNumber(
          multiply(matchingTotal, m.exchangeRate?.toString() || '1')
        );
      } else if (m.allocations && m.allocations.length > 0) {
        const matchingTotal = m.allocations.reduce((sum, alloc) => {
          if (ccArrayIncludes(alloc.costCenter, costCenterCode)) {
            return add(sum, alloc.amount?.toString() || '0');
          }
          return sum;
        }, '0');
        relevantAmount = toNumber(
          multiply(matchingTotal, m.exchangeRate?.toString() || '1')
        );
      } else if (!ccArrayIncludes(m.costCenter, costCenterCode)) {
        relevantAmount = 0;
      }
    }

    return {
      ...m,
      type: normalizedType,
      amount: toNumber(m.amount),
      amountInCOP,
      relevantAmount,
      exchangeRate: toNumber(m.exchangeRate),
      unit: m.unit,
      quantity: m.quantity ? toNumber(m.quantity) : undefined,
      unitValue: m.unitValue ? toNumber(m.unitValue) : undefined,
      allocations: m.allocations?.map((a) => ({
        ...a,
        amount: a.amount ? toNumber(a.amount) : 0,
      })),
      items: m.items?.map((item) => ({
        ...item,
        quantity: item.quantity ? toNumber(item.quantity) : 0,
        unitValue: item.unitValue ? toNumber(item.unitValue) : 0,
        total: item.total ? toNumber(item.total) : 0,
        catalogPrice: item.catalogPrice
          ? toNumber(item.catalogPrice)
          : undefined,
        discount: item.discount ? toNumber(item.discount) : 0,
      })),
      _id: m._id.toString(),
    } as FormattedMovement;
  });
}

export function formatSingleMovement(
  movement: mongoose.Document & MovementDoc
): FormattedMovement {
  const obj = movement.toObject
    ? (movement.toObject() as MovementDoc)
    : movement;
  return {
    ...obj,
    amount: toNumber(movement.amount),
    amountInCOP: toNumber(movement.amountInCOP as DecimalValue),
    exchangeRate: toNumber(movement.exchangeRate as DecimalValue),
    unit: movement.unit as string | undefined,
    quantity: movement.quantity ? toNumber(movement.quantity) : undefined,
    unitValue: movement.unitValue ? toNumber(movement.unitValue) : undefined,
    allocations: obj.allocations?.map((a) => ({
      ...a,
      amount: a.amount ? toNumber(a.amount) : 0,
    })),
    items: (obj.items as Item[])?.map((item) => ({
      ...item,
      quantity: item.quantity ? toNumber(item.quantity) : 0,
      unitValue: item.unitValue ? toNumber(item.unitValue) : 0,
      total: item.total ? toNumber(item.total) : 0,
      catalogPrice: item.catalogPrice ? toNumber(item.catalogPrice) : undefined,
      discount: item.discount ? toNumber(item.discount) : 0,
    })),
    _id: movement._id.toString(),
  } as FormattedMovement;
}
