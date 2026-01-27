import * as dotenv from 'dotenv';
dotenv.config();

import dbConnect from '../src/lib/mongodb';
import Warehouse from '../src/models/Warehouse';
import InventoryItem from '../src/models/InventoryItem';
import InventoryMovement from '../src/models/InventoryMovement';

async function checkWarehouse() {
  await dbConnect();
  console.log('Connected to DB');

  const warehouseCode = 'TEST_WH';
  const warehouse = await Warehouse.findOne({ code: warehouseCode });

  if (!warehouse) {
    console.log(`Warehouse with code ${warehouseCode} not found`);
    process.exit(0);
  }

  console.log('--- Warehouse Info ---');
  console.log(`ID: ${warehouse._id}`);
  console.log(`Name: ${warehouse.name}`);
  console.log(`Status: ${warehouse.status || 'N/A'}`);

  const inventoryItems = await InventoryItem.find({
    warehouseId: warehouse._id,
  });
  console.log('\n--- Inventory Items ---');
  console.log(`Total count (documents): ${inventoryItems.length}`);
  inventoryItems.forEach((item) => {
    console.log(`- Book ID: ${item.bookId}, Quantity: ${item.quantity}`);
  });

  const movementsFrom = await InventoryMovement.countDocuments({
    fromWarehouseId: warehouse._id,
  });
  const movementsTo = await InventoryMovement.countDocuments({
    toWarehouseId: warehouse._id,
  });

  console.log('\n--- Movements ---');
  console.log(`Movements (from): ${movementsFrom}`);
  console.log(`Movements (to): ${movementsTo}`);

  process.exit(0);
}

checkWarehouse();
