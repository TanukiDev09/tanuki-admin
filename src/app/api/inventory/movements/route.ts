import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import InventoryMovement, {
  InventoryMovementType,
  InventoryMovementSubType,
} from '@/models/InventoryMovement';
import InventoryItem from '@/models/InventoryItem';
import Warehouse from '@/models/Warehouse';
import Movement from '@/models/Movement';

// Helper: Validation
function validateRequestBody(body: any) {
  const { type, items } = body;
  if (!type || !items || !items.length) {
    return 'Faltan campos requeridos: type, items';
  }
  return null;
}

// Helper: Get Warehouses
async function getWarehouses(fromId?: string, toId?: string) {
  let sourceWarehouse = null;
  let destWarehouse = null;

  if (fromId) {
    sourceWarehouse = await Warehouse.findById(fromId);
    if (!sourceWarehouse) throw new Error('Bodega de origen no encontrada');
  }
  if (toId) {
    destWarehouse = await Warehouse.findById(toId);
    if (!destWarehouse) throw new Error('Bodega de destino no encontrada');
  }
  return { sourceWarehouse, destWarehouse };
}

// Helper: Business Rules
function validateRules(type: string, source: any, dest: any) {
  switch (type) {
    case InventoryMovementType.INGRESO:
      if (!dest) return 'Bodega de destino requerida para Ingreso';
      if (dest.type === 'pos')
        return 'Ingresos solo permitidos en Editorial/Distribuidor';
      break;
    case InventoryMovementType.REMISION:
      if (!source || !dest) return 'Origen y Destino requeridos para Remisión';
      if (source.type === 'pos')
        return 'Remisión debe salir de Editorial/Distribuidor';
      if (dest.type !== 'pos') return 'Remisión debe ir a un Punto de Venta';
      break;
    case InventoryMovementType.DEVOLUCION:
      if (!source || !dest)
        return 'Origen y Destino requeridos para Devolución';
      if (source.type !== 'pos')
        return 'Devolución debe salir de un Punto de Venta';
      if (dest.type === 'pos')
        return 'Devolución debe ir a Editorial/Distribuidor';
      break;
    case InventoryMovementType.LIQUIDACION:
      if (!source) return 'Bodega de origen requerida para Liquidación';
      break;
    default:
      return 'Tipo de movimiento inválido';
  }
  return null;
}

// Helper: Check Stock
async function checkStock(fromId: string, items: any[]) {
  for (const item of items) {
    const sourceItem = await InventoryItem.findOne({
      warehouseId: fromId,
      bookId: item.bookId,
    });
    if (!sourceItem || sourceItem.quantity < item.quantity) {
      return `Stock insuficiente para el libro ID: ${item.bookId}`;
    }
  }
  return null;
}

// Helper: Create Financial Movement
async function createFinancialMovement(data: any, date: Date) {
  try {
    const newMovement = await Movement.create({
      ...data,
      type: 'Egreso',
      date: date,
    });
    return newMovement._id;
  } catch (err) {
    const error = err as Error;
    throw new Error('Error creando movimiento financiero: ' + error.message);
  }
}

// Helper: Update Inventory
async function updateInventory(
  fromId: string | undefined,
  toId: string | undefined,
  items: any[]
) {
  for (const item of items) {
    if (fromId) {
      await InventoryItem.updateOne(
        { warehouseId: fromId, bookId: item.bookId },
        { $inc: { quantity: -item.quantity } }
      );
    }
    if (toId) {
      const exists = await InventoryItem.findOne({
        warehouseId: toId,
        bookId: item.bookId,
      });
      if (exists) {
        await InventoryItem.updateOne(
          { warehouseId: toId, bookId: item.bookId },
          { $inc: { quantity: item.quantity } }
        );
      } else {
        await InventoryItem.create({
          warehouseId: toId,
          bookId: item.bookId,
          quantity: item.quantity,
        });
      }
    }
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const {
      type,
      subType,
      fromWarehouseId,
      toWarehouseId,
      items,
      date,
      invoiceRef,
      invoiceFile,
      financialMovementData,
      financialMovementId,
      observations,
      createdBy,
    } = body;

    // 1. Basic Validation
    const basicError = validateRequestBody(body);
    if (basicError)
      return NextResponse.json(
        { success: false, error: basicError },
        { status: 400 }
      );

    // 2. Validate Warehouses
    let warehouses;
    try {
      warehouses = await getWarehouses(fromWarehouseId, toWarehouseId);
    } catch (e) {
      const err = e as Error;
      return NextResponse.json(
        { success: false, error: err.message },
        { status: 404 }
      );
    }
    const { sourceWarehouse, destWarehouse } = warehouses;

    // 3. Business Rules
    const ruleError = validateRules(type, sourceWarehouse, destWarehouse);
    if (ruleError)
      return NextResponse.json(
        { success: false, error: ruleError },
        { status: 400 }
      );

    // 4. Check Stock
    if (fromWarehouseId) {
      const stockError = await checkStock(fromWarehouseId, items);
      if (stockError)
        return NextResponse.json(
          { success: false, error: stockError },
          { status: 400 }
        );
    }

    // 5. Financial Movement
    let finalFinancialMovementId = financialMovementId;
    if (
      type === InventoryMovementType.INGRESO &&
      subType === InventoryMovementSubType.PURCHASE &&
      financialMovementData
    ) {
      try {
        finalFinancialMovementId = await createFinancialMovement(
          financialMovementData,
          new Date(date || Date.now())
        );
      } catch (e) {
        const err = e as Error;
        return NextResponse.json(
          { success: false, error: err.message },
          { status: 500 }
        );
      }
    }

    // 6. Update Inventory
    await updateInventory(fromWarehouseId, toWarehouseId, items);

    // 7. Create Record
    const inventoryMovement = await InventoryMovement.create({
      type,
      subType,
      date: date || new Date(),
      fromWarehouseId,
      toWarehouseId,
      items,
      financialMovementId: finalFinancialMovementId,
      invoiceRef,
      invoiceFile,
      observations,
      createdBy,
    });

    return NextResponse.json({ success: true, data: inventoryMovement });
  } catch (err) {
    const error = err as Error;
    console.error('Error processing inventory movement:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type');
    const warehouseId = searchParams.get('warehouseId');

    const query: any = {};
    if (type && type !== 'ALL') {
      query.type = type;
    }
    if (warehouseId) {
      query.$or = [
        { fromWarehouseId: warehouseId },
        { toWarehouseId: warehouseId },
      ];
    }

    const movements = await InventoryMovement.find(query)
      .sort({ date: -1 })
      .limit(limit)
      .populate('fromWarehouseId', 'name type')
      .populate('toWarehouseId', 'name type')
      .populate('items.bookId', 'title isbn')
      .populate('createdBy', 'name');

    return NextResponse.json({ success: true, data: movements });
  } catch (error) {
    console.error('Error fetching inventory movements:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener movimientos' },
      { status: 500 }
    );
  }
}
