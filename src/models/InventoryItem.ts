import mongoose, { Schema, Document } from 'mongoose';
import './Warehouse';
import './Book';

export interface IInventoryItem extends Document {
  warehouseId: mongoose.Types.ObjectId;
  bookId: mongoose.Types.ObjectId;
  quantity: number;
  minStock?: number;
  maxStock?: number;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryItemSchema: Schema = new Schema(
  {
    warehouseId: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: [true, 'La bodega es requerida'],
    },
    bookId: {
      type: Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'El libro es requerido'],
    },
    quantity: {
      type: Number,
      required: [true, 'La cantidad es requerida'],
      min: [0, 'La cantidad no puede ser negativa'],
      default: 0,
    },
    minStock: {
      type: Number,
      min: [0, 'El stock mínimo no puede ser negativo'],
    },
    maxStock: {
      type: Number,
      min: [0, 'El stock máximo no puede ser negativo'],
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// Compound unique index to ensure one record per warehouse-book combination
InventoryItemSchema.index({ warehouseId: 1, bookId: 1 }, { unique: true });
InventoryItemSchema.index({ bookId: 1 });
InventoryItemSchema.index({ quantity: 1 });

// Update lastUpdated before saving
InventoryItemSchema.pre('save', function () {
  this.lastUpdated = new Date();
});

export default mongoose.models.InventoryItem ||
  mongoose.model<IInventoryItem>('InventoryItem', InventoryItemSchema);
