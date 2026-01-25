import { Document } from 'mongoose';

// Enum para nombres de módulos del sistema
export enum ModuleName {
  BOOKS = 'books',
  CREATORS = 'creators',
  COLLECTIONS = 'collections',
  WAREHOUSES = 'warehouses',
  INVENTORY = 'inventory',
  POINTS_OF_SALE = 'points-of-sale',
  FINANCE = 'finance',
  CATEGORIES = 'categories',
  AGREEMENTS = 'agreements',
  USERS = 'users',
  COST_CENTERS = 'costcenters',
  PERMISSIONS = 'permissions',
  INVOICES = 'invoices',
}

// Enum para acciones CRUD
export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
}

// Interface del modelo de Permission (con Document de Mongoose)
export interface IPermission extends Document {
  userId: string; // ObjectId as string
  module: ModuleName;
  actions: PermissionAction[];
  createdAt: Date;
  updatedAt: Date;
}

// DTO para crear permiso
export interface CreatePermissionDTO {
  userId: string;
  module: ModuleName;
  actions: PermissionAction[];
}

// DTO para actualizar permiso
export interface UpdatePermissionDTO {
  actions?: PermissionAction[];
}

// Respuesta de permiso
export interface PermissionResponse {
  _id: string;
  userId: string;
  module: ModuleName;
  actions: PermissionAction[];
  createdAt: Date;
  updatedAt: Date;
}

// Permiso de un módulo para la matriz de UI
export interface ModulePermission {
  module: ModuleName;
  actions: PermissionAction[];
}

// Matriz completa de permisos para UI
export type PermissionMatrix = {
  [key in ModuleName]?: PermissionAction[];
};

// DTO para actualización masiva de permisos de usuario
export interface BulkUpdatePermissionsDTO {
  userId: string;
  permissions: ModulePermission[];
}

// Metadata de módulo para UI
export interface ModuleMetadata {
  name: ModuleName;
  label: string;
  description: string;
}

// Mapa de metadata de módulos
export const MODULE_METADATA: Record<
  ModuleName,
  Omit<ModuleMetadata, 'name'>
> = {
  [ModuleName.BOOKS]: {
    label: 'Catálogo',
    description: 'Gestión de catálogo de libros',
  },
  [ModuleName.CREATORS]: {
    label: 'Creadores',
    description: 'Gestión de autores e ilustradores',
  },
  [ModuleName.COLLECTIONS]: {
    label: 'Colecciones',
    description: 'Gestión de colecciones de libros',
  },
  [ModuleName.WAREHOUSES]: {
    label: 'Bodegas',
    description: 'Gestión de bodegas y almacenes',
  },
  [ModuleName.INVENTORY]: {
    label: 'Inventario',
    description: 'Gestión de inventario y movimientos',
  },
  [ModuleName.POINTS_OF_SALE]: {
    label: 'Puntos de Venta',
    description: 'Gestión de puntos de venta',
  },
  [ModuleName.FINANCE]: {
    label: 'Movimientos',
    description: 'Gestión de movimientos financieros',
  },
  [ModuleName.CATEGORIES]: {
    label: 'Categorías',
    description: 'Gestión de categorías financieras',
  },
  [ModuleName.AGREEMENTS]: {
    label: 'Contratos',
    description: 'Gestión de acuerdos y contratos',
  },
  [ModuleName.USERS]: {
    label: 'Usuarios',
    description: 'Gestión de usuarios del sistema',
  },
  [ModuleName.COST_CENTERS]: {
    label: 'Centros de Costo',
    description: 'Gestión de centros de costo',
  },
  [ModuleName.PERMISSIONS]: {
    label: 'Permisos',
    description: 'Gestión de permisos de usuarios',
  },
  [ModuleName.INVOICES]: {
    label: 'Facturas',
    description: 'Gestión de facturación',
  },
};

// Helper para obtener todas las acciones disponibles
export const ALL_ACTIONS = Object.values(PermissionAction);

// Helper para obtener todos los módulos disponibles
export const ALL_MODULES = Object.values(ModuleName);
