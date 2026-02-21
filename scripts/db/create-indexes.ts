#!/usr/bin/env tsx
/**
 * Script para crear índices optimizados en MongoDB
 * Este script crea índices compuestos y search indexes basados en los patrones de consulta identificados
 */

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error(
    'Error: MONGODB_URI no está definido en las variables de entorno'
  );
  process.exit(1);
}

interface IndexSpec {
  collection: string;
  name: string;
  keys: Record<string, 1 | -1 | 'text'>;
  options?: {
    unique?: boolean;
    sparse?: boolean;
    background?: boolean;
    weights?: Record<string, number>;
    default_language?: string;
  };
}

// Definición de todos los índices a crear
const INDEXES: IndexSpec[] = [
  // ==================== BOOKS ====================
  {
    collection: 'books',
    name: 'search_title_isbn',
    keys: { title: 'text', isbn: 'text' },
    options: {
      weights: { title: 10, isbn: 5 },
      default_language: 'spanish',
    },
  },
  {
    collection: 'books',
    name: 'genre_active',
    keys: { genre: 1, isActive: 1 },
  },
  {
    collection: 'books',
    name: 'collection_active',
    keys: { collectionName: 1, isActive: 1 },
  },
  {
    collection: 'books',
    name: 'authors_idx',
    keys: { authors: 1 },
  },
  {
    collection: 'books',
    name: 'illustrators_idx',
    keys: { illustrators: 1 },
  },
  {
    collection: 'books',
    name: 'translators_idx',
    keys: { translators: 1 },
  },
  {
    collection: 'books',
    name: 'created_desc',
    keys: { createdAt: -1 },
  },
  {
    collection: 'books',
    name: 'active_created',
    keys: { isActive: 1, createdAt: -1 },
  },

  // ==================== INVOICES ====================
  {
    collection: 'invoices',
    name: 'search_customer_number',
    keys: { customerName: 'text', customerTaxId: 'text', number: 'text' },
    options: {
      weights: { number: 10, customerTaxId: 5, customerName: 3 },
      default_language: 'spanish',
    },
  },
  {
    collection: 'invoices',
    name: 'date_status',
    keys: { date: -1, status: 1 },
  },
  {
    collection: 'invoices',
    name: 'status_date',
    keys: { status: 1, date: -1 },
  },
  {
    collection: 'invoices',
    name: 'items_costcenter_date',
    keys: { 'items.costCenter': 1, date: -1 },
  },
  {
    collection: 'invoices',
    name: 'items_bookid_date',
    keys: { 'items.bookId': 1, date: -1 },
  },
  {
    collection: 'invoices',
    name: 'customer_taxid_status',
    keys: { customerTaxId: 1, status: 1 },
  },
  {
    collection: 'invoices',
    name: 'customer_name',
    keys: { customerName: 1 },
  },
  {
    collection: 'invoices',
    name: 'date_asc',
    keys: { date: 1 },
  },
  {
    collection: 'invoices',
    name: 'order_reference',
    keys: { orderReference: 1 },
  },
  {
    collection: 'invoices',
    name: 'items_type',
    keys: { 'items.type': 1 },
  },

  // ==================== MOVEMENTS ====================
  {
    collection: 'movements',
    name: 'search_description_beneficiary',
    keys: { description: 'text', beneficiary: 'text', notes: 'text' },
    options: {
      weights: { description: 10, beneficiary: 5, notes: 2 },
      default_language: 'spanish',
    },
  },
  {
    collection: 'movements',
    name: 'date_type',
    keys: { date: -1, type: 1 },
  },
  {
    collection: 'movements',
    name: 'date_category',
    keys: { date: -1, category: 1 },
  },
  {
    collection: 'movements',
    name: 'date_costcenter',
    keys: { date: -1, costCenter: 1 },
  },
  {
    collection: 'movements',
    name: 'category_date',
    keys: { category: 1, date: -1 },
  },
  {
    collection: 'movements',
    name: 'payment_channel',
    keys: { paymentChannel: 1 },
  },
  {
    collection: 'movements',
    name: 'unit_idx',
    keys: { unit: 1 },
  },
  {
    collection: 'movements',
    name: 'allocations_costcenter',
    keys: { 'allocations.costCenter': 1 },
  },
  {
    collection: 'movements',
    name: 'debt_id',
    keys: { debtId: 1 },
  },
  {
    collection: 'movements',
    name: 'point_of_sale',
    keys: { pointOfSale: 1 },
  },
  {
    collection: 'movements',
    name: 'fiscal_year_type',
    keys: { fiscalYear: 1, type: 1 },
  },
  {
    collection: 'movements',
    name: 'type_date',
    keys: { type: 1, date: -1 },
  },

  // ==================== DEBTS ====================
  {
    collection: 'debts',
    name: 'entity_status',
    keys: { entityId: 1, status: 1 },
  },
  {
    collection: 'debts',
    name: 'type_status',
    keys: { type: 1, status: 1 },
  },
  {
    collection: 'debts',
    name: 'entity_type_status',
    keys: { entityId: 1, type: 1, status: 1 },
  },

  // ==================== EXTERNAL ENTITIES ====================
  {
    collection: 'externalentities',
    name: 'search_name',
    keys: { name: 'text' },
    options: {
      default_language: 'spanish',
    },
  },
  {
    collection: 'externalentities',
    name: 'tax_id',
    keys: { taxId: 1 },
  },

  // ==================== POINTS OF SALE ====================
  {
    collection: 'pointsofsale',
    name: 'created_desc',
    keys: { createdAt: -1 },
  },
  {
    collection: 'pointsofsale',
    name: 'identification_number',
    keys: { identificationNumber: 1 },
  },
  {
    collection: 'pointsofsale',
    name: 'code_idx',
    keys: { code: 1 },
  },

  // ==================== CREATORS ====================
  {
    collection: 'creators',
    name: 'search_name',
    keys: { name: 'text' },
    options: {
      default_language: 'spanish',
    },
  },

  // ==================== INVENTORY MOVEMENTS ====================
  {
    collection: 'inventorymovements',
    name: 'date_type',
    keys: { date: -1, type: 1 },
  },
  {
    collection: 'inventorymovements',
    name: 'financial_movement',
    keys: { financialMovementId: 1 },
  },

  // ==================== CATEGORIES ====================
  {
    collection: 'categories',
    name: 'name_idx',
    keys: { name: 1 },
  },
];

