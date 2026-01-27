import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function checkSearch() {
  const dbConnect = (await import('../../src/lib/mongodb')).default;
  const Book = (await import('../../src/models/Book')).default;

  await dbConnect();
  const search = 'Complete';
  const filter = {
    $or: [
      { title: { $regex: search, $options: 'i' } },
      { isbn: { $regex: search, $options: 'i' } },
    ],
  };

  const books = await Book.find(filter).lean();
  console.log('Search results for "Complete":');
  console.log(JSON.stringify(books, null, 2));
  process.exit(0);
}

checkSearch();
