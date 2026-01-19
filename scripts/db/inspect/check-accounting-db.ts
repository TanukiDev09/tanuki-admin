
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI not defined');
  process.exit(1);
}

async function checkAccountingDB() {
  try {
    // Append the database name to the URI if it's not there
    const accountingURI = MONGODB_URI.includes('.net/') 
      ? MONGODB_URI.replace('.net/', '.net/accounting')
      : MONGODB_URI + '/accounting';

    console.log('Connecting to accounting database...');
    const client = await mongoose.connect(accountingURI);
    
    console.log('Current Database:', client.connection.db?.databaseName);
    
    const collections = await client.connection.db?.listCollections().toArray();
    console.log('Collections in accounting DB:', collections?.map(c => c.name).join(', '));

    // Check users collection specifically
    const UserSchema = new mongoose.Schema({}, { strict: false });
    const User = mongoose.models.User || mongoose.model('User', UserSchema, 'users');
    
    const userCount = await User.countDocuments();
    console.log('Total users in accounting DB:', userCount);
    
    if (userCount > 0) {
      const users = await User.find({}, { email: 1 }).limit(5);
      console.log('Sample users in accounting DB:', users.map(u => u.email).join(', '));
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

checkAccountingDB();
