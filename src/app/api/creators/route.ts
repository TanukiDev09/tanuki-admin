import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Creator from '@/models/Creator';
import { CreateCreatorDTO } from '@/types/creator';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';

export async function GET(request: NextRequest) {
  const permissionError = await requirePermission(
    request,
    ModuleName.CREATORS,
    PermissionAction.READ
  );
  if (permissionError) return permissionError;

  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    const query: Record<string, unknown> = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const creators = await Creator.find(query).sort({ name: 1 }).limit(100);

    return NextResponse.json(creators);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Error al obtener creadores';
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const permissionError = await requirePermission(
    request,
    ModuleName.CREATORS,
    PermissionAction.CREATE
  );
  if (permissionError) return permissionError;

  try {
    await dbConnect();
    const body: CreateCreatorDTO = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { message: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    const creator = await Creator.create(body);

    return NextResponse.json(creator, { status: 201 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Error al crear creador';
    return NextResponse.json({ message }, { status: 500 });
  }
}
