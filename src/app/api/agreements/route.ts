import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Agreement from '@/models/Agreement';
import Book from '@/models/Book';
import '@/models/Creator'; // Import to register schema
import { CreateAgreementDTO } from '@/types/agreement';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get('bookId');
    const creatorId = searchParams.get('creatorId');

    const query: any = {};

    if (bookId) {
      query.book = bookId;
    }

    if (creatorId) {
      query.creator = creatorId;
    }

    const agreements = await Agreement.find(query)
      .populate('book', 'title isbn')
      .populate('creator', 'name')
      .sort({ createdAt: -1 });

    return NextResponse.json(agreements);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Error al obtener contratos' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body: CreateAgreementDTO = await request.json();

    // Basic validation
    if (!body.book || !body.creator || !body.role) {
      return NextResponse.json(
        { message: 'Libro, Creador y Rol son obligatorios' },
        { status: 400 }
      );
    }

    // Check for existing agreement for same pair?
    // User requirement: "each creator is associated to a book by an agreement".
    // Can a creator have multiple agreements for the same book (e.g. author AND translator)?
    // My model schema has unique compound index on book+creator, assuming 1 agreement per pair.
    // If we want multiple roles, we might need to relax that or store roles as array in Agreement.
    // The previous prompt said "una persona puede ser autor de uno, traductor en otro...".
    // But for the *same* book?
    // Let's stick to the schema I defined (book+creator unique). If they violate it, Mongo will throw.

    const agreement = await Agreement.create(body);

    // Sync with Book: Add creator to the corresponding array
    const roleFieldMap: Record<string, string> = {
      author: 'authors',
      translator: 'translators',
      illustrator: 'illustrators',
    };

    const fieldToUpdate = roleFieldMap[body.role];
    if (fieldToUpdate) {
      await Book.findByIdAndUpdate(body.book, {
        $addToSet: { [fieldToUpdate]: body.creator },
      });
    }

    // Populate for immediate return
    await agreement.populate(['book', 'creator']);

    return NextResponse.json(agreement, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { message: 'Ya existe un contrato para este creador en este libro' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { message: error.message || 'Error al crear contrato' },
      { status: 500 }
    );
  }
}
