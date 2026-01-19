import mongoose from 'mongoose';
import fs from 'fs';

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://juan_o:tenken80@accounting.o7z2iay.mongodb.net/accounting';

async function inspectValidator() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to DB');

  try {
    const db = mongoose.connection?.db;
    if (!db) throw new Error('Mongoose not connected');
    const list = await db.listCollections({ name: 'movements' }).toArray();
    if (list.length > 0) {
      const collectionInfo = list[0] as {
        options?: { validator?: Record<string, unknown> };
      };
      const validator = collectionInfo.options?.validator;
      fs.writeFileSync('validator.json', JSON.stringify(validator, null, 2));
      console.log('Validator saved to validator.json');
    } else {
      console.log('Collection not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

inspectValidator();
