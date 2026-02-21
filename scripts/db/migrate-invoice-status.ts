import 'dotenv/config';
import mongoose from 'mongoose';
import Invoice from '../../src/models/Invoice';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
  process.exit(1);
}

async function migrate() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI!.trim());
    console.log('Connected.');

    console.log('Updating all invoices to "Unchecked" status...');
    const result = await Invoice.updateMany(
      {},
      { $set: { status: 'Unchecked' } }
    );

    console.log(`Successfully updated ${result.modifiedCount} invoices.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
