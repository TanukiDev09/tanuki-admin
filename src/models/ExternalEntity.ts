import mongoose, { Schema } from 'mongoose';
import { IExternalEntity } from '@/types/external-entity';

const ExternalEntitySchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
      index: true,
    },
    taxId: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['Socio', 'Banco', 'Persona Natural', 'Proveedor', 'Otro'],
      default: 'Otro',
    },
    contactInfo: {
      email: { type: String, trim: true },
      phone: { type: String, trim: true },
      address: { type: String, trim: true },
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.ExternalEntity ||
  mongoose.model<IExternalEntity>(
    'ExternalEntity',
    ExternalEntitySchema,
    'external_entities'
  );
