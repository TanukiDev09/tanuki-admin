import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import dbConnect from '@/lib/mongodb';
import RoyaltyStatement from '@/models/RoyaltyStatement';
import '@/models/Creator';
import { UpdateRoyaltyStatementDTO } from '@/types/royalty-statement';

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, props: Props) {
  const permissionError = await requirePermission(
    request,
    ModuleName.ROYALTY_STATEMENTS,
    PermissionAction.READ
  );
  if (permissionError) return permissionError;

  const { id } = await props.params;
  try {
    await dbConnect();
    const statement = await RoyaltyStatement.findById(id).populate(
      'creator',
      'name'
    );

    if (!statement) {
      return NextResponse.json(
        { message: 'Liquidación no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(statement);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Error al obtener liquidación';
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, props: Props) {
  const permissionError = await requirePermission(
    request,
    ModuleName.ROYALTY_STATEMENTS,
    PermissionAction.UPDATE
  );
  if (permissionError) return permissionError;

  const { id } = await props.params;
  try {
    await dbConnect();
    const body: UpdateRoyaltyStatementDTO = await request.json();

    const statement = await RoyaltyStatement.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    ).populate('creator', 'name');

    if (!statement) {
      return NextResponse.json(
        { message: 'Liquidación no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(statement);
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Error al actualizar liquidación';
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, props: Props) {
  const permissionError = await requirePermission(
    request,
    ModuleName.ROYALTY_STATEMENTS,
    PermissionAction.DELETE
  );
  if (permissionError) return permissionError;

  const { id } = await props.params;
  try {
    await dbConnect();
    const statement = await RoyaltyStatement.findByIdAndDelete(id);

    if (!statement) {
      return NextResponse.json(
        { message: 'Liquidación no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Liquidación eliminada correctamente' });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Error al eliminar liquidación';
    return NextResponse.json({ message }, { status: 500 });
  }
}
