import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import dbConnect from '@/lib/mongodb';
import RoyaltyStatement from '@/models/RoyaltyStatement';
import Debt from '@/models/Debt';
import '@/models/Book';
import '@/models/Creator';
import {
  add,
  subtract,
  multiply,
  divide,
  toNumber,
  compare,
  gtZero,
} from '@/lib/math';
import { buildComputation, resolveFavor } from '@/lib/royalties/calculate';
import { serializeStatement } from '@/lib/royalties/statement';
import { RoyaltyComputation } from '@/types/royalty';

export const dynamic = 'force-dynamic';

async function loadStatement(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return RoyaltyStatement.findById(id)
    .populate('book', 'title isbn')
    .populate('creator', 'name email identification');
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permissionError = await requirePermission(
    request,
    ModuleName.ROYALTIES,
    PermissionAction.READ
  );
  if (permissionError) return permissionError;

  try {
    await dbConnect();
    const { id } = await params;
    const statement = await loadStatement(id);
    if (!statement) {
      return NextResponse.json(
        { error: 'Liquidación no encontrada' },
        { status: 404 }
      );
    }
    return NextResponse.json({ data: serializeStatement(statement) });
  } catch (error) {
    console.error('Royalty GET[id] Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener la liquidación' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permissionError = await requirePermission(
    request,
    ModuleName.ROYALTIES,
    PermissionAction.UPDATE
  );
  if (permissionError) return permissionError;

  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    const action = body.action as string | undefined;

    const statement = await loadStatement(id);
    if (!statement) {
      return NextResponse.json(
        { error: 'Liquidación no encontrada' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'approve':
        await approveStatement(statement);
        break;
      case 'pay':
        await payStatement(statement, body.amount);
        break;
      case 'revert':
        await revertApproval(statement);
        break;
      case 'regenerate':
        await regenerateDraft(statement);
        break;
      default:
        await editDraft(statement, body);
    }

    const fresh = await loadStatement(id);
    return NextResponse.json({ data: serializeStatement(fresh!) });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Error al actualizar';
    console.error('Royalty PATCH Error:', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permissionError = await requirePermission(
    request,
    ModuleName.ROYALTIES,
    PermissionAction.DELETE
  );
  if (permissionError) return permissionError;

  try {
    await dbConnect();
    const { id } = await params;
    const statement = await RoyaltyStatement.findById(id);
    if (!statement) {
      return NextResponse.json(
        { error: 'Liquidación no encontrada' },
        { status: 404 }
      );
    }
    if (statement.status !== 'draft') {
      return NextResponse.json(
        {
          error:
            'Solo se pueden eliminar borradores. Revierte la aprobación primero.',
        },
        { status: 400 }
      );
    }
    await statement.deleteOne();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Royalty DELETE Error:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la liquidación' },
      { status: 500 }
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function approveStatement(statement: any) {
  if (statement.status !== 'draft') {
    throw new Error('Solo se pueden aprobar liquidaciones en borrador');
  }
  statement.status = 'approved';
  statement.approvedAt = new Date();

  // Solo se crea deuda si el saldo queda a favor del autor.
  if (statement.balanceInFavorOf === 'author') {
    const amount = toNumber(statement.netSettlement);
    const debt = await Debt.create({
      type: 'Cuenta por Pagar',
      entityType: 'Creator',
      entityId: statement.creator,
      entityName: statement.creatorName,
      totalAmount: amount,
      paidAmount: 0,
      remainingBalance: amount,
      status: 'Pendiente',
      source: {
        type: 'Regalías',
        id: statement._id,
        reference: `Regalías ${statement.bookTitle}`,
      },
      notes: `Liquidación de regalías — ${statement.bookTitle} (${statement.creatorName})`,
      currency: statement.currency,
    });
    statement.debtId = debt._id;
  }

  await statement.save();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function payStatement(statement: any, rawAmount: unknown) {
  if (statement.status !== 'approved') {
    throw new Error('Solo se pueden pagar liquidaciones aprobadas');
  }
  if (statement.balanceInFavorOf !== 'author') {
    throw new Error('Esta liquidación no genera un pago al autor');
  }

  const net = toNumber(statement.netSettlement);
  const alreadyPaid = toNumber(statement.paidAmount);
  const remaining = toNumber(subtract(net, alreadyPaid));

  // Por defecto se paga el saldo restante completo.
  const amount =
    rawAmount === undefined || rawAmount === null || rawAmount === ''
      ? remaining
      : Number(rawAmount);

  if (!gtZero(amount)) {
    throw new Error('El monto del pago debe ser mayor a cero');
  }
  if (compare(amount, remaining) > 0) {
    throw new Error(
      `El pago (${amount}) excede el saldo pendiente (${remaining})`
    );
  }

  const newPaid = toNumber(add(alreadyPaid, amount));
  statement.paidAmount = newPaid;

  await applyPaymentToDebt(statement.debtId, amount);

  // Si se saldó por completo, la liquidación pasa a "pagada".
  if (compare(newPaid, net) >= 0) {
    statement.status = 'paid';
    statement.paidAt = new Date();
  }

  await statement.save();
}

/** Aplica un abono a la deuda asociada (si existe) y ajusta su estado. */
async function applyPaymentToDebt(
  debtId: unknown,
  amount: number
): Promise<void> {
  if (!debtId) return;
  const debt = await Debt.findById(debtId);
  if (!debt) return;
  const debtPaid = toNumber(add(debt.paidAmount, amount));
  const debtRemaining = toNumber(subtract(debt.totalAmount, debtPaid));
  debt.paidAmount = debtPaid;
  debt.remainingBalance = debtRemaining < 0 ? 0 : debtRemaining;
  debt.status = debtRemaining <= 0 ? 'Pagado' : 'Pagado Parcial';
  await debt.save();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function revertApproval(statement: any) {
  if (statement.status !== 'approved') {
    throw new Error('Solo se puede revertir una liquidación aprobada');
  }
  if (gtZero(statement.paidAmount)) {
    throw new Error(
      'No se puede revertir: ya hay pagos registrados en esta liquidación'
    );
  }
  // Eliminar la deuda asociada (no tuvo pagos)
  if (statement.debtId) {
    await Debt.findByIdAndDelete(statement.debtId);
    statement.debtId = undefined;
  }
  statement.status = 'draft';
  statement.approvedAt = undefined;
  await statement.save();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function regenerateDraft(statement: any) {
  if (statement.status !== 'draft') {
    throw new Error('Solo se pueden recalcular borradores');
  }
  const computation = await buildComputation({
    bookId: statement.book._id.toString(),
    periodStart: statement.periodStart,
    periodEnd: statement.periodEnd,
    royaltyPercentage: statement.royaltyPercentage,
    previousBalance: toNumber(statement.previousBalance),
    advancePayment: toNumber(statement.advancePayment),
  });
  applyComputation(statement, computation);
  await statement.save();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function editDraft(statement: any, body: Record<string, unknown>) {
  // Notas se pueden editar en cualquier estado.
  if (typeof body.notes === 'string') {
    statement.notes = body.notes;
  }

  // En estados no-borrador solo permitimos editar notas.
  if (statement.status === 'draft' && applyDraftOverrides(statement, body)) {
    recomputeTotals(statement);
  }

  await statement.save();
}

/** Aplica overrides editables del borrador. Devuelve true si algo cambió. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyDraftOverrides(statement: any, body: Record<string, unknown>) {
  const fields: Array<keyof typeof body> = [
    'previousBalance',
    'advancePayment',
    'royaltyPercentage',
  ];
  let changed = false;
  for (const field of fields) {
    if (body[field] !== undefined) {
      statement[field] = Number(body[field]);
      changed = true;
    }
  }
  return changed;
}

/** Recalcula regalías y neto sobre las líneas actuales (sin re-consultar facturas). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function recomputeTotals(statement: any) {
  const totalRoyalties = recomputeRoyalties(statement);
  const net = toNumber(
    subtract(
      add(toNumber(statement.previousBalance), totalRoyalties),
      toNumber(statement.advancePayment)
    )
  );
  statement.totalRoyalties = totalRoyalties;
  statement.netSettlement = net;
  statement.balanceInFavorOf = resolveFavor(net);
  statement.carryoverToNext =
    statement.balanceInFavorOf === 'publisher' ? net : 0;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyComputation(statement: any, computation: RoyaltyComputation) {
  statement.lines = computation.lines;
  statement.totalCopies = computation.totalCopies;
  statement.totalInvoiced = computation.totalInvoiced;
  statement.totalRoyalties = computation.totalRoyalties;
  statement.netSettlement = computation.netSettlement;
  statement.carryoverToNext = computation.carryoverToNext;
  statement.balanceInFavorOf = computation.balanceInFavorOf;
}

// Recalcula el % sobre las líneas existentes (si cambió el porcentaje en el borrador).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function recomputeRoyalties(statement: any): number {
  const pct = statement.royaltyPercentage;
  let total = '0';
  for (const line of statement.lines) {
    const royalty = toNumber(divide(multiply(line.totalInvoiced, pct), 100));
    line.totalRoyalty = royalty;
    total = add(total, royalty);
  }
  return toNumber(total);
}
