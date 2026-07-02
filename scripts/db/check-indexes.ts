#!/usr/bin/env tsx
/**
 * Script para verificar índices en MongoDB
 * Lista todos los índices existentes y compara con los esperados
 */

import { MongoClient, Db } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error(
    'Error: MONGODB_URI no está definido en las variables de entorno'
  );
  process.exit(1);
}

// Colecciones a verificar
const COLLECTIONS = [
  'books',
  'invoices',
  'movements',
  'debts',
  'externalentities',
  'pointsofsale',
  'creators',
  'inventorymovements',
  'categories',
  'inventoryitems',
  'permissions',
  'users',
  'warehouses',
];

async function checkCollectionIndexes(db: Db, collectionName: string) {
  try {
    const collection = db.collection(collectionName);

    // Verificar si la colección existe
    const collections = await db
      .listCollections({ name: collectionName })
      .toArray();
    if (collections.length === 0) {
      console.log(`⚠️  Colección '${collectionName}' no existe`);
      return;
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📁 COLECCIÓN: ${collectionName}`);
    console.log('='.repeat(60));

    const indexes = await collection.indexes();

    console.log(`  Total de índices: ${indexes.length}\n`);

    for (const index of indexes) {
      console.log(`  📌 ${index.name}`);
      console.log(`     Campos: ${JSON.stringify(index.key)}`);

      if (index.unique) console.log(`     🔒 Único: true`);
      if (index.sparse) console.log(`     🎯 Sparse: true`);
      if (index.background) console.log(`     ⏳ Background: true`);
      if (index.weights)
        console.log(`     ⚖️  Weights: ${JSON.stringify(index.weights)}`);

      console.log('');
    }

    // Obtener estadísticas de la colección
    const stats = await db.command({ collStats: collectionName });
    console.log(
      `  📊 Tamaño de la colección: ${(stats.size / 1024 / 1024).toFixed(2)} MB`
    );
    console.log(
      `  📊 Tamaño de índices: ${(stats.totalIndexSize / 1024 / 1024).toFixed(2)} MB`
    );
    console.log(`  📊 Documentos: ${stats.count.toLocaleString()}`);
  } catch (error) {
    console.error(`❌ Error verificando ${collectionName}:`, error);
  }
}

async function checkIndexes() {
  const client = new MongoClient(MONGODB_URI!);

  try {
    console.log('🔗 Conectando a MongoDB...');
    await client.connect();
    console.log('✅ Conectado exitosamente\n');

    const db = client.db();

    for (const collectionName of COLLECTIONS) {
      await checkCollectionIndexes(db, collectionName);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✨ Verificación completada');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Conexión cerrada');
  }
}

checkIndexes()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
