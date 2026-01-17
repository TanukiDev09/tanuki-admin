const mongoose = require('mongoose');

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://juan_o:tenken80@accounting.o7z2iay.mongodb.net/accounting';

async function updateValidator() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to DB');

  try {
    const db = mongoose.connection.db;
    const collections = await db
      .listCollections({ name: 'movements' })
      .toArray();

    if (collections.length === 0) {
      console.log('Collection not found');
      return;
    }

    const collectionInfo = collections[0];
    let validator = collectionInfo.options.validator;

    if (!validator || !validator.$jsonSchema) {
      console.log('No JSON Schema found to update.');
      return;
    }

    const properties = validator.$jsonSchema.properties;

    console.log('Current properties:', Object.keys(properties));

    const newFields = {
      unit: {
        bsonType: ['string', 'null'],
        description: 'Unidad de medida',
      },
      quantity: {
        bsonType: ['decimal', 'double', 'int', 'long', 'null'], // Allow various number types
        description: 'Cantidad',
      },
      unitValue: {
        bsonType: ['decimal', 'double', 'int', 'long', 'null'],
        description: 'Valor Unitario',
      },
    };

    let modified = false;
    for (const [key, schema] of Object.entries(newFields)) {
      if (!properties[key]) {
        console.log(`Adding ${key} to validator...`);
        properties[key] = schema;
        modified = true;
      } else {
        console.log(`${key} already in validator.`);
      }
    }

    if (modified) {
      validator.$jsonSchema.properties = properties;
      await db.command({
        collMod: 'movements',
        validator: validator,
        validationLevel: 'moderate',
      });
      console.log('Validator updated successfully.');
    } else {
      console.log('No changes needed.');
    }
  } catch (error) {
    console.error('Error updating validator:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

updateValidator();
