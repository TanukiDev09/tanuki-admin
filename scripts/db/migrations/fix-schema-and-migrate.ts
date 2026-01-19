import mongoose from 'mongoose';

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://juan_o:tenken80@accounting.o7z2iay.mongodb.net/accounting';

async function getValidatorInfo(db: mongoose.mongo.Db) {
  const collections = await db.listCollections({ name: 'movements' }).toArray();
  if (collections.length === 0) throw new Error('Collection not found');
  const collectionInfo = collections[0] as {
    options?: { validator?: Record<string, unknown> };
  };
  return (
    collectionInfo.options?.validator || {
      $jsonSchema: {
        bsonType: 'object',
        properties: {} as Record<string, unknown>,
        additionalProperties: false,
      },
    }
  );
}

async function updateSchemaValidator(
  db: mongoose.mongo.Db,
  validator: Record<string, unknown>
) {
  const jsonSchema = (validator.$jsonSchema || {}) as Record<string, unknown>;
  const properties = (jsonSchema.properties || {}) as Record<string, unknown>;
  const newFields: Record<string, unknown> = {
    category: {
      bsonType: ['string', 'objectId'],
      description: 'Categoría del movimiento',
    },
    costCenter: {
      bsonType: ['string', 'null'],
      description: 'Centro de costos (legacy root field)',
    },
    beneficiary: {
      bsonType: ['string', 'null'],
      description: 'Beneficiario (legacy field)',
    },
  };

  let modified = false;
  for (const [key, schema] of Object.entries(newFields)) {
    const prop = properties[key] as Record<string, unknown> | undefined;
    if (!prop) {
      console.log(`Adding ${key} to schema validation...`);
      properties[key] = schema;
      modified = true;
    } else if (key === 'category' && prop.bsonType === 'string') {
      console.log('Updating category schema to allow objectId...');
      prop.bsonType = ['string', 'objectId'];
      modified = true;
    }
  }

  if (modified) {
    validator.$jsonSchema = {
      ...(validator.$jsonSchema as Record<string, unknown>),
      properties,
    };
    await db.command({
      collMod: 'movements',
      validator: validator,
      validationLevel: 'moderate',
    });
    console.log('Schema validator updated.');
  } else {
    console.log('Schema was already compatible.');
  }
}

interface MovementDoc {
  category?: string | mongoose.Types.ObjectId;
  type?: string;
  _id: mongoose.Types.ObjectId;
}

interface CategoryDoc extends mongoose.Document {
  name: string;
  type: string;
  isActive: boolean;
}

function getCategoryMap(movements: MovementDoc[]) {
  const categoryMap = new Map<string, Set<string>>();
  for (const mov of movements) {
    if (mov.category && typeof mov.category === 'string') {
      const name = mov.category.trim();
      if (!categoryMap.has(name)) categoryMap.set(name, new Set());
      if (mov.type) categoryMap.get(name)!.add(mov.type);
    }
  }
  return categoryMap;
}

async function ensureCategories(
  categoryMap: Map<string, Set<string>>,
  CategoryModel: mongoose.Model<CategoryDoc>
) {
  const nameToId = new Map<string, mongoose.Types.ObjectId>();
  for (const [name, types] of categoryMap) {
    let type = 'Ambos';
    const hasIngreso = types.has('Ingreso') || types.has('INCOME');
    const hasEgreso = types.has('Egreso') || types.has('EXPENSE');
    if (hasIngreso && !hasEgreso) type = 'Ingreso';
    else if (!hasIngreso && hasEgreso) type = 'Egreso';

    let cat = (await CategoryModel.findOne({ name })) as CategoryDoc | null;
    if (!cat) {
      console.log(`Creating category: ${name}`);
      cat = (await CategoryModel.create({
        name,
        type,
        isActive: true,
      })) as CategoryDoc;
    }
    nameToId.set(name, cat._id);
  }
  return nameToId;
}

async function migrateMovements(
  Movement: mongoose.Model<MovementDoc>,
  Category: mongoose.Model<CategoryDoc>
) {
  const movements = (await Movement.find({
    category: { $type: 'string' },
  })) as MovementDoc[];

  console.log(`Found ${movements.length} movements to migrate.`);
  if (movements.length === 0) return;

  const categoryMap = getCategoryMap(movements);
  const nameToId = await ensureCategories(categoryMap, Category);

  const bulkops = movements
    .map((mov) => {
      const name =
        typeof mov.category === 'string' ? mov.category.trim() : null;
      if (name && nameToId.has(name)) {
        return {
          updateOne: {
            filter: { _id: mov._id },
            update: { $set: { category: nameToId.get(name) } },
          },
        };
      }
      return null;
    })
    .filter((op): op is NonNullable<typeof op> => op !== null);

  if (bulkops.length > 0) {
    console.log(`Executing ${bulkops.length} updates...`);
    await Movement.bulkWrite(bulkops);
    console.log('Updates completed.');
  }
}

async function fixSchemaAndMigrate() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to DB');

  try {
    const db = mongoose.connection?.db;
    if (!db) throw new Error('Mongoose not connected');

    const validator = await getValidatorInfo(db);
    await updateSchemaValidator(db, validator);

    console.log('Starting data migration...');

    const Movement =
      mongoose.models.Movement ||
      mongoose.model<MovementDoc>(
        'Movement',
        new mongoose.Schema(
          { category: mongoose.Schema.Types.Mixed, type: String },
          { strict: false }
        ),
        'movements'
      );
    const Category =
      mongoose.models.Category ||
      mongoose.model<CategoryDoc>(
        'Category',
        new mongoose.Schema(
          { name: String, type: String, isActive: Boolean },
          { timestamps: true }
        ),
        'categories'
      );

    await migrateMovements(Movement, Category);
  } catch (error: unknown) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

fixSchemaAndMigrate();
