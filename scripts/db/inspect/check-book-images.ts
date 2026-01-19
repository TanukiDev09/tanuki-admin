import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI not defined');
  process.exit(1);
}

async function checkBookImages() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI);

    console.log('Connected to:', mongoose.connection.db?.databaseName);

    const Book =
      mongoose.models.Book ||
      mongoose.model(
        'Book',
        new mongoose.Schema({}, { strict: false }),
        'books'
      );

    const books = await Book.find({}, { title: 1, coverImage: 1 }).limit(20);

    console.log('Book Cover Images:');
    books.forEach((book) => {
      console.log(`- ${book.title}: ${book.coverImage || 'NONE'}`);
    });
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

checkBookImages();
