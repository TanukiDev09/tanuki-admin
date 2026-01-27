import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import dbConnect from '@/lib/mongodb';
import InventoryMovement, {
  InventoryMovementType,
  InventoryMovementSubType,
} from '@/models/InventoryMovement';
import InventoryItem from '@/models/InventoryItem';
import Warehouse from '@/models/Warehouse';
import Movement from '@/models/Movement';
import Book from '@/models/Book';

interface BodyWithItems {
  type: string;
  items: unknown[];
  [key: string]: unknown;
}

// Helper: Validation
function validateRequestBody(body: BodyWithItems) {
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

interface WarehouseDoc {
  type: string;
  _id: unknown;
}

function validateEntry(dest: WarehouseDoc | null) {
  if (!dest) return 'Bodega de destino requerida para Ingreso';
  if (dest.type === 'pos')
    return 'Ingresos solo permitidos en Editorial/Distribuidor';
  return null;
}

function validateRemission(
  source: WarehouseDoc | null,
  dest: WarehouseDoc | null
) {
  if (!source || !dest) return 'Origen y Destino requeridos para Remisión';
  if (source.type === 'pos')
    return 'Remisión debe salir de Editorial/Distribuidor';
  if (dest.type !== 'pos') return 'Remisión debe ir a un Punto de Venta';
  return null;
}

function validateReturn(
  source: WarehouseDoc | null,
  dest: WarehouseDoc | null
) {
  if (!source || !dest) return 'Origen y Destino requeridos para Devolución';
  if (source.type !== 'pos')
    return 'Devolución debe salir de un Punto de Venta';
  if (dest.type === 'pos') return 'Devolución debe ir a Editorial/Distribuidor';
  return null;
}

// Helper: Business Rules
function validateRules(type: string, source: WarehouseDoc, dest: WarehouseDoc) {
  switch (type) {
    case InventoryMovementType.INGRESO:
      return validateEntry(dest);
    case InventoryMovementType.REMISION:
      return validateRemission(source, dest);
    case InventoryMovementType.DEVOLUCION:
      return validateReturn(source, dest);
    case InventoryMovementType.LIQUIDACION:
      if (!source) return 'Bodega de origen requerida para Liquidación';
      break;
    default:
      return 'Tipo de movimiento inválido';
  }
  return null;
}

// Helper: Get constituent books for a book (handling bundles)
async function getConstituentBooks(bookId: string, quantity: number) {
  const book = await Book.findById(bookId);
  if (!book) throw new Error(`Libro no encontrado ID: ${bookId}`);

  const constituents: Array<{ id: string; qty: number; title: string }> = [];
  if (book.isBundle && book.bundleBooks && book.bundleBooks.length > 0) {
    for (const volumeId of book.bundleBooks) {
      constituents.push({
        id: volumeId.toString(),
        qty: quantity,
        title: `Tomo de ${book.title}`,
      });
    }
  } else {
    constituents.push({ id: bookId, qty: quantity, title: book.title });
  }
  return constituents;
}

// Helper: Check Stock
async function checkStock(
  fromId: string,
  items: Array<{ bookId: string; quantity: number }>
) {
  for (const item of items) {
    try {
      const constituents = await getConstituentBooks(
        item.bookId,
        item.quantity
      );
      for (const part of constituents) {
        const sourceItem = await InventoryItem.findOne({
          warehouseId: fromId,
          bookId: part.id,
        });
        if (!sourceItem || sourceItem.quantity < part.qty) {
          return `Stock insuficiente para el libro: ${part.title}`;
        }
      }
    } catch (e: unknown) {
      const error = e as Error;
      return error.message;
    }
  }
  return null;
}

// Helper: Create Financial Movement
async function createFinancialMovement(
  data: Record<string, unknown>,
  date: Date
) {
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
  items: Array<{ bookId: string; quantity: number }>
) {
  for (const item of items) {
    try {
      const constituents = await getConstituentBooks(
        item.bookId,
        item.quantity
      );

      for (const part of constituents) {
        if (fromId) {
          await InventoryItem.updateOne(
            { warehouseId: fromId, bookId: part.id },
            { $inc: { quantity: -part.qty } }
          );
        }
        if (toId) {
          await InventoryItem.updateOne(
            { warehouseId: toId, bookId: part.id },
            { $inc: { quantity: part.qty } },
            { upsert: true }
          );
        }
      }
    } catch (e) {
      console.error('Error updating inventory for item:', e);
    }
  }
}

async function linkFinancialMovement(
  financialMovementId: string,
  inventoryMovementId: string
) {
  try {
    await Movement.findByIdAndUpdate(financialMovementId, {
      inventoryMovementId: inventoryMovementId,
    });
  } catch (linkErr) {
    console.error('Error linking to financial movement:', linkErr);
  }
}

async function processFinancialMovement(
  type: string,
  subType: string,
  financialMovementData: Record<string, unknown> | undefined,
  date: string | Date | undefined,
  existingId?: string
): Promise<string | undefined> {
  if (
    type === InventoryMovementType.INGRESO &&
    subType === InventoryMovementSubType.PURCHASE &&
    financialMovementData
  ) {
    return await createFinancialMovement(
      financialMovementData,
      new Date(date || Date.now())
    );
  }
  return existingId;
}

export async function POST(request: NextRequest) {
  const permissionError = await requirePermission(
    request,
    ModuleName.INVENTORY,
    PermissionAction.CREATE
  );
  if (permissionError) return permissionError;

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
    let finalFinancialMovementId;
    try {
      finalFinancialMovementId = await processFinancialMovement(
        type,
        subType,
        financialMovementData,
        date,
        financialMovementId
      );
    } catch (e) {
      const err = e as Error;
      return NextResponse.json(
        { success: false, error: err.message },
        { status: 500 }
      );
    }

    // 6. Update Inventory
    await updateInventory(fromWarehouseId, toWarehouseId, items);

    // 6.5 Calculate Consecutive for REMISION
    let consecutive: number | undefined;
    if (type === InventoryMovementType.REMISION) {
      const lastRemission = await InventoryMovement.findOne({
        type: InventoryMovementType.REMISION,
      })
        .sort({ consecutive: -1 })
        .limit(1);
      consecutive = (lastRemission?.consecutive || 0) + 1;
    }

    // 7. Create Record
    const inventoryMovement = await InventoryMovement.create({
      type,
      subType,
      consecutive,
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

    // 8. Update Financial Movement link if provided (Bilateral)
    if (finalFinancialMovementId) {
      await linkFinancialMovement(
        finalFinancialMovementId as string,
        inventoryMovement._id
      );
    }

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

export async function GET(request: NextRequest) {
  const permissionError = await requirePermission(
    request,
    ModuleName.INVENTORY,
    PermissionAction.READ
  );
  if (permissionError) return permissionError;

  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type');
    const warehouseId = searchParams.get('warehouseId');

    const query: Record<string, unknown> = {};
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
      .populate({
        path: 'fromWarehouseId',
        select: 'name type address city pointOfSaleId',
        populate: {
          path: 'pointOfSaleId',
          select:
            'name identificationType identificationNumber address city discountPercentage',
        },
      })
      .populate({
        path: 'toWarehouseId',
        select: 'name type address city pointOfSaleId',
        populate: {
          path: 'pointOfSaleId',
          select:
            'name identificationType identificationNumber address city discountPercentage',
        },
      })
      .populate('items.bookId', 'title isbn price')
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
