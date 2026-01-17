import { Document } from 'mongoose';

export interface ICreator extends Document {
  name: string;
  bio?: string;
  nationality?: string;
  website?: string;
  photo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCreatorDTO {
  name: string;
  bio?: string;
  nationality?: string;
  website?: string;
  photo?: string;
}

export interface UpdateCreatorDTO {
  name?: string;
  bio?: string;
  nationality?: string;
  website?: string;
  photo?: string;
}

export interface CreatorResponse {
  _id: string;
  name: string;
  bio?: string;
  nationality?: string;
  website?: string;
  photo?: string;
  createdAt: Date;
  updatedAt: Date;
}
