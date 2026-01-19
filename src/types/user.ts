import { Document } from 'mongoose';

// Enum para roles de usuario
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  VIEWER = 'viewer',
}

// Interface del modelo de usuario (con Document de Mongoose)
export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// DTO para crear usuario
export interface CreateUserDTO {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

// DTO para actualizar usuario
export interface UpdateUserDTO {
  email?: string;
  name?: string;
  role?: UserRole;
  isActive?: boolean;
  password?: string;
}

// Respuesta de usuario (sin contraseña)
export interface UserResponse {
  _id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Función helper para sanitizar usuario
export function sanitizeUser(user: IUser): UserResponse {
  const userObj = user.toObject();
  const { password, ...userWithoutPassword } = userObj;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = password;
  return userWithoutPassword as UserResponse;
}
