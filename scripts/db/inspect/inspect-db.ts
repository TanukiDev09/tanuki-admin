import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI environment variable is not defined');
  process.exit(1);
}

async function listCollections() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to', MONGODB_URI);

    // Admin interface to list databases/collections
    const db = mongoose.connection?.db;
    if (!db) throw new Error('Mongoose not connected');
    const admin = db.admin();
    const dbs = await admin.listDatabases();
    console.log('Databases:', dbs.databases.map((d) => d.name).join(', '));

    const collections = await db.listCollections().toArray();
    console.log(
      'Collections in current db:',
      collections.map((c) => c.name).join(', ')
    );
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

listCollections();
