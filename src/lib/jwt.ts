import jwt from 'jsonwebtoken';
import { UserResponse } from '@/types/user';

// Clave secreta para firmar tokens (en producción usar variable de entorno)
const JWT_SECRET = process.env.JWT_SECRET || 'tanuki-admin-secret-key-2024';
const JWT_EXPIRES_IN = '7d'; // Token válido por 7 días

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Generar un JWT token para un usuario
 */
export function generateToken(user: UserResponse): string {
  const payload: JWTPayload = {
    userId: user._id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Verificar y decodificar un JWT token
 * @returns Payload del token si es válido, null si no es válido
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Decodificar un token sin verificar (útil para debugging)
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Extraer el token del header Authorization
 */
export function extractTokenFromHeader(
  authHeader: string | null
): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}
