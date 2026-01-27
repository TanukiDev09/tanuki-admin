export interface Category {
  _id: string;
  name: string;
  description?: string;
  type: 'Ingreso' | 'Egreso' | 'Ambos';
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  totalAmount?: number;
}
