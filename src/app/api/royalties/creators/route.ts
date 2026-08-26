import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import dbConnect from '@/lib/mongodb';
import Agreement from '@/models/Agreement';
import Creator from '@/models/Creator';
import { ROYALTY_ELIGIBLE_AGREEMENT_FILTER } from '@/lib/royalties/agreements';

export const dynamic = 'force-dynamic';

/**
 * Creadores elegibles para liquidación de regalías: aquellos con al menos un
 * contrato que liquide regalías (royaltyPercentage > 0). Se excluyen quienes
 * solo tienen contratos a tanto alzado o de dominio público (autor).
 */
export async function GET(request: NextRequest) {
  const permissionError = await requirePermission(
    request,
    ModuleName.ROYALTIES,
    PermissionAction.READ
  );
  if (permissionError) return permissionError;

  try {
    await dbConnect();

    const creatorIds = await Agreement.find(
      ROYALTY_ELIGIBLE_AGREEMENT_FILTER
    ).distinct('creator');

    const creators = await Creator.find({ _id: { $in: creatorIds } })
      .select('name')
      .sort({ name: 1 });

    return NextResponse.json(creators);
  } catch (error) {
    console.error('Royalties creators Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener creadores' },
      { status: 500 }
    );
  }
}
