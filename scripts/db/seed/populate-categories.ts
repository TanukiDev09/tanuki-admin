import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI environment variable is not defined');
  process.exit(1);
}

async function populateCategories() {
  try {
    console.log('Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Conexión exitosa.');

    // Define minimal schemas locally to avoid TS path issues
    const Movement =
      mongoose.models.Movement ||
      mongoose.model(
        'Movement',
        new mongoose.Schema({
          category: String,
          type: String,
        })
      );

    const Category =
      mongoose.models.Category ||
      mongoose.model(
        'Category',
        new mongoose.Schema(
          {
            name: { type: String, unique: true },
            type: { type: String, enum: ['Ingreso', 'Egreso', 'Ambos'] },
            isActive: Boolean,
          },
          { timestamps: true }
        )
      );

    console.log('Obteniendo movimientos...');
    const movements = await Movement.find({}, 'category type').lean();

    const uniqueCategories = new Map<string, Set<string>>(); // categoryName -> Set<Types>

    movements.forEach((mov: { category?: string; type?: string }) => {
      if (!mov.category) return;

      // Normalize category name (trim)
      const cleanName = mov.category.trim();

      if (!uniqueCategories.has(cleanName)) {
        uniqueCategories.set(cleanName, new Set());
      }

      if (mov.type) {
        uniqueCategories.get(cleanName)?.add(mov.type);
      }
    });

    console.log(`Encontradas ${uniqueCategories.size} categorías únicas.`);

    for (const [name, types] of uniqueCategories) {
      // Determine probable type
      let type = 'Ambos';
      const hasIngreso = types.has('Ingreso');
      const hasEgreso = types.has('Egreso');

      if (hasIngreso && !hasEgreso) {
        type = 'Ingreso';
      } else if (!hasIngreso && hasEgreso) {
        type = 'Egreso';
      } else {
        type = 'Ambos';
      }

      const existing = await Category.findOne({ name });
      if (!existing) {
        console.log(`Creando categoría: ${name} (${type})`);
        await Category.create({
          name,
          type,
          isActive: true,
        });
      } else {
        console.log(`Categoría ya existe: ${name}`);
      }
    }

    console.log('Población de categorías completada.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Desconectado.');
  }
}

populateCategories();
