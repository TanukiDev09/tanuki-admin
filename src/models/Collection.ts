import mongoose, { Schema, Document } from 'mongoose';

export interface ICollection extends Document {
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CollectionSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre de la colección es requerido'],
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
CollectionSchema.index({ isActive: 1 });

export default mongoose.models.Collection ||
  mongoose.model<ICollection>('Collection', CollectionSchema, 'collections');
