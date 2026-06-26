#!/usr/bin/env node
/**
 * Script simple para insertar facturas JSONL en MongoDB
 * Evita problemas de parseo de TypeScript
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const mongoose = require('mongoose');

// Invoice schema
const invoiceSchema = new mongoose.Schema({
  number: String,
  date: Date,
  dueDate: Date,
  customerName: String,
  customerTaxId: String,
  customerDocumentType: String,
  customerAddress: String,
  customerCity: String,
  customerEmail: String,
  customerPhone: String,
  items: [{
    type: { type: String },
    description: String,
    quantity: Number,
    unitPrice: Number,
    discount: Number,
    total: Number,
    bookId: String,
    costCenter: String,
  }],
  subtotal: Number,
  tax: Number,
  discount: Number,
  total: Number,
  status: String,
  salesChannel: String,
  costCenters: [{
    code: String,
    amount: Number,
  }],
  movements: [mongoose.Schema.Types.ObjectId],
  fiscalYear: Number,
  notes: String,
  newsletterSignup: Boolean,
  orderReference: String,
}, { collection: 'invoices', timestamps: false });

async function insertInvoices() {
  const jsonlPath = process.argv[2];

  if (!jsonlPath) {
    console.error('❌ Uso: node insert-invoices-simple.js <ruta-a-archivo.jsonl>');
    process.exit(1);
  }

  if (!fs.existsSync(jsonlPath)) {
    console.error(`❌ Archivo no encontrado: ${jsonlPath}`);
    process.exit(1);
  }

  try {
    console.log('🔗 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const Invoice = mongoose.model('Invoice', invoiceSchema, 'invoices');

    const fileStream = fs.createReadStream(jsonlPath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let count = 0;
    let errors = [];

    for await (const line of rl) {
      if (!line.trim()) continue;

      try {
        const data = JSON.parse(line);
        await Invoice.create(data);
        count++;
        console.log(`✅ [${count}] Insertada factura: ${data.number}`);
      } catch (err) {
        errors.push({
          line: count + 1,
          error: err.message,
          data: line.substring(0, 50),
        });
        console.error(`❌ [${count + 1}] Error: ${err.message}`);
      }
    }

    console.log(`\n✅ INSERCIÓN COMPLETADA`);
    console.log(`   Total insertadas: ${count}`);
    console.log(`   Total errores: ${errors.length}`);

    if (errors.length > 0) {
      console.log(`\n⚠️  Primeros 5 errores:`);
      errors.slice(0, 5).forEach(e => {
        console.log(`   Línea ${e.line}: ${e.error}`);
      });
    }

    await mongoose.connection.close();
    console.log('🔌 Desconectado de MongoDB');
    process.exit(errors.length > 0 ? 1 : 0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

insertInvoices();
