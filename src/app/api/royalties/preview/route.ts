import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import dbConnect from '@/lib/mongodb';
import Agreement from '@/models/Agreement';
import '@/models/Book';
import '@/models/Creator';
import { buildComputation } from '@/lib/royalties/calculate';
import { resolveDefaults } from '@/lib/royalties/statement';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const permissionError = await requirePermission(
    request,
    ModuleName.ROYALTIES,
    PermissionAction.READ
  );
  if (permissionError) return permissionError;

  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const agreementId = searchParams.get('agreementId');
    const periodStartRaw = searchParams.get('periodStart');
    const periodEndRaw = searchParams.get('periodEnd');
    const previousBalanceRaw = searchParams.get('previousBalance');
    const advancePaymentRaw = searchParams.get('advancePayment');

    if (!agreementId || !periodStartRaw || !periodEndRaw) {
      return NextResponse.json(
        { error: 'Contrato y periodo (desde/hasta) son obligatorios' },
        { status: 400 }
      );
    }

    const periodStart = new Date(periodStartRaw);
    const periodEnd = new Date(periodEndRaw);

    const agreement = await Agreement.findById(agreementId)
      .populate('book', 'title isbn costCenter')
      .populate('creator', 'name email identification');

    if (!agreement) {
      return NextResponse.json(
        { error: 'Contrato no encontrado' },
        { status: 404 }
      );
    }

    const book = agreement.book as unknown as {
      _id: object;
      title: string;
      costCenter?: string;
    };
    const creator = agreement.creator as unknown as {
      name: string;
      email?: string;
      identification?: string;
    };

    const defaults = await resolveDefaults({
      agreementId,
      role: agreement.role,
      bookCostCenter: book.costCenter,
      periodStart,
      periodEnd,
    });
    const previousBalance =
      previousBalanceRaw !== null
        ? Number(previousBalanceRaw)
        : defaults.previousBalance;
    const advancePayment =
      advancePaymentRaw !== null
        ? Number(advancePaymentRaw)
        : defaults.advancePayment;

    const computation = await buildComputation({
      bookId: book._id.toString(),
      periodStart,
      periodEnd,
      royaltyPercentage: agreement.royaltyPercentage,
      previousBalance,
      advancePayment,
    });

    return NextResponse.json({
      data: {
        ...computation,
        bookTitle: book.title,
        creatorName: creator.name,
        creatorEmail: creator.email,
        creatorIdentification: creator.identification,
        royaltyPercentage: agreement.royaltyPercentage,
        // Defaults sugeridos (para que la UI los muestre como punto de partida)
        defaultPreviousBalance: defaults.previousBalance,
        defaultAdvancePayment: defaults.advancePayment,
        // Anticipos detectados automáticamente en los movimientos financieros
        advanceBreakdown: defaults.advanceLines,
        advanceSource: defaults.advanceSource,
      },
    });
  } catch (error) {
    console.error('Royalties preview Error:', error);
    return NextResponse.json(
      { error: 'Error al calcular la previsualización' },
      { status: 500 }
    );
  }
}
