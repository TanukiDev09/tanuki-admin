import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import dbConnect from '@/lib/mongodb';
import Debt from '@/models/Debt';
import '@/models/Creator';
import '@/models/PointOfSale';
import '@/models/ExternalEntity';
import { IDebt } from '@/types/debt';
import { toNumber, subtract } from '@/lib/math';
import * as mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const permissionError = await requirePermission(
    request,
    ModuleName.FINANCE,
    PermissionAction.READ
  );
  if (permissionError) return permissionError;

  await dbConnect();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const entityId = searchParams.get('entityId');
  const status = searchParams.getAll('status'); // Use getAll for multiple status
  const alwaysInclude = searchParams.get('alwaysInclude');
  const isGrouped = searchParams.get('grouped') === 'true';

  const query: Record<string, unknown> = {};
  if (type) query.type = type;
  if (entityId) query.entityId = new mongoose.Types.ObjectId(entityId);

  if (status.length > 0) {
    if (alwaysInclude) {
      query.$or = [
        { status: { $in: status } },
        { _id: new mongoose.Types.ObjectId(alwaysInclude) },
      ];
    } else {
      query.status = { $in: status };
    }
  } else if (alwaysInclude) {
    // If no status filter requested but we have alwaysInclude, we don't need to do anything special
    // unless there was some default status filter (which there isn't in this generic GET)
  }

  try {
    if (isGrouped) {
      const result = await Debt.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$entityId',
            entityName: { $first: '$entityName' },
            entityType: { $first: '$entityType' },
            totalDebt: {
              $sum: {
                $cond: [
                  { $eq: ['$type', 'Cuenta por Cobrar'] },
                  { $toDouble: '$remainingBalance' },
                  { $multiply: [{ $toDouble: '$remainingBalance' }, -1] },
                ],
              },
            },
            debtCount: { $sum: 1 },
            debts: { $push: '$$ROOT' },
          },
        },
        {
          $addFields: {
            absDebt: { $abs: '$totalDebt' },
          },
        },
        { $sort: { absDebt: -1 } },
      ]);

      interface GroupedDebtResult {
        _id: mongoose.Types.ObjectId;
        entityName: string;
        entityType: string;
        totalDebt: number;
        debtCount: number;
        debts: (IDebt & { _id: mongoose.Types.ObjectId })[];
      }

      // Post-process to fix ObjectId and Decimal128 issues in aggregate output
      const formatted = result.map((group: GroupedDebtResult) => ({
        ...group,
        _id: group._id.toString(),
        debts: group.debts.map((d) => ({
          ...d,
          _id: d._id.toString(),
          totalAmount: toNumber(d.totalAmount),
          paidAmount: toNumber(d.paidAmount),
          remainingBalance: toNumber(d.remainingBalance),
        })),
      }));

      return NextResponse.json({ data: formatted });
    }

    const debts = await Debt.find(query)
      .sort({ dueDate: 1 })
      .populate('entityId');
    const formatted = debts.map((d) => ({
      ...d.toObject(),
      _id: d._id.toString(),
      totalAmount: toNumber(d.totalAmount),
      paidAmount: toNumber(d.paidAmount),
      remainingBalance: toNumber(d.remainingBalance),
      entityId: d.entityId, // This will be populated object
    }));

    return NextResponse.json({ data: formatted });
  } catch (error) {
    console.error('Debts API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch debts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const permissionError = await requirePermission(
    request,
    ModuleName.FINANCE,
    PermissionAction.CREATE
  );
  if (permissionError) return permissionError;

  await dbConnect();
  try {
    const body = await request.json();

    // Required fields check
    if (!body.type || !body.entityType || !body.entityId || !body.totalAmount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Default remainingBalance to totalAmount if not provided
    const totalAmount = body.totalAmount;
    const paidAmount = body.paidAmount || 0;
    const remainingBalance = subtract(totalAmount, paidAmount);

    const debtData = {
      ...body,
      paidAmount,
      remainingBalance,
      status: body.status || 'Pendiente',
    };

    const debt = await Debt.create(debtData);
    return NextResponse.json({ data: debt }, { status: 201 });
  } catch (error) {
    console.error('Create Debt Error:', error);
    return NextResponse.json(
      { error: 'Failed to create debt' },
      { status: 500 }
    );
  }
}
