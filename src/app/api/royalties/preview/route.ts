import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import dbConnect from '@/lib/mongodb';
import Creator from '@/models/Creator';
import '@/models/Book';
import '@/models/Agreement';
import { buildCreatorComputation } from '@/lib/royalties/calculate';
import { loadCreatorAgreements } from '@/lib/royalties/agreements';
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
    const creatorId = searchParams.get('creatorId');
    const periodStartRaw = searchParams.get('periodStart');
    const periodEndRaw = searchParams.get('periodEnd');

    if (!creatorId || !periodStartRaw || !periodEndRaw) {
      return NextResponse.json(
        { error: 'Creador y periodo (desde/hasta) son obligatorios' },
        { status: 400 }
      );
    }

    const periodStart = new Date(periodStartRaw);
    const periodEnd = new Date(periodEndRaw);

    const creator = await Creator.findById(creatorId).select(
      'name email identification'
    );
    if (!creator) {
      return NextResponse.json(
        { error: 'Creador no encontrado' },
        { status: 404 }
      );
    }

    const agreements = await loadCreatorAgreements(creatorId);

    const defaults = await resolveDefaults({ creatorId, periodStart });

    const computation = await buildCreatorComputation({
      agreements,
      periodStart,
      periodEnd,
      previousBalance: defaults.previousBalance,
      detectAdvances: defaults.detectAdvances,
    });

    const advanceSource = defaults.detectAdvances
      ? computation.advanceBreakdown.length > 0
        ? 'movements'
        : 'none'
      : 'carryover';

    return NextResponse.json({
      data: {
        ...computation,
        creatorName: creator.name,
        creatorEmail: creator.email,
        creatorIdentification: creator.identification,
        advanceSource,
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
