import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI environment variable is not defined');
  process.exit(1);
}

async function checkMovements() {
  try {
    await mongoose.connect(MONGODB_URI);
    const count = await mongoose.connection
      .collection('movements')
      .countDocuments();
    console.log(`Movements count: ${count}`);

    if (count > 0) {
      const sample = await mongoose.connection
        .collection('movements')
        .findOne();
      console.log('Sample movement:', JSON.stringify(sample, null, 2));
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkMovements();
