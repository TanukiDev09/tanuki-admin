import mongoose, { Schema } from 'mongoose';
import './Creator';
import { IBook } from '@/types/book';

const BookSchema: Schema = new Schema(
  {
    isbn: {
      type: String,
      required: [true, 'El ISBN es requerido'],
      unique: true,
      trim: true,
      match: [
        /^(?:\d{10}|\d{13})$/,
        'Por favor ingrese un ISBN válido (10 o 13 dígitos)',
      ],
    },
    title: {
      type: String,
      required: [true, 'El título es requerido'],
      trim: true,
      minlength: [1, 'El título debe tener al menos 1 carácter'],
      maxlength: [200, 'El título no puede exceder 200 caracteres'],
    },
    authors: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Creator' }],
      default: [],
    },
    translators: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Creator' }],
      default: [],
    },
    illustrators: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Creator' }],
      default: [],
    },
    publicationDate: {
      type: Date,
      required: [true, 'La fecha de publicación es requerida'],
    },
    genre: {
      type: String,
      required: [true, 'El género es requerido'],
      trim: true,
    },
    language: {
      type: String,
      default: 'es',
      trim: true,
    },
    pages: {
      type: Number,
      required: [true, 'El número de páginas es requerido'],
      min: [1, 'El número de páginas debe ser al menos 1'],
    },
    height: {
      type: Number,
      min: [0, 'El alto no puede ser negativo'],
    },
    width: {
      type: Number,
      min: [0, 'El ancho no puede ser negativo'],
    },
    spine: {
      type: Number,
      min: [0, 'El lomo no puede ser negativo'],
    },
    weight: {
      type: Number,
      min: [0, 'El peso no puede ser negativo'],
    },
    price: {
      type: Number,
      required: [true, 'El precio es requerido'],
      min: [0, 'El precio no puede ser negativo'],
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, 'El stock no puede ser negativo'],
    },
    description: {
      type: String,
      trim: true,
    },
    coverImage: {
      type: String,
      trim: true,
    },
    collectionName: {
      type: String,
      trim: true,
    },
    costCenter: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
  }
);

// Índices para mejorar el rendimiento de búsquedas
BookSchema.index({ title: 1 });
BookSchema.index({ genre: 1 });
BookSchema.index({ isActive: 1 });

// Check if model already exists to prevent overwrite error in hot reload
export default mongoose.models.Book ||
  mongoose.model<IBook>('Book', BookSchema, 'books');
