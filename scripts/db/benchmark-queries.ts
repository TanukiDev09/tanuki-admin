#!/usr/bin/env tsx
/**
 * Script para realizar benchmarks de consultas MongoDB
 * Mide el tiempo de ejecución de las consultas más comunes
 */

import { MongoClient, Collection, Document, FindOptions } from 'mongodb';
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

interface PlanStage {
  stage?: string;
  indexName?: string;
  inputStage?: PlanStage;
  inputStages?: PlanStage[];
}

interface ExplainResult {
  executionStats?: {
    totalDocsExamined?: number;
    nReturned?: number;
  };
  queryPlanner?: {
    winningPlan?: PlanStage;
  };
}

// Umbral del estándar de release: un COLLSCAN solo es showstopper
// cuando la colección supera los 10.000 documentos examinados.
const COLLSCAN_SHOWSTOPPER_DOCS = 10_000;

// Recorre el árbol de plan (LIMIT → FETCH → IXSCAN, OR, SORT_MERGE, etc.)
function findIndexName(stage?: PlanStage): string | null {
  if (!stage) return null;
  if (stage.indexName) return stage.indexName;
  if (stage.inputStage) {
    const nested = findIndexName(stage.inputStage);
    if (nested) return nested;
  }
  for (const child of stage.inputStages || []) {
    const nested = findIndexName(child);
    if (nested) return nested;
  }
  return null;
}

async function runBenchmark(
  collection: Collection<Document>,
  queryName: string,
  query: Document,
  options?: FindOptions
): Promise<BenchmarkResult> {
  const startTime = Date.now();

  // Ejecutar la consulta
  const cursor = collection.find(query, options || {});
  await cursor.toArray();
  const executionTime = Date.now() - startTime;

  // Obtener plan de ejecución
  const explain = (await collection
    .find(query, options || {})
    .explain('executionStats')) as unknown as ExplainResult;

  const executionStats = explain.executionStats;
  const indexUsed = findIndexName(explain.queryPlanner?.winningPlan);

  return {
    query: queryName,
    collection: collection.collectionName,
    executionTime,
    docsExamined: executionStats?.totalDocsExamined || 0,
    docsReturned: executionStats?.nReturned || 0,
    indexUsed,
    usesIndex: !!indexUsed,
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
      // Un COLLSCAN solo es showstopper cuando la colección es grande.
      // En colecciones pequeñas el optimizador prefiere el scan completo.
      const isShowstopper =
        !result.usesIndex && result.docsExamined > COLLSCAN_SHOWSTOPPER_DOCS;
      const indexIndicator = result.usesIndex
        ? '✅'
        : isShowstopper
          ? '❌'
          : '⚠️ ';
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
      if (!result.usesIndex && !isShowstopper) {
        console.log(
          `   ℹ️  Colección pequeña (≤ ${COLLSCAN_SHOWSTOPPER_DOCS.toLocaleString()} docs): aceptable`
        );
      }
    });

    // Resumen
    const withIndex = results.filter((r) => r.usesIndex).length;
    const showstoppers = results.filter(
      (r) => !r.usesIndex && r.docsExamined > COLLSCAN_SHOWSTOPPER_DOCS
    );
    const acceptableScans = results.filter(
      (r) => !r.usesIndex && r.docsExamined <= COLLSCAN_SHOWSTOPPER_DOCS
    );
    const avgTimeWithIndex =
      results
        .filter((r) => r.usesIndex)
        .reduce((sum, r) => sum + r.executionTime, 0) / (withIndex || 1);
    const avgTimeWithoutIndex =
      results
        .filter((r) => !r.usesIndex)
        .reduce((sum, r) => sum + r.executionTime, 0) /
      (acceptableScans.length + showstoppers.length || 1);

    console.log('\n' + '='.repeat(80));
    console.log('📈 RESUMEN:');
    console.log(`  ✅ Consultas usando índice: ${withIndex}`);
    console.log(
      `  ⚠️  COLLSCAN en colecciones pequeñas (aceptable): ${acceptableScans.length}`
    );
    console.log(
      `  ❌ COLLSCAN showstopper (>10.000 docs): ${showstoppers.length}`
    );
    console.log(
      `  ⏱️  Tiempo promedio con índice: ${avgTimeWithIndex.toFixed(2)}ms`
    );
    console.log(
      `  ⏱️  Tiempo promedio sin índice: ${avgTimeWithoutIndex.toFixed(2)}ms`
    );
    console.log('='.repeat(80));

    if (showstoppers.length > 0) {
      console.error(
        `\n❌ ${showstoppers.length} consulta(s) requieren índice antes del release.`
      );
      process.exitCode = 1;
    } else {
      console.log(
        '\n✅ Ninguna consulta requiere índice: todos los COLLSCAN están en colecciones pequeñas.'
      );
    }
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
