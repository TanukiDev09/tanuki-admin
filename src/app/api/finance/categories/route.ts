import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Category from '@/models/Category';

export async function GET(request: Request) {
  await dbConnect();
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';
    const type = searchParams.get('type'); // 'Ingreso' | 'Egreso' | 'Ambos'

    const query: any = {};
    if (activeOnly) {
      query.isActive = true;
    }
    if (type) {
      // If filtering by type (e.g. for a dropdown), we want categories that keys match
      // If I ask for 'Ingreso', I want categories that are 'Ingreso' OR 'Ambos'
      // If I ask for 'Egreso', I want 'Egreso' OR 'Ambos'
      // If type is exact matching, just query.type = type.
      // But usually 'Ambos' implies it's available for both.
      if (type === 'Ingreso') {
        query.type = { $in: ['Ingreso', 'Ambos'] };
      } else if (type === 'Egreso') {
        query.type = { $in: ['Egreso', 'Ambos'] };
      } else {
        query.type = type;
      }
    }

    const categories = await Category.find(query).sort({ name: 1 }).lean();

    // Get IDs to aggregate movements
    const categoryIds = categories.map((cat) => cat._id);

    // Aggregate movements to get totals
    const Movement = (await import('@/models/Movement')).default;
    const totals = await Movement.aggregate([
      { $match: { category: { $in: categoryIds } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
    ]);

    // Create a map for easy lookup
    const totalsMap = new Map(
      totals.map((t) => [t._id.toString(), parseFloat(t.total.toString())])
    );

    // Merge totals into categories
    const categoriesWithTotals = categories.map((cat: any) => ({
      ...cat,
      totalAmount: totalsMap.get(cat._id.toString()) || 0,
    }));

    return NextResponse.json({ data: categoriesWithTotals });
  } catch (error) {
    console.error('Categories List Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  await dbConnect();
  try {
    const body = await request.json();

    const category = await Category.create(body);

    return NextResponse.json({ data: category }, { status: 201 });
  } catch (error: any) {
    console.error('Create Category Error:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Ya existe una categoría con ese nombre' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
