#!/usr/bin/env tsx
/**
 * Script para realizar benchmarks de consultas MongoDB
 * Mide el tiempo de ejecución de las consultas más comunes
 */

import { MongoClient } from 'mongodb';
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

interface BenchmarkResult {
  query: string;
  collection: string;
  executionTime: number;
  docsExamined: number;
  docsReturned: number;
  indexUsed: string | null;
  usesIndex: boolean;
}

async function runBenchmark(
  collection: any,
  queryName: string,
  query: any,
  options?: any
): Promise<BenchmarkResult> {
  const startTime = Date.now();

  // Ejecutar la consulta
  const cursor = collection.find(query, options);
  const results = await cursor.toArray();
  const executionTime = Date.now() - startTime;

  // Obtener plan de ejecución
  const explain = await collection
    .find(query, options)
    .explain('executionStats');

  const executionStats = explain.executionStats;

  return {
    query: queryName,
    collection: collection.collectionName,
    executionTime,
    docsExamined: executionStats.totalDocsExamined || 0,
    docsReturned: executionStats.nReturned || 0,
    indexUsed: explain.queryPlanner?.winningPlan?.inputStage?.indexName || null,
    usesIndex: !!explain.queryPlanner?.winningPlan?.inputStage?.indexName,
  };
}

async function benchmark() {
  const client = new MongoClient(MONGODB_URI!);

  try {
    console.log('🔗 Conectando a MongoDB...');
    await client.connect();
    console.log('✅ Conectado exitosamente\n');

    const db = client.db();
    const results: BenchmarkResult[] = [];

    console.log('⏱️  Ejecutando benchmarks...\n');

    // ==================== BOOKS ====================
    console.log('📚 Books - Búsquedas comunes');

    results.push(
      await runBenchmark(
        db.collection('books'),
        'Búsqueda por título (regex)',
        { title: { $regex: 'test', $options: 'i' } }
      )
    );

    results.push(
      await runBenchmark(db.collection('books'), 'Filtro por género y activo', {
        genre: 'Ficción',
        isActive: true,
      })
    );

    results.push(
      await runBenchmark(
        db.collection('books'),
        'Ordenar por fecha de creación',
        {},
        { sort: { createdAt: -1 }, limit: 10 }
      )
    );

    // ==================== INVOICES ====================
    console.log('📄 Invoices - Búsquedas comunes');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    results.push(
      await runBenchmark(
        db.collection('invoices'),
        'Filtro por rango de fechas y estado',
        {
          date: { $gte: thirtyDaysAgo },
          status: { $ne: 'Cancelled' },
        }
      )
    );

    results.push(
      await runBenchmark(
        db.collection('invoices'),
        'Búsqueda por nombre de cliente',
        { customerName: { $regex: 'libreria', $options: 'i' } }
      )
    );

    results.push(
      await runBenchmark(
        db.collection('invoices'),
        'Filtro por centro de costo en items',
        { 'items.costCenter': '01T001' }
      )
    );

    // ==================== MOVEMENTS ====================
    console.log('💰 Movements - Búsquedas comunes');

    results.push(
      await runBenchmark(
        db.collection('movements'),
        'Filtro por tipo y fecha',
        {
          type: 'Ingreso',
          date: { $gte: thirtyDaysAgo },
        }
      )
    );

    results.push(
      await runBenchmark(
        db.collection('movements'),
        'Búsqueda por descripción',
        { description: { $regex: 'venta', $options: 'i' } }
      )
    );

    results.push(
      await runBenchmark(
        db.collection('movements'),
        'Filtro por allocations.costCenter',
        { 'allocations.costCenter': '01T001' }
      )
    );

    // ==================== DEBTS ====================
    console.log('💳 Debts - Búsquedas comunes');

    results.push(
      await runBenchmark(db.collection('debts'), 'Filtro por tipo y estado', {
        type: 'Cuenta por Cobrar',
        status: 'Pendiente',
      })
    );

    // ==================== INVENTORY ITEMS ====================
    console.log('📦 InventoryItems - Búsquedas comunes');

    results.push(
      await runBenchmark(
        db.collection('inventoryitems'),
        'Filtro por bookId',
        { bookId: { $exists: true } },
        { limit: 10 }
      )
    );

    // Mostrar resultados
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESULTADOS DEL BENCHMARK');
    console.log('='.repeat(80));

    results.forEach((result) => {
      const indexIndicator = result.usesIndex ? '✅' : '❌';
      console.log(`\n${indexIndicator} ${result.collection} - ${result.query}`);
      console.log(`   ⏱️  Tiempo: ${result.executionTime}ms`);
      console.log(
        `   📄 Docs examinados: ${result.docsExamined.toLocaleString()}`
      );
      console.log(
        `   📊 Docs retornados: ${result.docsReturned.toLocaleString()}`
      );
      console.log(
        `   🔍 Índice usado: ${result.indexUsed || 'NINGUNO (Collection Scan)'}`
      );
    });

    // Resumen
    const withIndex = results.filter((r) => r.usesIndex).length;
    const withoutIndex = results.filter((r) => !r.usesIndex).length;
    const avgTimeWithIndex =
      results
        .filter((r) => r.usesIndex)
        .reduce((sum, r) => sum + r.executionTime, 0) / (withIndex || 1);
    const avgTimeWithoutIndex =
      results
        .filter((r) => !r.usesIndex)
        .reduce((sum, r) => sum + r.executionTime, 0) / (withoutIndex || 1);

    console.log('\n' + '='.repeat(80));
    console.log('📈 RESUMEN:');
    console.log(`  ✅ Consultas usando índice: ${withIndex}`);
    console.log(`  ❌ Consultas sin índice: ${withoutIndex}`);
    console.log(
      `  ⏱️  Tiempo promedio con índice: ${avgTimeWithIndex.toFixed(2)}ms`
    );
    console.log(
      `  ⏱️  Tiempo promedio sin índice: ${avgTimeWithoutIndex.toFixed(2)}ms`
    );
    console.log('='.repeat(80));
  } catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Conexión cerrada');
  }
}

benchmark()
  .then(() => {
    console.log('\n✨ Benchmark completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
