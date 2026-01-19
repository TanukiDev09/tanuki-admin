import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Warehouse from '@/models/Warehouse';
import PointOfSale from '@/models/PointOfSale';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';

export async function GET(request: NextRequest) {
  const permissionError = await requirePermission(
    request,
    ModuleName.WAREHOUSES,
    PermissionAction.READ
  );
  if (permissionError) return permissionError;

  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const buildQuery = (searchParams: URLSearchParams) => {
      const query: Record<string, unknown> = {};

      const status = searchParams.get('status');
      const type = searchParams.get('type');
      const pointOfSaleId = searchParams.get('pointOfSaleId');
      const search = searchParams.get('search');

      if (status) query.status = status;
      if (type) query.type = type;

      if (pointOfSaleId) {
        query.pointOfSaleId =
          pointOfSaleId === 'null' || pointOfSaleId === 'none'
            ? null
            : pointOfSaleId;
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } },
        ];
      }

      return query;
    };

    const query = buildQuery(searchParams);

    const warehouses = await Warehouse.find(query)
      .populate('pointOfSaleId', 'name code')
      .sort({ createdAt: -1 });

    const response = NextResponse.json(warehouses);

    // Evitar cacheo para asegurar datos frescos
    response.headers.set(
      'Cache-Control',
      'private, no-cache, no-store, must-revalidate'
    );

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Error fetching warehouses' },
      { status: 500 }
    );
  }
}

const generateWarehouseCode = async () => {
  const lastWarehouse = await Warehouse.findOne({
    code: { $regex: /^BOD-\d+$/ },
  }).sort({ code: -1 });

  let nextNumber = 1;
  if (lastWarehouse && lastWarehouse.code) {
    const parts = lastWarehouse.code.split('-');
    if (parts.length === 2) {
      const number = parseInt(parts[1], 10);
      if (!isNaN(number)) {
        nextNumber = number + 1;
      }
    }
  }
  return `BOD-${String(nextNumber).padStart(3, '0')}`;
};

export async function POST(request: NextRequest) {
  const permissionError = await requirePermission(
    request,
    ModuleName.WAREHOUSES,
    PermissionAction.CREATE
  );
  if (permissionError) return permissionError;

  try {
    await dbConnect();
    const body = await request.json();

    // Validate pointOfSaleId if provided
    if (body.pointOfSaleId) {
      const posExists = await PointOfSale.findById(body.pointOfSaleId);
      if (!posExists) {
        return NextResponse.json(
          { error: 'El punto de venta no existe' },
          { status: 400 }
        );
      }
    }

    // Auto-generate code if not provided
    if (!body.code) {
      body.code = await generateWarehouseCode();
    }

    const warehouse = await Warehouse.create(body);

    // If associated with a POS, update the POS to reference this warehouse
    if (body.pointOfSaleId) {
      await PointOfSale.findByIdAndUpdate(body.pointOfSaleId, {
        warehouseId: warehouse._id,
      });
    }

    return NextResponse.json(warehouse, { status: 201 });
  } catch (err) {
    const error = err as { code?: number; message?: string };
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'El código de la bodega ya existe' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Error creating warehouse' },
      { status: 400 }
    );
  }
}
