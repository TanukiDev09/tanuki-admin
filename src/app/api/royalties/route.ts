import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import dbConnect from '@/lib/mongodb';
import RoyaltyStatement from '@/models/RoyaltyStatement';
import Creator from '@/models/Creator';
import '@/models/Book';
import '@/models/Agreement';
import { buildCreatorComputation } from '@/lib/royalties/calculate';
import { loadCreatorAgreements } from '@/lib/royalties/agreements';
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
    const status = searchParams.get('status');

    const query: Record<string, unknown> = {};
    if (creatorId) query.creator = creatorId;
    if (status) query.status = status;

    const statements = await RoyaltyStatement.find(query)
      .select('-books -advanceBreakdown') // El listado no necesita el detalle
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

    if (!body.creatorId || !body.periodStart || !body.periodEnd) {
      return NextResponse.json(
        { error: 'Creador y periodo (desde/hasta) son obligatorios' },
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

    const creator = await Creator.findById(body.creatorId).select(
      'name email identification'
    );
    if (!creator) {
      return NextResponse.json(
        { error: 'Creador no encontrado' },
        { status: 404 }
      );
    }

    const agreements = await loadCreatorAgreements(body.creatorId);

    const defaults = await resolveDefaults({
      creatorId: body.creatorId,
      periodStart,
    });

    const computation = await buildCreatorComputation({
      agreements,
      periodStart,
      periodEnd,
      previousBalance: defaults.previousBalance,
      detectAdvances: defaults.detectAdvances,
    });

    const statement = await RoyaltyStatement.create({
      creator: creator._id,
      creatorName: creator.name,
      creatorEmail: creator.email,
      creatorIdentification: creator.identification,
      periodStart,
      periodEnd,
      books: computation.books,
      previousBalance: computation.previousBalance,
      advancePayment: computation.advancePayment,
      advanceBreakdown: computation.advanceBreakdown,
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
