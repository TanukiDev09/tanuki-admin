import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI environment variable is not defined');
  process.exit(1);
}

interface MovementDoc {
  category?: string;
  type?: string;
  _id: mongoose.Types.ObjectId;
}

function getCategoryMap(movements: MovementDoc[]) {
  const categoryMap = new Map<string, Set<string>>();
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
  return categoryMap;
}

function getCategoryType(types: Set<string>) {
  const hasIngreso = types.has('Ingreso') || types.has('INCOME');
  const hasEgreso = types.has('Egreso') || types.has('EXPENSE');
  if (hasIngreso && !hasEgreso) return 'Ingreso';
  if (!hasIngreso && hasEgreso) return 'Egreso';
  return 'Ambos';
}

interface CategoryDoc extends mongoose.Document {
  name: string;
  type: string;
  isActive: boolean;
}

async function ensureCategories(
  categoryMap: Map<string, Set<string>>,
  CategoryModel: mongoose.Model<CategoryDoc>
) {
  const nameToIdMap = new Map<string, mongoose.Types.ObjectId>();
  for (const [name, types] of categoryMap) {
    const type = getCategoryType(types);
    let category = (await CategoryModel.findOne({
      name,
    })) as CategoryDoc | null;
    if (!category) {
      console.log(`Creating category: ${name}`);
      category = (await CategoryModel.create({
        name,
        type,
        isActive: true,
      })) as CategoryDoc;
    }
    nameToIdMap.set(name, category._id);
  }
  return nameToIdMap;
}

async function migrateCategories() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to DB');

  const MovementSchema = new mongoose.Schema(
    { category: mongoose.Schema.Types.Mixed, type: String },
    { strict: false }
  );
  const CategorySchema = new mongoose.Schema(
    { name: String, type: String, isActive: Boolean },
    { timestamps: true }
  );

  const Movement =
    mongoose.models.Movement ||
    mongoose.model<MovementDoc>('Movement', MovementSchema, 'movements');
  const Category =
    mongoose.models.Category ||
    mongoose.model('Category', CategorySchema, 'categories');

  try {
    const movements = (await Movement.find({
      category: { $type: 'string' },
    })) as unknown as MovementDoc[];
    console.log(
      `Found ${movements.length} movements with string categories to migrate.`
    );

    const categoryMap = getCategoryMap(movements);
    console.log(`Found ${categoryMap.size} unique categories.`);

    const nameToIdMap = await ensureCategories(categoryMap, Category);

    const bulkOps = movements
      .filter(
        (mov) =>
          typeof mov.category === 'string' &&
          mov.category.trim() !== '' && // Added check for non-empty trimmed string
          nameToIdMap.has(mov.category.trim())
      )
      .map((mov) => ({
        updateOne: {
          filter: { _id: mov._id },
          update: {
            $set: { category: nameToIdMap.get(mov.category?.trim() || '') },
          },
        },
      }));

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
