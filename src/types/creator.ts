import { Document } from 'mongoose';

export type CreatorRole = 'author' | 'translator' | 'illustrator';

export interface ICreator extends Document {
  name: string;
  roles: CreatorRole[];
  bio?: string;
  nationality?: string;
  website?: string;
  photo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCreatorDTO {
  name: string;
  roles?: CreatorRole[];
  bio?: string;
  nationality?: string;
  website?: string;
  photo?: string;
}

export interface UpdateCreatorDTO {
  name?: string;
  roles?: CreatorRole[];
  bio?: string;
  nationality?: string;
  website?: string;
  photo?: string;
}

export interface CreatorResponse {
  _id: string;
  name: string;
  roles: CreatorRole[];
  bio?: string;
  nationality?: string;
  website?: string;
  photo?: string;
  createdAt: Date;
  updatedAt: Date;
}
