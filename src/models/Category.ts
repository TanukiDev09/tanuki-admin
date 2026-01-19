import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  description?: string;
  type: string; // 'Ingreso', 'Egreso', 'Ambos'
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre de la categoría es requerido'],
      unique: true,
      trim: true,
      minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
      maxlength: [100, 'El nombre no puede exceder 100 caracteres'],
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['Ingreso', 'Egreso', 'Ambos'],
      default: 'Ambos',
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
CategorySchema.index({ isActive: 1 });
CategorySchema.index({ type: 1 });

export default mongoose.models.Category ||
  mongoose.model<ICategory>('Category', CategorySchema, 'categories');
