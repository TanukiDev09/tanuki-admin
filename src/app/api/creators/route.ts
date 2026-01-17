import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Creator from '@/models/Creator';
import { CreateCreatorDTO } from '@/types/creator';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    const query: any = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const creators = await Creator.find(query).sort({ name: 1 }).limit(100);

    return NextResponse.json(creators);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Error al obtener creadores' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Error al crear creador' },
      { status: 500 }
    );
  }
}
