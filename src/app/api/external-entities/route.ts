import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import dbConnect from '@/lib/mongodb';
import ExternalEntity from '@/models/ExternalEntity';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const permissionError = await requirePermission(
    request,
    ModuleName.FINANCE,
    PermissionAction.READ
  );
  if (permissionError) return permissionError;

  await dbConnect();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const search = searchParams.get('search');
  const all = searchParams.get('all') === 'true'; // If true, include inactive

  const query: Record<string, any> = {};
  if (!all) query.status = 'active';
  if (type) query.type = type;
  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }

  try {
    const entities = await ExternalEntity.find(query).sort({ name: 1 });
    return NextResponse.json({ data: entities });
  } catch (error) {
    console.error('External Entities API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch entities' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const permissionError = await requirePermission(
    request,
    ModuleName.FINANCE,
    PermissionAction.CREATE
  );
  if (permissionError) return permissionError;

  await dbConnect();
  try {
    const body = await request.json();

    if (!body.name || !body.type) {
      return NextResponse.json(
        { error: 'Name and Type are required' },
        { status: 400 }
      );
    }

    const entity = await ExternalEntity.create(body);
    return NextResponse.json({ data: entity }, { status: 201 });
  } catch (error) {
    console.error('Create External Entity Error:', error);
    return NextResponse.json(
      { error: 'Failed to create entity' },
      { status: 500 }
    );
  }
}
