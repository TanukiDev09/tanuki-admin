
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI not defined');
  process.exit(1);
}

async function checkDatabases() {
  try {
    console.log('Connecting to cluster...');
    const client = await mongoose.connect(MONGODB_URI);
    const admin = client.connection.db?.admin();
    
    if (admin) {
      const dbs = await admin.listDatabases();
      console.log('Databases on this cluster:');
      dbs.databases.forEach(db => {
        console.log(`- ${db.name}`);
      });
    } else {
      console.log('Could not get admin handle');
    }

    // Also list collections in current DB
    const currentDb = client.connection.db;
    console.log('Current Database:', currentDb?.databaseName);
    const collections = await currentDb?.listCollections().toArray();
    console.log('Collections in current DB:', collections?.map(c => c.name).join(', '));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

checkDatabases();
