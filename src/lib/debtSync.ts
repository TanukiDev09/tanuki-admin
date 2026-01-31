import Debt from '@/models/Debt';
import PointOfSale from '@/models/PointOfSale';
import ExternalEntity from '@/models/ExternalEntity';
import { toNumber } from './math';

// import { IDebt } from '@/types/debt';

interface MinimalInvoice {
  _id: string;
  status: string;
  customerTaxId?: string;
  customerName: string;
  total: number;
  dueDate?: Date;
  number: string;
}

export async function syncInvoiceToDebt(invoice: MinimalInvoice) {
  // We only track debts for Sent and Partial invoices.
  // Drafts haven't been "issued", and Paid/Cancelled are finalized.
  if (
    invoice.status === 'Paid' ||
    invoice.status === 'Cancelled' ||
    invoice.status === 'Draft'
  ) {
    const existing = await Debt.findOne({ 'source.id': invoice._id });
    if (existing) {
      await handleExistingDebtForFinalizedInvoice(existing, invoice.status);
    }
    return;
  }

  // Find appropriate entity
  const { entityType, entityId } = await findOrCreateEntityForInvoice(invoice);

  // Sync Debt
  await updateDebtFromInvoice(invoice, entityType, entityId);
}

async function handleExistingDebtForFinalizedInvoice(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  debt: any,
  status: string
) {
  if (status === 'Paid') {
    debt.paidAmount = debt.totalAmount;
    debt.remainingBalance = 0;
    debt.status = 'Pagado';
    await debt.save();
  } else if (toNumber(debt.paidAmount) === 0) {
    await Debt.findByIdAndDelete(debt._id);
  }
}

async function findOrCreateEntityForInvoice(invoice: MinimalInvoice) {
  const posSearch = invoice.customerTaxId
    ? {
        $or: [
          { identificationNumber: invoice.customerTaxId },
          { name: invoice.customerName },
        ],
      }
    : { name: invoice.customerName };

  const pos = await PointOfSale.findOne(posSearch);
  if (pos) return { entityType: 'PointOfSale' as const, entityId: pos._id };

  const extSearch = invoice.customerTaxId
    ? {
        $or: [{ taxId: invoice.customerTaxId }, { name: invoice.customerName }],
      }
    : { name: invoice.customerName };

  let ext = await ExternalEntity.findOne(extSearch);
  if (!ext) {
    ext = await ExternalEntity.create({
      name: invoice.customerName,
      taxId: invoice.customerTaxId,
      type: 'Persona Natural',
    });
  }
  return { entityType: 'ExternalEntity' as const, entityId: ext._id };
}

async function updateDebtFromInvoice(
  invoice: MinimalInvoice,
  entityType: string,
  entityId: string | object
) {
  await Debt.findOneAndUpdate(
    { 'source.id': invoice._id },
    {
      type: 'Cuenta por Cobrar',
      entityType,
      entityId,
      entityName: invoice.customerName,
      totalAmount: invoice.total,
      $setOnInsert: {
        paidAmount: 0,
        remainingBalance: invoice.total,
      },
      dueDate: invoice.dueDate,
      source: {
        type: 'Invoice',
        id: invoice._id,
        reference: invoice.number,
      },
      status: invoice.status === 'Partial' ? 'Pagado Parcial' : 'Pendiente',
    },
    { upsert: true, new: true }
  );
}
