import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import dbConnect from '@/lib/mongodb';
import RoyaltyStatement from '@/models/RoyaltyStatement';
import '@/models/Creator';

export async function GET(request: NextRequest) {
  const permissionError = await requirePermission(
    request,
    ModuleName.ROYALTY_STATEMENTS,
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
      .populate('creator', 'name')
      .sort({ periodEnd: -1 });

    return NextResponse.json(statements);
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Error al obtener liquidaciones';
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const permissionError = await requirePermission(
    request,
    ModuleName.ROYALTY_STATEMENTS,
    PermissionAction.CREATE
  );
  if (permissionError) return permissionError;

  try {
    await dbConnect();
    const body = await request.json();

    if (!body.creator || !body.periodStart || !body.periodEnd) {
      return NextResponse.json(
        { message: 'Creador, fecha de inicio y fecha de fin son obligatorios' },
        { status: 400 }
      );
    }

    const statement = await RoyaltyStatement.create(body);
    await statement.populate('creator', 'name');

    return NextResponse.json(statement, { status: 201 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Error al crear liquidación';
    return NextResponse.json({ message }, { status: 500 });
  }
}
