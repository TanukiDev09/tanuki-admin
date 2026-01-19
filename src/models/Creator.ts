import mongoose, { Schema } from 'mongoose';
import { ICreator } from '@/types/creator';

const CreatorSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
      index: true,
    },
    bio: {
      type: String,
      trim: true,
    },
    nationality: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    photo: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Índices
// (name is already indexed in-line)

export default mongoose.models.Creator ||
  mongoose.model<ICreator>('Creator', CreatorSchema, 'creators');
