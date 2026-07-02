/**
 * Sesión 7 — Importar facturas históricas 2018-2020
 *
 * USO:
 *   npx ts-node scripts/db/insert-historical-invoices.ts ../../../TANUKI/00-TANUKI-SAS/09-Finanzas/Finanzas\ Tanuki/facturas_s7_extract.jsonl
 *
 * O simplemente si estás en D:\TANUKI\...\Finanzas Tanuki:
 *   npx ts-node <path-a-tanuki-admin>/scripts/db/insert-historical-invoices.ts facturas_s7_extract.jsonl
 */

import * as fs from 'fs';
import mongoose from 'mongoose';

interface InvoiceItem {
  type: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  bookId: string;
  costCenter: string;
}

interface CostCenter {
  code: string;
  amount: number;
}

interface Invoice {
  number: string;
  date: Date;
  dueDate?: Date | null;
  customerName: string;
  customerTaxId: string;
  customerDocumentType: string;
  customerAddress: string;
  customerCity: string;
  customerEmail: string;
  customerPhone: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: string;
  salesChannel: string;
  costCenters: CostCenter[];
  movements: Record<string, unknown>[];
  dianData?: Record<string, unknown>;
  cufe?: string;
  fiscalYear: number;
  notes: string;
  newsletterSignup: boolean;
  orderReference: string;
}

const invoiceSchema = new mongoose.Schema<Invoice>(
  {
    number: { type: String, required: true },
    date: { type: Date, required: true },
    dueDate: { type: Date, default: null },
    customerName: { type: String, required: true },
    customerTaxId: String,
    customerDocumentType: String,
    customerAddress: String,
    customerCity: String,
    customerEmail: String,
    customerPhone: String,
    items: [
      {
        type: String,
        description: String,
        quantity: Number,
        unitPrice: Number,
        discount: Number,
        total: Number,
        bookId: String,
        costCenter: String
      }
    ],
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: { type: String, required: true },
    salesChannel: String,
    costCenters: [
      {
        code: String,
        amount: Number
      }
    ],
    movements: [mongoose.Schema.Types.Mixed],
    dianData: mongoose.Schema.Types.Mixed,
    cufe: String,
    fiscalYear: { type: Number, required: true },
    notes: String,
    newsletterSignup: { type: Boolean, default: false },
    orderReference: String
  },
  {
    collection: 'invoices',
    timestamps: true
  }
);

const InvoiceModel = mongoose.model<Invoice>('Invoice', invoiceSchema);

/**
 * Procesa una línea del archivo JSONL e intenta guardarla en la BD
 */
async function processLine(line: string, index: number, total: number) {
  const idx = String(index + 1).padStart(2, '0');
  try {
    const data = JSON.parse(line) as Invoice;
    const invoice = new InvoiceModel(data);
    await invoice.save();

    console.log(`[${idx}/${total}] ✅ ${data.number} - ${data.customerName}`);
    return { success: true, number: data.number };
  } catch (error) {
    let number = 'Unknown';
    let errorMsg = error instanceof Error ? error.message : String(error);

    try {
      const data = JSON.parse(line) as Invoice;
      number = data.number;
    } catch {
      errorMsg = 'Error al parsear JSON';
    }

    console.log(`[${idx}/${total}] ❌ ${number} - ${errorMsg.substring(0, 50)}`);
    return { success: false, number, error: errorMsg };
  }
}

async function insertHistoricalInvoices() {
  try {
    const jsonlPath = process.argv[2];

    if (!jsonlPath) {
      console.error('❌ Uso: npx ts-node scripts/db/insert-historical-invoices.ts <ruta-a-jsonl>');
      console.error(
        '   Ejemplo: npx ts-node scripts/db/insert-historical-invoices.ts ../../../TANUKI/00-TANUKI-SAS/09-Finanzas/Finanzas\\ Tanuki/facturas_s7_extract.jsonl'
      );
      process.exit(1);
    }

    if (!fs.existsSync(jsonlPath)) {
      throw new Error(`Archivo no encontrado: ${jsonlPath}`);
    }

    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tanuki-admin';
    console.log(`📡 Conectando a MongoDB: ${mongoUri}\n`);

    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB\n');

    const jsonlContent = fs.readFileSync(jsonlPath, 'utf-8');
    const lines = jsonlContent.trim().split('\n').filter(line => line.trim());

    console.log(`📋 Insertando ${lines.length} facturas históricas...\n`);

    let insertedCount = 0;
    const errors: Array<{ number: string; error: string }> = [];

    for (let i = 0; i < lines.length; i++) {
      const result = await processLine(lines[i], i, lines.length);
      if (result.success) {
        insertedCount++;
      } else {
        errors.push({ number: result.number, error: result.error || 'Unknown error' });
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ INSERCIÓN COMPLETADA — SESIÓN 7`);
    console.log(`   Insertadas: ${insertedCount}`);
    console.log(`   Errores: ${errors.length}`);
    console.log(`${'='.repeat(60)}\n`);

    if (errors.length > 0) {
      console.log('⚠️ Errores detallados:');
      errors.forEach(e => console.log(`   - ${e.number}: ${e.error.substring(0, 80)}`));
      console.log();
    }

    await mongoose.connection.close();
    console.log('📴 Desconectado de MongoDB\n');

    process.exit(errors.length > 0 ? 1 : 0);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('❌ Error fatal:', msg);
    process.exit(1);
  }
}

insertHistoricalInvoices();


