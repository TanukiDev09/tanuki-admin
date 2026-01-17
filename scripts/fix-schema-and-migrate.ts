import mongoose from 'mongoose';

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://juan_o:tenken80@accounting.o7z2iay.mongodb.net/accounting';

async function fixSchemaAndMigrate() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to DB');

  try {
    // 1. Fetch current validator
    const db = mongoose.connection?.db;
    if (!db) throw new Error('Mongoose not connected');
    const safeDb = db!;
    const collections = await safeDb
      .listCollections({ name: 'movements' })
      .toArray();
    if (collections.length === 0) throw new Error('Collection not found');

    const collectionInfo = collections[0] as any;
    let validator = collectionInfo.options?.validator || {};

    // Ensure $jsonSchema exists
    if (!validator.$jsonSchema) {
      console.log('No JSON Schema found, creating base...');
      validator = {
        $jsonSchema: {
          bsonType: 'object',
          properties: {},
          additionalProperties: false,
        },
      };
    }

    const properties = validator.$jsonSchema.properties || {};

    // 2. Add missing fields to schema
    const newFields = {
      category: {
        bsonType: ['string', 'objectId'], // Allow both during migration
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
      if (!properties[key]) {
        console.log(`Adding ${key} to schema validation...`);
        properties[key] = schema;
        modified = true;
      } else if (key === 'category') {
        // Ensure category allows objectId if it exists but only as string
        const currentType = properties[key].bsonType;
        // If strictly string, change to array
        if (currentType === 'string') {
          console.log('Updating category schema to allow objectId...');
          properties[key].bsonType = ['string', 'objectId'];
          modified = true;
        }
      }
    }

    if (modified) {
      validator.$jsonSchema.properties = properties;
      await safeDb.command({
        collMod: 'movements',
        validator: validator,
        validationLevel: 'moderate', // Only apply to inserts and updates to existing valid docs
      });
      console.log('Schema validator updated.');
    } else {
      console.log('Schema was already compatible.');
    }

    // 3. Run Migration Logic
    console.log('Starting data migration...');

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
        type: String,
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

    // Find movements with string categories
    const movements = await Movement.find({ category: { $type: 'string' } });
    console.log(`Found ${movements.length} movements to migrate.`);

    const categoryMap = new Map();

    // 3a. Extract unique categories
    for (const mov of movements) {
      if (mov.category && typeof mov.category === 'string') {
        const name = mov.category.trim();
        if (!categoryMap.has(name)) categoryMap.set(name, new Set());
        if (mov.type) categoryMap.get(name).add(mov.type);
      }
    }
    console.log(`Unique categories found: ${categoryMap.size}`);

    // 3b. Create Categories
    const nameToId = new Map();
    for (const [name, types] of categoryMap) {
      let type = 'Ambos';
      const hasIngreso = types.has('Ingreso') || types.has('INCOME');
      const hasEgreso = types.has('Egreso') || types.has('EXPENSE');
      if (hasIngreso && !hasEgreso) type = 'Ingreso';
      else if (!hasIngreso && hasEgreso) type = 'Egreso';

      let cat = await Category.findOne({ name });
      if (!cat) {
        console.log(`Creating category: ${name}`);
        cat = await Category.create({ name, type, isActive: true });
      }
      nameToId.set(name, cat._id);
    }

    // 3c. Update Movements
    const bulkops = [];
    for (const mov of movements) {
      const name = mov.category?.trim();
      if (name && nameToId.has(name)) {
        bulkops.push({
          updateOne: {
            filter: { _id: mov._id },
            update: { $set: { category: nameToId.get(name) } },
          },
        });
      }
    }

    if (bulkops.length > 0) {
      console.log(`Executing ${bulkops.length} updates...`);
      await Movement.bulkWrite(bulkops);
      console.log('Updates completed.');
    } else {
      console.log('No updates needed.');
    }
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

fixSchemaAndMigrate();
