import mongoose from 'mongoose';
// Pre-import models to ensure they are registered for migrations and population
import '@/models/Category';
import '@/models/Movement';
import '@/models/Book';
import '@/models/Warehouse';
import '@/models/InventoryItem';

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://juan_o:tenken80@accounting.o7z2iay.mongodb.net/accounting';

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log('Connected to MongoDB via Mongoose');
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
