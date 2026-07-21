import * as mongoose from 'mongoose';
import InventoryMovement from '@/models/InventoryMovement';
import Debt from '@/models/Debt';
import { add, subtract, multiply, divide, toNumber, gtZero, isMatchedFinancial } from '@/lib/math';
import { CreateMovementBody, toCostCenterArray } from './types';

// Helper to validate allocations
function validateAllocations(
  body: CreateMovementBody,
  amount: string | number
) {
  if (!body.allocations || body.allocations.length === 0) return null;

  let sumAllocations = '0';
  for (const allocation of body.allocations) {
    if (!allocation.costCenter) {
      return {
        error: 'Todas las asignaciones deben tener un centro de costo',
        status: 400,
      };
    }
    const allocAmount = allocation.amount;
    sumAllocations = add(sumAllocations, allocAmount);
  }

  if (!isMatchedFinancial(amount, sumAllocations, 10)) {
    return {
      error: `La suma de los detalles (${sumAllocations}) debe ser igual al total del movimiento (${amount})`,
      status: 400,
    };
  }

  return null;
}

// Helper to validate and sanitize input
export function validateAndSanitize(body: CreateMovementBody) {
  // Sanitize strictly required fields
  if (!body.description || !body.type || !body.date) {
    return {
      error: 'Faltan campos obligatorios (Descripción, Tipo, Fecha)',
      status: 400,
    };
  }

  // Ensure amount is string/number, math.ts toBig will handle it
  const amount = body.amount || '0';

  const allocationError = validateAllocations(body, amount);
  if (allocationError) return allocationError;

  return { amount: amount.toString() };
}

// Helper to calculate derived financial values
export function calculateFinancials(body: CreateMovementBody, amount: string) {
  // Normalize type
  let type: string = body.type || 'Ingreso';
  if (type === 'INCOME') type = 'Ingreso';
  if (type === 'EXPENSE') type = 'Egreso';

  // Fiscal Year
  const fiscalYear =
    body.fiscalYear || new Date(body.date as string).getFullYear();

  // Exchange Rate & Amount in COP
  const exchangeRate =
    body.currency === 'COP' ? '1' : body.exchangeRate?.toString() || '1';
  const amountInCOP =
    body.currency === 'COP' ? amount : multiply(amount, exchangeRate);

  // Unit Value
  let unitValue = '0';
  const quantity = body.quantity?.toString() || '0';
  if (gtZero(quantity)) {
    unitValue = divide(amount, quantity);
  }

  return { type, fiscalYear, amountInCOP, unitValue, quantity };
}

// Helper to construct the final DB document
interface Financials {
  type: string;
  fiscalYear: number;
  amountInCOP: number | string;
  unitValue: number | string;
  quantity: number | string;
}

export function buildMovementDoc(
  body: CreateMovementBody,
  financials: Financials,
  amount: string
) {
  const { type, fiscalYear, amountInCOP, unitValue, quantity } = financials;

  const flowDirection = type === 'Ingreso' ? 'inflow' : 'outflow';
  const movementType =
    type === 'Ingreso' ? 'factura_emitida' : 'factura_recibida';

  let allocations;
  if (body.allocations && body.allocations.length > 0) {
    allocations = body.allocations;
  } else {
    // Legacy/Simple mode: Single cost center from top-level field
    allocations = [
      {
        costCenter: body.costCenter || '01T001',
        amount: amount,
      },
    ];
  }
  // costCenter is always stored as an array in the DB
  allocations = allocations.map((alloc) => ({
    ...alloc,
    costCenter: toCostCenterArray(alloc.costCenter),
  }));

  const metadata = {
    source: 'manual',
    createdAt: new Date(),
  };

  // Normalize items if present
  let items = body.items;
  if (items && Array.isArray(items)) {
    items = items.map((item) => ({
      ...item,
      quantity: toNumber(item.quantity).toString(),
      unitValue: toNumber(item.unitValue).toString(),
      total: toNumber(item.total).toString(),
      catalogPrice: item.catalogPrice
        ? toNumber(item.catalogPrice).toString()
        : undefined,
      discount: toNumber(item.discount || 0).toString(),
      costCenter: toCostCenterArray(item.costCenter),
      bookId:
        item.bookId && mongoose.isValidObjectId(item.bookId)
          ? item.bookId
          : null,
    }));
  }

  return {
    ...body,
    amount, // Explicitly set numeric amount
    type, // Override with normalized type
    fiscalYear,
    quantity, // Use numeric quantity
    flowDirection,
    movementType,
    costCenter: toCostCenterArray(body.costCenter ?? allocations[0]?.costCenter),
    allocations,
    items, // Set normalized items
    metadata,
    amountInCOP,
    unitValue,
    issuerId: body.issuerId || body.beneficiary || null,
    issuerName:
      body.issuerName || body.beneficiary || 'Persona no especificada',
    receiverId: body.receiverId || 'Tanuki Admin',
    receiverName: body.receiverName || 'Tanuki Admin Hub',
    paymentChannel: body.paymentChannel || 'otro',
    notes: body.notes || 'Sin notas adicionales',
    date: new Date(body.date as string),
    salesChannel: body.salesChannel,
    pointOfSale:
      body.pointOfSale && mongoose.isValidObjectId(body.pointOfSale)
        ? body.pointOfSale
        : null,
    debtId:
      body.debtId && mongoose.isValidObjectId(body.debtId) ? body.debtId : null,
    inventoryMovementId: body.inventoryMovementId || null,
  };
}

export async function linkInventoryMovement(
  inventoryMovementId: string,
  movementId: mongoose.Types.ObjectId | string
) {
  try {
    await InventoryMovement.findByIdAndUpdate(inventoryMovementId, {
      financialMovementId: movementId,
    });
  } catch (linkErr) {
    console.error('Error linking to inventory movement:', linkErr);
  }
}

export async function updateDebtProgress(debtId: string, movementAmount: number) {
  const debt = await Debt.findById(debtId);
  if (!debt) return;

  const newPaidAmount = add(debt.paidAmount, movementAmount);
  const newRemainingBalance = subtract(debt.totalAmount, newPaidAmount);

  debt.paidAmount = newPaidAmount;
  debt.remainingBalance = newRemainingBalance;

  if (toNumber(newRemainingBalance) <= 0) {
    debt.status = 'Pagado';
  } else {
    debt.status = 'Pagado Parcial';
  }

  await debt.save();
}
