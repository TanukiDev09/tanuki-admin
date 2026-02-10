import dbConnect from './src/lib/mongodb';
import PointOfSale from './src/models/PointOfSale';
import Invoice from './src/models/Invoice';
import CostCenter from './src/models/CostCenter';

async function debug() {
  await dbConnect();

  const pos = await PointOfSale.findOne({ name: /Panamericana/i });
  if (!pos) {
    console.log('POS not found');
    process.exit(0);
  }

  console.log('Found POS:', {
    _id: pos._id,
    name: pos.name,
    code: pos.code,
  });

  const invoicesWithCC = await Invoice.find({ 'items.costCenter': pos.code })
    .limit(5)
    .lean();
  console.log(
    `Found ${invoicesWithCC.length} invoices with CC matching POS code "${pos.code}"`
  );

  if (invoicesWithCC.length === 0) {
    // Check if maybe it's using the ID instead
    const invoicesWithCCId = await Invoice.find({
      'items.costCenter': pos._id.toString(),
    })
      .limit(5)
      .lean();
    console.log(
      `Found ${invoicesWithCCId.length} invoices with CC matching POS ID string`
    );

    // Check all unique cost centers in Invoices to see what they look like
    const uniqueCCs = await Invoice.distinct('items.costCenter');
    console.log('Unique cost centers in invoices:', uniqueCCs);

    // Check cost centers in the system
    const allCCs = await CostCenter.find({}).lean();
    console.log(
      'Cost centers in system:',
      allCCs.map((cc) => ({ code: cc.code, name: cc.name }))
    );
  }

  process.exit(0);
}

debug();
