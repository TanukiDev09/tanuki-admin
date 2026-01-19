import { Document } from 'mongoose';
import { CreatorResponse } from './creator';

// Interface del modelo de libro (con Document de Mongoose)
export interface IBook extends Document {
  isbn: string;
  title: string;
  authors: string[] | CreatorResponse[]; // IDs or Populated
  translators?: string[] | CreatorResponse[];
  illustrators?: string[] | CreatorResponse[];
  publicationDate: Date;
  genre: string;
  language: string;
  pages: number;
  height?: number;
  width?: number;
  spine?: number;
  weight?: number;
  price: number;
  stock: number;
  description?: string;
  coverImage?: string;
  collectionName?: string;
  costCenter?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// DTO para crear libro
export interface CreateBookDTO {
  isbn: string;
  title: string;
  authors: string[]; // IDs
  translators?: string[]; // IDs
  illustrators?: string[]; // IDs
  publicationDate: Date;
  genre: string;
  language?: string;
  pages: number;
  height?: number;
  width?: number;
  spine?: number;
  weight?: number;
  price: number;
  stock?: number;
  description?: string;
  coverImage?: string;
  collectionName?: string;
  costCenter?: string;
}

// DTO para actualizar libro
export interface UpdateBookDTO {
  isbn?: string;
  title?: string;
  authors?: string[]; // IDs
  translators?: string[];
  illustrators?: string[];
  publicationDate?: Date;
  genre?: string;
  language?: string;
  pages?: number;
  height?: number;
  width?: number;
  spine?: number;
  weight?: number;
  price?: number;
  stock?: number;
  description?: string;
  coverImage?: string;
  collectionName?: string;
  costCenter?: string;
  isActive?: boolean;
}

// Inventory details by warehouse
export interface InventoryByWarehouse {
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  warehouseType: 'main' | 'secondary' | 'point_of_sale';
  quantity: number;
  minStock?: number;
  maxStock?: number;
  inventoryItemId?: string;
}

// Respuesta de libro
export interface BookResponse {
  _id: string;
  isbn: string;
  title: string;
  authors: CreatorResponse[] | string[]; // Can be populated or IDs
  translators?: CreatorResponse[] | string[];
  illustrators?: CreatorResponse[] | string[];
  publicationDate: Date;
  genre: string;
  language: string;
  pages: number;
  height?: number;
  width?: number;
  spine?: number;
  weight?: number;
  price: number;
  stock: number; // Deprecated - use totalStock instead
  description?: string;
  coverImage?: string;
  collectionName?: string;
  costCenter?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Inventory integration fields
  totalStock?: number; // Calculated from all warehouses
  inventoryDetails?: InventoryByWarehouse[]; // Detailed inventory per warehouse
}

// Función helper para sanitizar libro
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function sanitizeBook(book: IBook | Record<string, any>): BookResponse {
  // If it's a mongoose document, convert to object
  const bookObj = book.toObject ? book.toObject() : book;
  return bookObj as BookResponse;
}
