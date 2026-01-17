import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Book from '@/models/Book';
import '@/models/Creator'; // Import to register schema
import { sanitizeBook } from '@/types/book';
import mongoose from 'mongoose';

// GET /api/books/[id] - Obtener libro por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      // Lookup inventory items with warehouse details
      {
        $lookup: {
          from: 'inventoryitems',
          localField: '_id',
          foreignField: 'bookId',
          as: 'inventoryItems',
        },
      },
      // Lookup warehouse details for each inventory item
      {
        $lookup: {
          from: 'warehouses',
          localField: 'inventoryItems.warehouseId',
          foreignField: '_id',
          as: 'warehouses',
        },
      },
      // Calculate total stock and format inventory details
      {
        $addFields: {
          totalStock: { $sum: '$inventoryItems.quantity' },
          inventoryDetails: {
            $map: {
              input: '$inventoryItems',
              as: 'item',
              in: {
                $let: {
                  vars: {
                    warehouse: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$warehouses',
                            cond: { $eq: ['$$this._id', '$$item.warehouseId'] },
                          },
                        },
                        0,
                      ],
                    },
                  },
                  in: {
                    warehouseId: '$$item.warehouseId',
                    warehouseName: '$$warehouse.name',
                    warehouseCode: '$$warehouse.code',
                    warehouseType: '$$warehouse.type',
                    quantity: '$$item.quantity',
                    minStock: '$$item.minStock',
                    maxStock: '$$item.maxStock',
                  },
                },
              },
            },
          },
        },
      },
      // Remove temporary fields
      {
        $project: {
          inventoryItems: 0,
          warehouses: 0,
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

    return NextResponse.json({
      success: true,
      data: book,
    });
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
