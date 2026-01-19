import mongoose, { Schema, Document } from 'mongoose';
import './Warehouse';

export interface IPointOfSale extends Document {
  name: string;
  code: string;
  identificationType?: 'NIT' | 'CC' | 'CE' | 'TI' | 'PP';
  identificationNumber?: string;
  address?: string;
  city?: string;
  phones: string[];
  emails: string[];
  managers: string[];
  warehouseId?: mongoose.Types.ObjectId;
  status: 'active' | 'inactive';
  type: 'physical' | 'online' | 'event';
  discountPercentage?: number;
  createdAt: Date;
  updatedAt: Date;
}

const PointOfSaleSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre es requerido'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'El código es requerido'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    identificationType: {
      type: String,
      enum: ['NIT', 'CC', 'CE', 'TI', 'PP'],
      trim: true,
    },
    identificationNumber: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    phones: {
      type: [String],
      default: [],
    },
    emails: {
      type: [String],
      default: [],
    },
    managers: {
      type: [String],
      default: [],
    },
    warehouseId: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    type: {
      type: String,
      enum: ['physical', 'online', 'event'],
      default: 'physical',
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
PointOfSaleSchema.index({ status: 1 });
PointOfSaleSchema.index({ identificationNumber: 1 });

export default mongoose.models.PointOfSale ||
  mongoose.model<IPointOfSale>('PointOfSale', PointOfSaleSchema);
