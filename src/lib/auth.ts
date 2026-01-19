import bcrypt from 'bcryptjs';

/**
 * Hash de contraseña usando bcrypt
 * @param password - Contraseña en texto plano
 * @returns Contraseña hasheada
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Verifica si una contraseña coincide con su hash
 * @param password - Contraseña en texto plano
 * @param hashedPassword - Contraseña hasheada
 * @returns true si coinciden, false en caso contrario
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    console.log('[Auth Lib] Verifying password...');
    const match = await bcrypt.compare(password, hashedPassword);
    console.log('[Auth Lib] Password match result:', match);
    return match;
  } catch (error) {
    console.error('[Auth Lib] Error comparing passwords:', error);
    return false;
  }
}

/**
 * Valida la fortaleza de una contraseña
 * @param password - Contraseña a validar
 * @returns Array de mensajes de error (vacío si es válida)
 */
export function validatePasswordStrength(password: string): string[] {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra mayúscula');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra minúscula');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('La contraseña debe contener al menos un número');
  }

  return errors;
}

/**
 * Valida formato de email
 * @param email - Email a validar
 * @returns true si es válido, false en caso contrario
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
}
