import { Document } from 'mongoose';

export type ExternalEntityType =
  | 'Socio'
  | 'Banco'
  | 'Persona Natural'
  | 'Proveedor'
  | 'Otro';

export interface IExternalEntityBase {
  name: string;
  taxId?: string;
  type: ExternalEntityType;
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  status: 'active' | 'inactive';
}

export interface IExternalEntity extends IExternalEntityBase, Document {
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExternalEntityDTO {
  name: string;
  taxId?: string;
  type: ExternalEntityType;
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  status?: 'active' | 'inactive';
}

export type UpdateExternalEntityDTO = Partial<CreateExternalEntityDTO>;

export interface ExternalEntityResponse extends Omit<
  IExternalEntity,
  keyof Document
> {
  _id: string;
}
