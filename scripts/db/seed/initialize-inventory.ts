import mongoose from 'mongoose';

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/tanuki';

async function initializeInventory() {
  try {
    console.log('Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Conexión exitosa.');

    // Import models
    // Using dynamic import because of TS path aliases and execution context
    const Warehouse =
      mongoose.models.Warehouse ||
      mongoose.model(
        'Warehouse',
        new mongoose.Schema(
          {
            code: String,
            name: String,
            type: String,
            pointOfSaleId: mongoose.Schema.Types.ObjectId,
            status: String,
            address: String,
            city: String,
          },
          { timestamps: true }
        )
      );

    const PointOfSale =
      mongoose.models.PointOfSale ||
      mongoose.model(
        'PointOfSale',
        new mongoose.Schema({
          name: String,
          code: String,
          warehouseId: mongoose.Schema.Types.ObjectId,
          address: String,
          city: String,
        })
      );

    // 1. Create Editorial Warehouse if it doesn't exist
    console.log('Buscando bodega editorial...');
    let editorialWarehouse = await Warehouse.findOne({ type: 'editorial' });

    if (!editorialWarehouse) {
      console.log('Creando bodega editorial...');
      editorialWarehouse = await Warehouse.create({
        code: 'BOD-EDITORIAL',
        name: 'Bodega Editorial Principal',
        type: 'editorial',
        status: 'active',
        city: 'Bogotá',
        description:
          'Bodega principal de la editorial para gestión de stock centralizado.',
      });
      console.log('Bodega editorial creada:', editorialWarehouse.code);
    } else {
      console.log('Bodega editorial ya existe:', editorialWarehouse.code);
    }

    // 2. Create warehouses for existing Points of Sale
    console.log('Buscando puntos de venta sin bodega...');
    const pointsOfSale = await PointOfSale.find({
      $or: [{ warehouseId: { $exists: false } }, { warehouseId: null }],
    });

    console.log(
      `Encontrados ${pointsOfSale.length} puntos de venta sin bodega.`
    );

    for (const pos of pointsOfSale) {
      const warehouseCode = `BOD-${pos.code}`;

      // Check if warehouse already exists by code
      let warehouse = await Warehouse.findOne({ code: warehouseCode });

      if (!warehouse) {
        console.log(`Creando bodega para POS: ${pos.name} (${pos.code})`);
        warehouse = await Warehouse.create({
          code: warehouseCode,
          name: `Bodega ${pos.name}`,
          type: 'pos',
          pointOfSaleId: pos._id,
          address: pos.address,
          city: pos.city,
          status: 'active',
        });
      }

      // Link POS to warehouse
      pos.warehouseId = warehouse._id;
      await pos.save();

      // Link Warehouse to POS (bidirectional)
      warehouse.pointOfSaleId = pos._id;
      await warehouse.save();

      console.log(`POS ${pos.code} vinculado a bodega ${warehouse.code}`);
    }

    console.log('Inicialización completada con éxito.');
  } catch (error) {
    console.error('Error durante la inicialización:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Desconectado de MongoDB.');
  }
}

initializeInventory();
