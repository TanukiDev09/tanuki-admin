import mongoose, { Schema } from 'mongoose';
import { IUser, UserRole } from '@/types/user';

const UserSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: [true, 'El email es requerido'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Por favor ingrese un email válido',
      ],
    },
    password: {
      type: String,
      required: [true, 'La contraseña es requerida'],
      minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    },
    name: {
      type: String,
      required: [true, 'El nombre es requerido'],
      trim: true,
      minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
      maxlength: [100, 'El nombre no puede exceder 100 caracteres'],
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
  }
);

// Índices para mejorar el rendimiento de búsquedas
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });

// Método para evitar que se retorne la contraseña en queries por defecto
UserSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.password;
    return ret;
  },
});

// Check if model already exists to prevent overwrite error in hot reload
export default mongoose.models.User ||
  mongoose.model<IUser>('User', UserSchema, 'users');
