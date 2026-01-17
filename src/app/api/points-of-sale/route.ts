import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import PointOfSale from '@/models/PointOfSale';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const query: Record<string, unknown> = {};
    if (status) {
      query.status = status;
    }

    const pointsOfSale = await PointOfSale.find(query).sort({ createdAt: -1 });

    return NextResponse.json(pointsOfSale);
  } catch {
    return NextResponse.json(
      { error: 'Error fetching points of sale' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();

    // Import Warehouse model dynamically to avoid circular dependency issues
    const Warehouse = (await import('@/models/Warehouse')).default;

    // Generate code if not provided
    if (!body.code) {
      const lastPOS = await PointOfSale.findOne({
        code: { $regex: /^POS-\d+$/ },
      }).sort({ code: -1 });

      let nextNum = 1;
      if (lastPOS && lastPOS.code) {
        const match = lastPOS.code.match(/^POS-(\d+)$/);
        if (match) {
          nextNum = parseInt(match[1], 10) + 1;
        }
      }
      body.code = `POS-${nextNum.toString().padStart(3, '0')}`;
    }

    // Create point of sale
    const pointOfSale = await PointOfSale.create(body);

    // Create associated warehouse automatically
    try {
      const warehouse = await Warehouse.create({
        code: `BOD-${pointOfSale.code}`,
        name: `Bodega ${pointOfSale.name}`,
        type: 'pos',
        pointOfSaleId: pointOfSale._id,
        address: pointOfSale.address,
        city: pointOfSale.city,
        status: 'active',
      });

      // Update the POS with the warehouse reference
      pointOfSale.warehouseId = warehouse._id;
      await pointOfSale.save();
    } catch (warehouseErr) {
      const warehouseError =
        warehouseErr instanceof Error
          ? warehouseErr
          : new Error('Unknown error');
      console.error('Error creating warehouse for POS:', warehouseError);
    }

    return NextResponse.json(pointOfSale, { status: 201 });
  } catch (err) {
    const error = err as { code?: number; message?: string };
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'El código del punto de venta ya existe' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Error creating point of sale' },
      { status: 400 }
    );
  }
}
