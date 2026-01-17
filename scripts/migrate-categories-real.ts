import mongoose from 'mongoose';

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://juan_o:tenken80@accounting.o7z2iay.mongodb.net/accounting';

async function migrateCategories() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to DB');

  // 1. Define temporary schemas to interact with existing data
  // We use strict: false to allow reading fields even if our definition is partial
  const MovementSchema = new mongoose.Schema(
    {
      category: mongoose.Schema.Types.Mixed,
      type: String,
    },
    { strict: false }
  );

  const CategorySchema = new mongoose.Schema(
    {
      name: String,
      type: String, // 'Ingreso', 'Egreso', 'Ambos'
      isActive: Boolean,
    },
    { timestamps: true }
  );

  const Movement =
    mongoose.models.Movement ||
    mongoose.model('Movement', MovementSchema, 'movements');
  const Category =
    mongoose.models.Category ||
    mongoose.model('Category', CategorySchema, 'categories');

  try {
    // 2. Scan all movements to find unique category names (strings)
    // Only fetch those where category is a string (not already migrated to ObjectId)
    const movements = await Movement.find({ category: { $type: 'string' } });
    console.log(
      `Found ${movements.length} movements with string categories to migrate.`
    );

    const categoryMap = new Map<string, Set<string>>(); // Name -> Set<Type>

    for (const mov of movements) {
      if (typeof mov.category === 'string' && mov.category.trim() !== '') {
        const name = mov.category.trim();
        if (!categoryMap.has(name)) {
          categoryMap.set(name, new Set());
        }
        if (mov.type) {
          categoryMap.get(name)?.add(mov.type);
        }
      }
    }

    console.log(`Found ${categoryMap.size} unique categories.`);

    // 3. Create Categories and build a mapping of Name -> ObjectId
    const nameToIdMap = new Map<string, mongoose.Types.ObjectId>();

    for (const [name, types] of categoryMap) {
      // Determine type
      let type = 'Ambos';
      const hasIngreso = types.has('Ingreso') || types.has('INCOME');
      const hasEgreso = types.has('Egreso') || types.has('EXPENSE');

      if (hasIngreso && !hasEgreso) type = 'Ingreso';
      else if (!hasIngreso && hasEgreso) type = 'Egreso';

      // Check if exists
      let category = await Category.findOne({ name });
      if (!category) {
        console.log(`Creating category: ${name}`);
        category = await Category.create({
          name,
          type,
          isActive: true,
        });
      }
      nameToIdMap.set(name, category._id);
    }

    // 4. Update Movements
    // Perform bulk writes for efficiency
    const bulkOps = [];

    for (const mov of movements) {
      if (
        typeof mov.category === 'string' &&
        nameToIdMap.has(mov.category.trim())
      ) {
        const newId = nameToIdMap.get(mov.category.trim());
        bulkOps.push({
          updateOne: {
            filter: { _id: mov._id },
            update: { $set: { category: newId } },
          },
        });
      }
    }

    if (bulkOps.length > 0) {
      console.log(`Executing ${bulkOps.length} updates...`);
      await Movement.bulkWrite(bulkOps);
      console.log('Migration completed successfully.');
    } else {
      console.log('No movements required update.');
    }
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

migrateCategories();
