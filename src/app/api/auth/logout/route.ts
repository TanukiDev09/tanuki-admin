import { NextResponse } from 'next/server';
import { removeAuthCookie } from '@/lib/auth-cookies';

/**
 * POST /api/auth/logout
 * Cerrar sesión
 */
export async function POST() {
  await removeAuthCookie();

  return NextResponse.json({
    success: true,
    message: 'Logout exitoso',
  });
}
