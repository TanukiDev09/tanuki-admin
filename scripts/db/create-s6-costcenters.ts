#!/usr/bin/env ts-node
/**
 * Script para crear los dos costcenters históricos requeridos por Sesión 6:
 * - 02S004: Universidad EIA (Servicios editoriales 2019-2020)
 * - 02S005: Centro del Japón — Universidad de los Andes (Servicios 2019-2020)
 *
 * Uso: npx ts-node scripts/db/create-s6-costcenters.ts
 */

import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Get __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables (try .env.local first, fall back to .env)
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Import models
const CostCenterSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

interface ICostCenter {
  code: string;
  name: string;
  description: string;
  isActive: boolean;
}

async function createS6CostCenters() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not defined in environment variables');
    }

    console.log('🔗 Conectando a MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Conexión exitosa');

    // Define CostCenter model
    const CostCenter =
      mongoose.models.CostCenter ||
      mongoose.model<ICostCenter>('CostCenter', CostCenterSchema, 'costcenters');

    // Data to insert
    const newCostCenters: ICostCenter[] = [
      {
        code: '02S004',
        name: 'Universidad EIA',
        description:
          'Servicios editoriales outsourceados (2019-2020): Reflexiones sobre el territorio, Aventuras de un pajarero en Colombia, Apuntes de clase de ordenamiento territorial',
        isActive: true,
      },
      {
        code: '02S005',
        name: 'Centro del Japón — Universidad de los Andes',
        description:
          'Servicios: Charlas informativas y eventos (2019-2020). Posibles compras de libros bajo este CC conservadoramente.',
        isActive: true,
      },
    ];

    // Insert with error handling for duplicates
    for (const cc of newCostCenters) {
      const existing = await CostCenter.findOne({ code: cc.code });
      if (existing) {
        console.log(`⏭️  ${cc.code} ya existe — skipping`);
      } else {
        await CostCenter.create(cc);
        console.log(`✅ Creado: ${cc.code} — ${cc.name}`);
      }
    }

    // Verify
    const count = await CostCenter.countDocuments({
      code: { $in: ['02S004', '02S005'] },
    });
    console.log(`\n✅ Total costcenters S6 en DB: ${count}`);

    await mongoose.connection.close();
    console.log('🔌 Desconexión completada');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createS6CostCenters();
