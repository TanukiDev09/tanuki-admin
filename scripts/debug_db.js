const { MongoClient } = require('mongodb');

async function debug() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Error: MONGODB_URI environment variable is not defined.');
    return;
  }
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('accounting');

    const pos = await db
      .collection('pointofsales')
      .findOne({ name: /Panamericana/i });
    console.log('Panamericana POS Warehouse ID:', pos?.warehouseId);

    console.log('\n--- ALL WAREHOUSES STOCK ---');
    const warehouses = await db.collection('warehouses').find({}).toArray();
    for (const w of warehouses) {
      const items = await db
        .collection('inventoryitems')
        .find({ warehouseId: w._id })
        .toArray();
      const total = items.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
      console.log(
        `Warehouse: ${w.name} (${w._id}) -> Items: ${items.length}, Total Units: ${total}`
      );
      if (total > 0 && w.name.toLowerCase().includes('panamericana')) {
        console.log(
          '!!! Found non-zero stock in a Panamericana warehouse:',
          w.name
        );
      }
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
  }
}

debug();
