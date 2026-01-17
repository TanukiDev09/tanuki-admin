import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Agreement from '@/models/Agreement';
import Book from '@/models/Book';
import '@/models/Creator'; // Import to register schema
import { UpdateAgreementDTO } from '@/types/agreement';

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: Request, props: Props) {
  const params = await props.params;
  try {
    await dbConnect();
    const agreement = await Agreement.findById(params.id)
      .populate('book', 'title isbn')
      .populate('creator', 'name');

    if (!agreement) {
      return NextResponse.json(
        { message: 'Contrato no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(agreement);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Error al obtener contrato' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, props: Props) {
  const params = await props.params;
  try {
    await dbConnect();
    const body: UpdateAgreementDTO = await request.json();

    // Get original agreement to check for role changes
    const originalAgreement = await Agreement.findById(params.id);
    if (!originalAgreement) {
      return NextResponse.json(
        { message: 'Contrato no encontrado' },
        { status: 404 }
      );
    }

    const agreement = await Agreement.findByIdAndUpdate(
      params.id,
      { $set: body },
      { new: true, runValidators: true }
    )
      .populate('book', 'title isbn')
      .populate('creator', 'name');

    // Sync with Book if role changed
    if (body.role && body.role !== originalAgreement.role) {
      const roleFieldMap: Record<string, string> = {
        author: 'authors',
        translator: 'translators',
        illustrator: 'illustrators',
      };

      const oldField = roleFieldMap[originalAgreement.role];
      const newField = roleFieldMap[body.role];

      if (oldField) {
        await Book.findByIdAndUpdate(agreement.book._id, {
          $pull: { [oldField]: agreement.creator._id },
        });
      }
      if (newField) {
        await Book.findByIdAndUpdate(agreement.book._id, {
          $addToSet: { [newField]: agreement.creator._id },
        });
      }
    }

    return NextResponse.json(agreement);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Error al actualizar contrato' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, props: Props) {
  const params = await props.params;
  try {
    await dbConnect();
    const agreement = await Agreement.findByIdAndDelete(params.id);

    if (!agreement) {
      return NextResponse.json(
        { message: 'Contrato no encontrado' },
        { status: 404 }
      );
    }

    // Sync with Book: Remove creator from the corresponding array
    const roleFieldMap: Record<string, string> = {
      author: 'authors',
      translator: 'translators',
      illustrator: 'illustrators',
    };

    const fieldToUpdate = roleFieldMap[agreement.role];
    if (fieldToUpdate) {
      await Book.findByIdAndUpdate(agreement.book, {
        $pull: { [fieldToUpdate]: agreement.creator },
      });
    }

    return NextResponse.json({ message: 'Contrato eliminado correctamente' });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Error al eliminar contrato' },
      { status: 500 }
    );
  }
}
