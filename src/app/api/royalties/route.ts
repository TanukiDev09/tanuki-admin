import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import dbConnect from '@/lib/mongodb';
import RoyaltyStatement from '@/models/RoyaltyStatement';
import Agreement from '@/models/Agreement';
import '@/models/Book';
import '@/models/Creator';
import { buildComputation } from '@/lib/royalties/calculate';
import { resolveDefaults, serializeStatement } from '@/lib/royalties/statement';
import { CreateRoyaltyStatementDTO } from '@/types/royalty';

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
    const creatorId = searchParams.get('creatorId');
    const bookId = searchParams.get('bookId');
    const agreementId = searchParams.get('agreementId');
    const status = searchParams.get('status');

    const query: Record<string, unknown> = {};
    if (creatorId) query.creator = creatorId;
    if (bookId) query.book = bookId;
    if (agreementId) query.agreement = agreementId;
    if (status) query.status = status;

    const statements = await RoyaltyStatement.find(query)
      .select('-lines') // El listado no necesita el detalle de facturas
      .populate('book', 'title isbn')
      .populate('creator', 'name')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      data: statements.map((s) => serializeStatement(s)),
    });
  } catch (error) {
    console.error('Royalties GET Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener liquidaciones' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const permissionError = await requirePermission(
    request,
    ModuleName.ROYALTIES,
    PermissionAction.CREATE
  );
  if (permissionError) return permissionError;

  try {
    await dbConnect();
    const body: CreateRoyaltyStatementDTO = await request.json();

    if (!body.agreementId || !body.periodStart || !body.periodEnd) {
      return NextResponse.json(
        { error: 'Contrato y periodo (desde/hasta) son obligatorios' },
        { status: 400 }
      );
    }

    const periodStart = new Date(body.periodStart);
    const periodEnd = new Date(body.periodEnd);
    if (periodStart > periodEnd) {
      return NextResponse.json(
        { error: 'La fecha "desde" no puede ser posterior a "hasta"' },
        { status: 400 }
      );
    }

    const agreement = await Agreement.findById(body.agreementId)
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
      _id: object;
      name: string;
      email?: string;
    };

    // Defaults: saldo anterior por arrastre y anticipo detectado automáticamente
    // en los movimientos financieros (pagos al creador por este libro/rol).
    const defaults = await resolveDefaults({
      agreementId: body.agreementId,
      role: agreement.role,
      bookCostCenter: book.costCenter,
      periodStart,
      periodEnd,
    });
    const previousBalance =
      body.previousBalance !== undefined
        ? body.previousBalance
        : defaults.previousBalance;
    const advancePayment =
      body.advancePayment !== undefined
        ? body.advancePayment
        : defaults.advancePayment;

    const computation = await buildComputation({
      bookId: book._id.toString(),
      periodStart,
      periodEnd,
      royaltyPercentage: agreement.royaltyPercentage,
      previousBalance,
      advancePayment,
    });

    const statement = await RoyaltyStatement.create({
      agreement: agreement._id,
      book: book._id,
      creator: creator._id,
      bookTitle: book.title,
      creatorName: creator.name,
      creatorEmail: creator.email,
      periodStart,
      periodEnd,
      royaltyPercentage: computation.royaltyPercentage,
      advancePayment: computation.advancePayment,
      // Guardamos el desglose solo si el anticipo viene de la detección automática
      // (no fue sobrescrito manualmente).
      advanceBreakdown:
        body.advancePayment === undefined ? defaults.advanceLines : [],
      previousBalance: computation.previousBalance,
      lines: computation.lines,
      totalCopies: computation.totalCopies,
      totalInvoiced: computation.totalInvoiced,
      totalRoyalties: computation.totalRoyalties,
      netSettlement: computation.netSettlement,
      carryoverToNext: computation.carryoverToNext,
      balanceInFavorOf: computation.balanceInFavorOf,
      status: 'draft',
      notes: body.notes,
      generatedAt: new Date(),
    });

    return NextResponse.json(
      { data: serializeStatement(statement) },
      { status: 201 }
    );
  } catch (error) {
    console.error('Royalties POST Error:', error);
    return NextResponse.json(
      { error: 'Error al generar la liquidación' },
      { status: 500 }
    );
  }
}
