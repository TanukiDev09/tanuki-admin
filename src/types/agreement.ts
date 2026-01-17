import { ICreator } from './creator';
import { IBook } from './book';

export type AgreementRole = 'author' | 'illustrator' | 'translator';
export type AgreementStatus = 'draft' | 'active' | 'terminated';

export interface CreateAgreementDTO {
  book: string;
  creator: string;
  role: AgreementRole;
  royaltyPercentage?: number;
  advancePayment?: number;
  status?: AgreementStatus;
  signedContractUrl?: string;
  validFrom?: Date;
  validUntil?: Date;
  isPublicDomain?: boolean;
}

export interface UpdateAgreementDTO {
  role?: AgreementRole;
  royaltyPercentage?: number;
  advancePayment?: number;
  status?: AgreementStatus;
  signedContractUrl?: string;
  validFrom?: Date;
  validUntil?: Date;
  isPublicDomain?: boolean;
}

export interface AgreementResponse {
  _id: string;
  book: string | IBook; // Puede venir poblado
  creator: string | ICreator; // Puede venir poblado
  role: AgreementRole;
  royaltyPercentage: number;
  advancePayment?: number;
  status: AgreementStatus;
  signedContractUrl?: string;
  validFrom?: string;
  validUntil?: string;
  isPublicDomain?: boolean;
  createdAt: string;
  updatedAt: string;
}
