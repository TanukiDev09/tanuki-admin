import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';

// Manually parse .env file
function loadEnv() {
  const cwd = process.cwd();
  let envPath = path.resolve(cwd, '.env.local');

  if (!fs.existsSync(envPath)) {
    envPath = path.resolve(cwd, '.env');
  }

  if (fs.existsSync(envPath)) {
    console.log('Loading env from:', envPath);
    const content = fs.readFileSync(envPath, 'utf-8');
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const parts = trimmed.split('=');
        const key = parts[0].trim();
        const value = parts
          .slice(1)
          .join('=')
          .trim()
          .replace(/^["']|["']$/g, '');

        if (key && value) {
          process.env[key] = value;
        }
      }
    }
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

async function migrate() {
  try {
    console.log(
      'Connecting to MongoDB...',
      MONGODB_URI.includes('@') ? 'Atlas' : 'Local'
    );
    await mongoose.connect(MONGODB_URI as string);
    console.log('Connected.');

    const books = await Book.find({});
    console.log(`Found ${books.length} books to process.`);

    const creatorsMap = new Map<string, { roles: Set<string> }>();

    // Step 1: Collect all unique creators and their roles
    for (const book of books) {
      const processRole = (names: any, role: string) => {
        if (!names || !Array.isArray(names)) return;

        // Skip if already ObjectIds
        const stringNames = names.filter(
          (n) => typeof n === 'string' && !mongoose.isValidObjectId(n)
        );

        for (const name of stringNames) {
          const trimmedName = name.trim();
          if (!trimmedName) continue;

          if (!creatorsMap.has(trimmedName)) {
            creatorsMap.set(trimmedName, { roles: new Set() });
          }
          creatorsMap.get(trimmedName)!.roles.add(role);
        }
      };

      processRole(book.authors, 'author');
      processRole(book.illustrators, 'illustrator');
      processRole(book.translators, 'translator');
    }

    console.log(`Found ${creatorsMap.size} unique creators to create/update.`);

    // Step 2: Create Creator documents
    const nameToIdMap = new Map<string, mongoose.Types.ObjectId>();

    for (const [name, data] of creatorsMap) {
      // Check case-insensitive
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
        } catch (e: any) {
          console.error(`Error creating ${name}:`, e);
          continue;
        }
      } else {
        // Update roles if needed
        const currentRoles = new Set(creator.roles);
        let updated = false;
        for (const role of data.roles) {
          if (!currentRoles.has(role)) {
            creator.roles.push(role);
            updated = true;
          }
        }
        if (updated) {
          await creator.save();
          console.log(`Updated roles for existing creator: ${name}`);
        }
      }
      if (creator) {
        nameToIdMap.set(name, creator._id);
      }
    }

    // Step 3: Update Books
    for (const book of books) {
      let modified = false;

      const updateField = (
        field: 'authors' | 'illustrators' | 'translators'
      ) => {
        const currentValues = book.get(field);
        if (!Array.isArray(currentValues) || currentValues.length === 0) return;

        const newIds: mongoose.Types.ObjectId[] = [];
        let fieldChanged = false;

        for (const val of currentValues) {
          if (typeof val === 'string' && !mongoose.isValidObjectId(val)) {
            if (nameToIdMap.has(val.trim())) {
              newIds.push(nameToIdMap.get(val.trim())!);
              fieldChanged = true;
            } else {
              console.warn(
                `Warning: Could not find Creator ID for "${val}" in book "${book.title}"`
              );
            }
          } else if (
            mongoose.isValidObjectId(val) ||
            (typeof val === 'object' && val._id)
          ) {
            newIds.push(val._id || val);
          }
        }

        if (fieldChanged) {
          book.set(field, newIds);
          modified = true;
        }
      };

      updateField('authors');
      updateField('illustrators');
      updateField('translators');

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

    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

migrate();
