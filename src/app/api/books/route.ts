import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Book from '@/models/Book';
import '@/models/Creator'; // Import to register schema
import { sanitizeBook } from '@/types/book';

export const dynamic = 'force-dynamic';

// GET /api/books - Listar libros
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const genre = searchParams.get('genre');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');
    const creatorId = searchParams.get('creatorId');
    const includeInventory = searchParams.get('includeInventory') === 'true';

    // Construir filtros
    const filter: Record<string, unknown> = {};

    if (genre) {
      filter.genre = genre;
    }

    if (isActive !== null && isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    if (creatorId) {
      filter.$or = [
        { authors: creatorId },
        { illustrators: creatorId },
        { translators: creatorId },
      ];
    }

    if (search) {
      // Legacy search support - needs improvement for populated fields
      // For now, we keep title and isbn search
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { isbn: { $regex: search, $options: 'i' } },
      ];
    }

    // Calcular skip para paginación
    const skip = (page - 1) * limit;

    let books;

    if (includeInventory) {
      // Use aggregation to calculate totalStock from InventoryItem
      books = await Book.aggregate([
        { $match: filter },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        // Lookup authors, translators, illustrators
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
            as: 'inventory',
          },
        },
        // Calculate total stock
        {
          $addFields: {
            totalStock: { $sum: '$inventory.quantity' },
          },
        },
        // Remove inventory array from response (we only need totalStock)
        {
          $project: {
            inventory: 0,
          },
        },
      ]);
    } else {
      // Standard query without inventory
      books = await Book.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('authors illustrators translators')
        .lean();
    }

    // Contar total de documentos
    const total = await Book.countDocuments(filter);

    const response = NextResponse.json({
      success: true,
      data: books,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

    // Evitar cacheo para asegurar datos frescos
    response.headers.set(
      'Cache-Control',
      'private, no-cache, no-store, must-revalidate'
    );

    return response;
  } catch (error) {
    console.error('Error al obtener libros:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener libros' },
      { status: 500 }
    );
  }
}

// POST /api/books - Crear libro
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { isbn, title, publicationDate, genre, pages, price } = body;

    // Validar campos requeridos
    if (
      !isbn ||
      !title ||
      !publicationDate ||
      !genre ||
      !pages ||
      price === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Campos requeridos faltantes: isbn, title, publicationDate, genre, pages, price',
        },
        { status: 400 }
      );
    }

    // Verificar si el ISBN ya existe
    const existingBook = await Book.findOne({ isbn });
    if (existingBook) {
      return NextResponse.json(
        { success: false, error: 'El ISBN ya está registrado' },
        { status: 409 }
      );
    }

    // Crear el libro
    const book = await Book.create(body);
    const sanitizedBook = sanitizeBook(book);

    return NextResponse.json(
      {
        success: true,
        data: sanitizedBook,
        message: 'Libro creado exitosamente',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error al crear libro:', error);

    // Manejar errores de validación de Mongoose
    if ((error as { name?: string }).name === 'ValidationError') {
      return NextResponse.json(
        { success: false, error: 'Error de validación', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Error al crear libro' },
      { status: 500 }
    );
  }
}
