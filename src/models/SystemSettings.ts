import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemSettings extends Document {
  key: string;
  value: unknown;
  description?: string;
  lastUpdatedBy?: mongoose.Types.ObjectId;
}

const SystemSettingsSchema: Schema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    lastUpdatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.SystemSettings ||
  mongoose.model<ISystemSettings>(
    'SystemSettings',
    SystemSettingsSchema,
    'system_settings'
  );
