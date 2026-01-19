import mongoose, { Schema, Document } from 'mongoose';

export interface ICostCenter extends Document {
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CostCenterSchema: Schema = new Schema(
  {
    code: {
      type: String,
      required: [true, 'El código del centro de costo es requerido'],
      unique: true,
      trim: true,
      uppercase: true,
      minlength: [2, 'El código debe tener al menos 2 caracteres'],
      maxlength: [20, 'El código no puede exceder 20 caracteres'],
    },
    name: {
      type: String,
      required: [true, 'El nombre del centro de costo es requerido'],
      unique: true,
      trim: true,
      minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
      maxlength: [100, 'El nombre no puede exceder 100 caracteres'],
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Índices
CostCenterSchema.index({ isActive: 1 });

export default mongoose.models.CostCenter ||
  mongoose.model<ICostCenter>('CostCenter', CostCenterSchema, 'costcenters');
