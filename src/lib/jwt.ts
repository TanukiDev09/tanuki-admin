import jwt from 'jsonwebtoken';
import { UserResponse } from '@/types/user';

// Clave secreta para firmar tokens (DEBE estar en variables de entorno)
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET must be defined in production environment');
}

// Fallback solo para desarrollo local si no se ha configurado el .env aún, 
// pero lanzaremos un error en producción.
const FINAL_JWT_SECRET = JWT_SECRET || 'development-only-fallback-key';
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

  return jwt.sign(payload, FINAL_JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Verificar y decodificar un JWT token
 * @returns Payload del token si es válido, null si no es válido
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, FINAL_JWT_SECRET) as JWTPayload;
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