async function createIndexes() {
  const client = new MongoClient(MONGODB_URI!);

  try {
    console.log('🔗 Conectando a MongoDB...');
    await client.connect();
    console.log('✅ Conectado exitosamente\n');

    const db = client.db();
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const indexSpec of INDEXES) {
      const collection = db.collection(indexSpec.collection);

      try {
        // Verificar si el índice ya existe
        const existingIndexes = await collection.indexes();
        const indexExists = existingIndexes.some(
          (idx) => idx.name === indexSpec.name
        );

        if (indexExists) {
          console.log(
            `⏭️  Saltando ${indexSpec.collection}.${indexSpec.name} (ya existe)`
          );
          skipCount++;
          continue;
        }

        // Crear el índice
        console.log(
          `📝 Creando índice: ${indexSpec.collection}.${indexSpec.name}`
        );

        await collection.createIndex(indexSpec.keys, {
          name: indexSpec.name,
          background: true,
          ...indexSpec.options,
        });

        console.log(`✅ Creado: ${indexSpec.collection}.${indexSpec.name}`);
        successCount++;
      } catch (error) {
        console.error(
          `❌ Error creando ${indexSpec.collection}.${indexSpec.name}:`,
          error
        );
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN:');
    console.log(`  ✅ Creados: ${successCount}`);
    console.log(`  ⏭️  Saltados: ${skipCount}`);
    console.log(`  ❌ Errores: ${errorCount}`);
    console.log(`  📋 Total procesados: ${INDEXES.length}`);
    console.log('='.repeat(60));
  } catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Conexión cerrada');
  }
}

// Ejecutar
createIndexes()
  .then(() => {
    console.log('\n✨ Script completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error ejecutando script:', error);
    process.exit(1);
  });
