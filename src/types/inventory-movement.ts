export enum InventoryMovementType {
  INGRESO = 'INGRESO',
  REMISION = 'REMISION',
  DEVOLUCION = 'DEVOLUCION',
  LIQUIDACION = 'LIQUIDACION',
}

export enum InventoryMovementSubType {
  INITIAL = 'INITIAL', // Estado inicial
  UNEXPECTED = 'UNEXPECTED', // Ingreso inesperado
  PURCHASE = 'PURCHASE', // Compra de libros
}

export interface InventoryMovementItem {
  bookId: string | { _id: string; title: string; isbn: string; price: number };
  quantity: number;
}

export interface InventoryMovement {
  _id: string;
  type: InventoryMovementType;
  subType?: InventoryMovementSubType;
  consecutive?: number;
  date: string;
  fromWarehouseId?: string | { _id: string; name: string; type: string };
  toWarehouseId?: string | { _id: string; name: string; type: string };
  items: InventoryMovementItem[];
  financialMovementId?: string;
  invoiceFile?: string;
  invoiceRef?: string;
  observations?: string;
  createdBy?: string | { _id: string; name: string };
  createdAt: string;
  updatedAt: string;
}
