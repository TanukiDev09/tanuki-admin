import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';

// Manually parse .env file
function parseEnvLine(line: string) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;
  const parts = trimmed.split('=');
  const key = parts[0].trim();
  const value = parts
    .slice(1)
    .join('=')
    .trim()
    .replace(/^["']|["']$/g, '');
  return key && value ? { key, value } : null;
}

function loadEnv() {
  const cwd = process.cwd();
  let envPath = path.resolve(cwd, '.env.local');

  if (!fs.existsSync(envPath)) {
    envPath = path.resolve(cwd, '.env');
  }

  if (fs.existsSync(envPath)) {
    console.log('Loading env from:', envPath);
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach((line) => {
      const parsed = parseEnvLine(line);
      if (parsed) process.env[parsed.key] = parsed.value;
    });
  }
}

loadEnv();

const MONGODB_URI =
  process.env.MONGODB_URI_DEV ||
  process.env.MONGODB_URI ||
  'mongodb+srv://juan_o:tenken80@accounting.o7z2iay.mongodb.net/accounting';

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI/MONGODB_URI_DEV is not defined');
  process.exit(1);
}

// Simple Schema definitions for migration
const CreatorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    roles: [String],
  },
  { timestamps: true }
);

const BookSchema = new mongoose.Schema(
  {
    title: String,
    authors: [mongoose.Schema.Types.Mixed],
    illustrators: [mongoose.Schema.Types.Mixed],
    translators: [mongoose.Schema.Types.Mixed],
  },
  { strict: false }
);

const Creator =
  mongoose.models.Creator ||
  mongoose.model('Creator', CreatorSchema, 'creators');
const Book =
  mongoose.models.Book || mongoose.model('Book', BookSchema, 'books');

interface MinimalBook {
  authors?: (
    | string
    | mongoose.Types.ObjectId
    | { _id: mongoose.Types.ObjectId }
  )[];
  illustrators?: (
    | string
    | mongoose.Types.ObjectId
    | { _id: mongoose.Types.ObjectId }
  )[];
  translators?: (
    | string
    | mongoose.Types.ObjectId
    | { _id: mongoose.Types.ObjectId }
  )[];
}

function processBookRoles(
  book: MinimalBook,
  creatorsMap: Map<string, { roles: Set<string> }>
) {
  const roles: (keyof MinimalBook)[] = [
    'authors',
    'illustrators',
    'translators',
  ];
  roles.forEach((roleField) => {
    const names = book[roleField];
    if (!names || !Array.isArray(names)) return;

    names
      .filter(
        (n): n is string =>
          typeof n === 'string' && !mongoose.isValidObjectId(n)
      )
      .forEach((name) => {
        const trimmedName = name.trim();
        if (trimmedName) {
          if (!creatorsMap.has(trimmedName)) {
            creatorsMap.set(trimmedName, { roles: new Set() });
          }
          const role = roleField.slice(0, -1); // authors -> author
          creatorsMap.get(trimmedName)!.roles.add(role);
        }
      });
  });
}

function collectCreators(books: (MinimalBook & mongoose.Document)[]) {
  const creatorsMap = new Map<string, { roles: Set<string> }>();
  books.forEach((book) => processBookRoles(book, creatorsMap));
  return creatorsMap;
}

async function findOrCreateCreator(name: string, data: { roles: Set<string> }) {
  let creator = await Creator.findOne({
    name: { $regex: new RegExp(`^${name}$`, 'i') },
  });

  if (!creator) {
    try {
      creator = await Creator.create({
        name,
        roles: Array.from(data.roles),
      });
      console.log(`Created new creator: ${name}`);
    } catch (e: unknown) {
      console.error(`Error creating ${name}:`, e);
      return null;
    }
  } else {
    const currentRoles = new Set((creator.roles as string[]) || []);
    let updated = false;
    for (const role of data.roles) {
      if (!currentRoles.has(role)) {
        (creator.roles as string[]).push(role);
        updated = true;
      }
    }
    if (updated) {
      await creator.save();
      console.log(`Updated roles for existing creator: ${name}`);
    }
  }
  return creator;
}

async function upsertCreators(
  creatorsMap: Map<string, { roles: Set<string> }>
) {
  const nameToIdMap = new Map<string, mongoose.Types.ObjectId>();

  for (const [name, data] of creatorsMap) {
    const creator = await findOrCreateCreator(name, data);
    if (creator) {
      nameToIdMap.set(name, creator._id as mongoose.Types.ObjectId);
    }
  }
  return nameToIdMap;
}

interface TempBook extends mongoose.Document {
  title?: string;
  authors?: (
    | string
    | mongoose.Types.ObjectId
    | { _id: mongoose.Types.ObjectId }
  )[];
  illustrators?: (
    | string
    | mongoose.Types.ObjectId
    | { _id: mongoose.Types.ObjectId }
  )[];
  translators?: (
    | string
    | mongoose.Types.ObjectId
    | { _id: mongoose.Types.ObjectId }
  )[];
}

function getNewFieldIds(
  book: TempBook,
  field: 'authors' | 'illustrators' | 'translators',
  nameToIdMap: Map<string, mongoose.Types.ObjectId>
) {
  const currentValues = book.get(field);
  if (!Array.isArray(currentValues) || currentValues.length === 0) return null;

  const newIds: mongoose.Types.ObjectId[] = [];
  let fieldChanged = false;

  for (const val of currentValues) {
    if (typeof val === 'string' && !mongoose.isValidObjectId(val)) {
      const trimmed = val.trim();
      if (nameToIdMap.has(trimmed)) {
        newIds.push(nameToIdMap.get(trimmed)!);
        fieldChanged = true;
      }
    } else if (mongoose.isValidObjectId(val)) {
      newIds.push(val);
    } else if (typeof val === 'object' && val && '_id' in val) {
      newIds.push(val._id as mongoose.Types.ObjectId);
    }
  }
  return fieldChanged ? newIds : null;
}

async function updateSingleBook(
  book: TempBook,
  nameToIdMap: Map<string, mongoose.Types.ObjectId>
) {
  const fields = ['authors', 'illustrators', 'translators'] as const;
  let modified = false;

  for (const field of fields) {
    const newIds = getNewFieldIds(book, field, nameToIdMap);
    if (newIds) {
      book.set(field, newIds);
      modified = true;
    }
  }

  if (modified) {
    await Book.updateOne(
      { _id: book._id },
      {
        $set: {
          authors: book.authors,
          illustrators: book.illustrators,
          translators: book.translators,
        },
      }
    );
    console.log(`Updated book: ${book.title}`);
  }
}

async function updateBooks(
  books: TempBook[],
  nameToIdMap: Map<string, mongoose.Types.ObjectId>
) {
  for (const book of books) {
    await updateSingleBook(book, nameToIdMap);
  }
}

async function runMigration() {
  const books = (await Book.find({})) as (TempBook & mongoose.Document)[];
  console.log(`Found ${books.length} books to process.`);

  const creatorsMap = collectCreators(books);
  console.log(`Found ${creatorsMap.size} unique creators.`);

  const nameToIdMap = await upsertCreators(creatorsMap);
  await updateBooks(books, nameToIdMap);
}

async function migrate() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI as string);
    console.log('Connected.');
    await runMigration();
    console.log('Migration completed successfully.');
  } catch (error: unknown) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

migrate();
