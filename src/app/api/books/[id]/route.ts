import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Book from '@/models/Book';
import '@/models/Creator'; // Import to register schema
import { sanitizeBook } from '@/types/book';
import mongoose from 'mongoose';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';

// GET /api/books/[id] - Obtener libro por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verificar permiso de lectura
  const permissionError = await requirePermission(
    request,
    ModuleName.BOOKS,
    PermissionAction.READ
  );
  if (permissionError) return permissionError;

  try {
    await dbConnect();

    const { id } = await params;

    // Validar que el ID sea válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'ID de libro inválido' },
        { status: 400 }
      );
    }

    // Use aggregation to get book with inventory details
    const bookResult = await Book.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      // Lookup creators
      {
        $lookup: {
          from: 'creators',
          localField: 'authors',
          foreignField: '_id',
          as: 'authors',
        },
      },
      {
        $lookup: {
          from: 'creators',
          localField: 'translators',
          foreignField: '_id',
          as: 'translators',
        },
      },
      {
        $lookup: {
          from: 'creators',
          localField: 'illustrators',
          foreignField: '_id',
          as: 'illustrators',
        },
      },
      // Lookup inventory items
      {
        $lookup: {
          from: 'inventoryitems',
          localField: '_id',
          foreignField: 'bookId',
          as: 'inventoryItems',
        },
      },
      // Lookup ALL active warehouses
      {
        $lookup: {
          from: 'warehouses',
          pipeline: [
            { $match: { status: 'active' } },
            { $sort: { type: 1, name: 1 } },
          ],
          as: 'allWarehouses',
        },
      },
      // Calculate inventory details ensuring ALL warehouses are listed
      {
        $addFields: {
          inventoryDetails: {
            $map: {
              input: '$allWarehouses',
              as: 'warehouse',
              in: {
                $let: {
                  vars: {
                    matchedItem: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$inventoryItems',
                            as: 'item',
                            cond: {
                              $eq: ['$$item.warehouseId', '$$warehouse._id'],
                            },
                          },
                        },
                        0,
                      ],
                    },
                  },
                  in: {
                    warehouseId: '$$warehouse._id',
                    warehouseName: '$$warehouse.name',
                    warehouseCode: '$$warehouse.code',
                    warehouseType: '$$warehouse.type',
                    quantity: { $ifNull: ['$$matchedItem.quantity', 0] },
                    minStock: { $ifNull: ['$$matchedItem.minStock', 0] },
                    maxStock: { $ifNull: ['$$matchedItem.maxStock', 0] },
                    inventoryItemId: { $ifNull: ['$$matchedItem._id', null] },
                  },
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          totalStock: { $sum: '$inventoryDetails.quantity' },
        },
      },
      {
        $project: {
          inventoryItems: 0,
          allWarehouses: 0,
        },
      },
    ]);

    if (!bookResult || bookResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Libro no encontrado' },
        { status: 404 }
      );
    }

    const book = bookResult[0];

    const response = NextResponse.json({
      success: true,
      data: book,
    });
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate'
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  } catch (error) {
    console.error('Error al obtener libro:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener libro' },
      { status: 500 }
    );
  }
}

// PUT /api/books/[id] - Actualizar libro
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verificar permiso de actualización
  const permissionError = await requirePermission(
    request,
    ModuleName.BOOKS,
    PermissionAction.UPDATE
  );
  if (permissionError) return permissionError;

  try {
    await dbConnect();

    const { id } = await params;

    // Validar que el ID sea válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'ID de libro inválido' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Si se está actualizando el ISBN, verificar que no exista en otro libro
    if (body.isbn) {
      const existingBook = await Book.findOne({
        isbn: body.isbn,
        _id: { $ne: id },
      });

      if (existingBook) {
        return NextResponse.json(
          { success: false, error: 'El ISBN ya está registrado en otro libro' },
          { status: 409 }
        );
      }
    }

    // Actualizar el libro
    const book = await Book.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!book) {
      return NextResponse.json(
        { success: false, error: 'Libro no encontrado' },
        { status: 404 }
      );
    }

    const sanitizedBook = sanitizeBook(book);

    return NextResponse.json({
      success: true,
      data: sanitizedBook,
      message: 'Libro actualizado exitosamente',
    });
  } catch (error) {
    console.error('Error al actualizar libro:', error);

    // Manejar errores de validación de Mongoose
    if ((error as { name?: string }).name === 'ValidationError') {
      return NextResponse.json(
        { success: false, error: 'Error de validación', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Error al actualizar libro' },
      { status: 500 }
    );
  }
}

// DELETE /api/books/[id] - Desactivar libro (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verificar permiso de eliminación
  const permissionError = await requirePermission(
    request,
    ModuleName.BOOKS,
    PermissionAction.DELETE
  );
  if (permissionError) return permissionError;

  try {
    await dbConnect();

    const { id } = await params;

    // Validar que el ID sea válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'ID de libro inválido' },
        { status: 400 }
      );
    }

    // Soft delete: marcar como inactivo en lugar de eliminar
    const book = await Book.findByIdAndUpdate(
      id,
      { $set: { isActive: false } },
      { new: true }
    );

    if (!book) {
      return NextResponse.json(
        { success: false, error: 'Libro no encontrado' },
        { status: 404 }
      );
    }

    const sanitizedBook = sanitizeBook(book);

    return NextResponse.json({
      success: true,
      data: sanitizedBook,
      message: 'Libro desactivado exitosamente',
    });
  } catch (error) {
    console.error('Error al desactivar libro:', error);
    return NextResponse.json(
      { success: false, error: 'Error al desactivar libro' },
      { status: 500 }
    );
  }
}
