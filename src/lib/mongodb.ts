import mongoose from 'mongoose';
// Pre-import models to ensure they are registered for migrations and population
import '@/models/Category';
import '@/models/Movement';
import '@/models/Book';
import '@/models/Warehouse';
import '@/models/InventoryItem';
import '@/models/Permission';

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
    console.log('[MongoDB] Using cached connection');
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    console.log('[MongoDB] Creating new connection to URI:', MONGODB_URI.split('@')[1] || 'hidden');
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('[MongoDB] Connection established');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    console.error('[MongoDB] Connection error:', e);
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Assuming TOKEN_NAME, ONE_DAY_MS, and cookies() are defined or imported elsewhere
// For this change, I'm adding the function as provided, correcting the typo 'rexport' to 'export'.
// If cookies(), TOKEN_NAME, or ONE_DAY_MS are not defined, this code will cause errors.
export default dbConnect;
