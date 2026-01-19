import mongoose, { Schema, Document } from 'mongoose';
import './PointOfSale';

export interface IWarehouse extends Document {
  code: string;
  name: string;
  type: 'editorial' | 'pos' | 'general';
  pointOfSaleId?: mongoose.Types.ObjectId;
  address?: string;
  city?: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const WarehouseSchema: Schema = new Schema(
  {
    code: {
      type: String,
      required: [true, 'El código es requerido'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'El nombre es requerido'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['editorial', 'pos', 'general'],
      default: 'general',
      required: true,
    },
    pointOfSaleId: {
      type: Schema.Types.ObjectId,
      ref: 'PointOfSale',
      default: null,
    },
    address: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
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

// Indexes
WarehouseSchema.index({ pointOfSaleId: 1 });
WarehouseSchema.index({ status: 1 });
WarehouseSchema.index({ type: 1 });

export default mongoose.models.Warehouse ||
  mongoose.model<IWarehouse>('Warehouse', WarehouseSchema);
