/**
 * Sesión 7 — Importar facturas históricas 2018-2020
 * Script JavaScript (sin dependencias de TypeScript)
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

async function insertHistoricalInvoices() {
  try {
    const jsonlPath = process.argv[2];

    if (!jsonlPath) {
      console.error('❌ Uso: node insert-historical-invoices.js <ruta-a-jsonl>');
      process.exit(1);
    }

    if (!fs.existsSync(jsonlPath)) {
      throw new Error(`Archivo no encontrado: ${jsonlPath}`);
    }

    // Conectar a MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tanuki-admin';
    console.log(`📡 Conectando a MongoDB: ${mongoUri}\n`);

    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB\n');

    // Definir esquema Invoice
    const invoiceSchema = new mongoose.Schema(
      {},
      {
        strict: false,
        collection: 'invoices',
        timestamps: true
      }
    );

    const Invoice = mongoose.model('Invoice', invoiceSchema);

    // Leer archivo JSONL
    const jsonlContent = fs.readFileSync(jsonlPath, 'utf-8');
    const lines = jsonlContent.trim().split('\n').filter(line => line.trim());

    console.log(`📋 Insertando ${lines.length} facturas históricas...\n`);

    let insertedCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      try {
        const data = JSON.parse(line);
        const invoice = new Invoice(data);
        await invoice.save();

        insertedCount++;
        const idx = String(i + 1).padStart(2, '0');
        console.log(`[${idx}/${lines.length}] ✅ ${data.number} - ${data.customerName}`);
      } catch (error) {
        errorCount++;
        const idx = String(i + 1).padStart(2, '0');
        try {
          const data = JSON.parse(line);
          const errorMsg = error.message ? error.message.substring(0, 50) : String(error);
          console.log(`[${idx}/${lines.length}] ❌ ${data.number} - ${errorMsg}`);
          errors.push({
            number: data.number,
            error: error.message || String(error)
          });
        } catch {
          console.log(`[${idx}/${lines.length}] ❌ Error al parsear JSON`);
        }
      }
    }

    // Resumen
    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ INSERCIÓN COMPLETADA — SESIÓN 7`);
    console.log(`   Insertadas: ${insertedCount}`);
    console.log(`   Errores: ${errorCount}`);
    console.log(`${'='.repeat(60)}\n`);

    if (errors.length > 0) {
      console.log('⚠️ Errores detallados:');
      errors.forEach(e => {
        console.log(`   - ${e.number}: ${e.error.substring(0, 80)}`);
      });
      console.log();
    }

    // Desconectar
    await mongoose.connection.close();
    console.log('📴 Desconectado de MongoDB\n');

    process.exit(errorCount > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Error fatal:', error.message || String(error));
    process.exit(1);
  }
}

insertHistoricalInvoices();
