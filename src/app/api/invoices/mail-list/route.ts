import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Invoice from '@/models/Invoice';

export async function GET() {
  try {
    await dbConnect();

    // Aggregate to get unique emails from invoices where newsletterSignup is true,
    // and collect all book titles purchased.
    const mailList = await Invoice.aggregate([
      {
        $match: {
          newsletterSignup: true,
          customerEmail: { $exists: true, $ne: '' },
        },
      },
      // Use preserveNullAndEmptyArrays to not drop invoices without items (though theoretically shouldn't happen)
      { $unwind: { path: '$items', preserveNullAndEmptyArrays: true } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$customerEmail',
          customerName: { $first: '$customerName' },
          customerTaxId: { $first: '$customerTaxId' },
          lastSignupDate: { $first: '$createdAt' },
          // Only add to set if it's a book
          booksPurchased: {
            $addToSet: {
              $cond: [
                {
                  $and: [
                    { $expr: { $gt: ['$items', null] } },
                    { $eq: ['$items.type', 'libro'] },
                  ],
                },
                '$items.description',
                '$$REMOVE',
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          email: '$_id',
          customerName: 1,
          customerTaxId: 1,
          lastSignupDate: 1,
          // Ensure it's at least an empty array
          booksPurchased: { $ifNull: ['$booksPurchased', []] },
        },
      },
      { $sort: { customerName: 1 } },
    ]);

    return NextResponse.json(mailList);
  } catch (error) {
    console.error('Error fetching mail list:', error);
    return NextResponse.json(
      { error: 'Error al obtener la lista de correos' },
      { status: 500 }
    );
  }
}
