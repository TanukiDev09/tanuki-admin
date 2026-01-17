const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://juan_o:tenken80@accounting.o7z2iay.mongodb.net/';

async function run() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected successfully to server');

    // List specific database 'accounting'
    const db = client.db('accounting');

    console.log('Database: accounting');

    const collections = await db.listCollections().toArray();
    console.log('Collections:');

    for (const collection of collections) {
      console.log(`- ${collection.name}`);
      const col = db.collection(collection.name);
      const count = await col.countDocuments();
      console.log(`  Count: ${count}`);

      const sample = await col.findOne({});
      console.log(`  Sample:`, JSON.stringify(sample, null, 2));
      console.log('---');
    }
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

run();
