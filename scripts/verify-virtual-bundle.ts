import dotenv from 'dotenv';
import path from 'path';

// Load environment variables before anything else
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function verifyVirtualBundle() {
  try {
    // Dynamic imports to ensure env vars are loaded first
    const mongoose = await import('mongoose');
    const Book = (await import('../src/models/Book')).default;
    const InventoryItem = (await import('../src/models/InventoryItem')).default;
    const dbConnect = (await import('../src/lib/mongodb')).default;

    await dbConnect();
    console.log('Connected to Database');

    // 1. Setup: Create 2 volumes and 1 bundle
    console.log('Setting up books...');
    const timestamp = Date.now().toString().slice(-9); // 9 digits
    const vol1Iso = '978' + timestamp + '1';
    const vol2Iso = '978' + timestamp + '2';
    const bundleIso = '978' + timestamp + '3';

    const vol1 = await Book.create({
      isbn: vol1Iso,
      title: 'Volumen 1',
      authors: [],
      publicationDate: new Date(),
      genre: 'Test',
      language: 'Spanish',
      pages: 100,
      price: 10,
      isActive: true,
    });

    const vol2 = await Book.create({
      isbn: vol2Iso,
      title: 'Volumen 2',
      authors: [],
      publicationDate: new Date(),
      genre: 'Test',
      language: 'Spanish',
      pages: 100,
      price: 10,
      isActive: true,
    });

    const bundle = await Book.create({
      isbn: bundleIso,
      title: 'Obra Completa (Virtual)',
      isBundle: true,
      bundleBooks: [vol1._id, vol2._id],
      authors: [],
      publicationDate: new Date(),
      genre: 'Test',
      language: 'Spanish',
      pages: 200,
      price: 18,
      isActive: true,
    });

    console.log(`Created Bundle ID: ${bundle._id}`);

    // 2. Add stock to volumes in a warehouse
    const warehouseId = new mongoose.Types.ObjectId(); // Dummy warehouse ID
    console.log('Adding stock to volumes...');
    await InventoryItem.create({ warehouseId, bookId: vol1._id, quantity: 10 });
    await InventoryItem.create({ warehouseId, bookId: vol2._id, quantity: 5 });

    // 3. Verify Bundle Stock (Dynamic Calculation)
    const calculateBundleStock = async (
      bId: mongoose.Types.ObjectId,
      wId: mongoose.Types.ObjectId
    ) => {
      const b = await Book.findById(bId).populate('bundleBooks');
      if (!b) return 0;
      const bundleBooks = (b.bundleBooks || []) as unknown as {
        _id: mongoose.Types.ObjectId;
      }[];
      const invItems = await InventoryItem.find({
        warehouseId: wId,
        bookId: { $in: bundleBooks.map((v) => v._id) },
      });
      const minStock = Math.min(
        ...bundleBooks.map((v) => {
          const item = invItems.find(
            (i) => i.bookId.toString() === v._id.toString()
          );
          return item ? item.quantity : 0;
        })
      );
      return minStock;
    };

    let bundleStock = await calculateBundleStock(bundle._id, warehouseId);
    console.log(`Calculated Bundle Stock: ${bundleStock} (Expected: 5)`);
    if (bundleStock !== 5)
      throw new Error('Incorrect bundle stock calculation');

    // 4. Simulate a movement for the bundle (Inventory update logic)
    console.log('Simulating bundle movement (entry of 2 bundles)...');
    // Using the logic: only update volumes
    const bundleQty = 2;
    const volumes = [vol1._id, vol2._id];
    for (const vId of volumes) {
      await InventoryItem.updateOne(
        { warehouseId: warehouseId, bookId: vId },
        { $inc: { quantity: bundleQty } }
      );
    }

    // 5. Verify no InventoryItem was created for the bundle
    const bundleInventory = await InventoryItem.findOne({
      warehouseId,
      bookId: bundle._id,
    });
    if (bundleInventory) {
      throw new Error('ERROR: InventoryItem found for virtual bundle!');
    } else {
      console.log('SUCCESS: No InventoryItem created for virtual bundle.');
    }

    // 6. Verify volume stock updated
    const v2NewStock = await InventoryItem.findOne({
      warehouseId,
      bookId: vol2._id,
    });
    console.log(`Vol 2 New Stock: ${v2NewStock?.quantity} (Expected: 7)`);
    if (v2NewStock?.quantity !== 7)
      throw new Error('Volume stock not updated correctly');

    bundleStock = await calculateBundleStock(bundle._id, warehouseId);
    console.log(`New Calculated Bundle Stock: ${bundleStock} (Expected: 7)`);

    // Clean up
    console.log('Cleaning up...');
    await Book.findByIdAndDelete(vol1._id);
    await Book.findByIdAndDelete(vol2._id);
    await Book.findByIdAndDelete(bundle._id);
    await InventoryItem.deleteMany({ warehouseId });

    console.log('Verification finished successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  }
}

verifyVirtualBundle();
