import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { verifyToken, extractTokenFromHeader } from '@/lib/jwt';
import { getAuthCookie } from '@/lib/auth-cookies';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/me
 * Obtener información del usuario actual basado en el token JWT
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[Me API] Checking current session...');
    await dbConnect();

    // Extraer token de cookie o header
    let token = await getAuthCookie();
    console.log('[Me API] Token from cookie:', token ? 'Present' : 'Missing');

    if (!token) {
      const authHeader = request.headers.get('authorization');
      token = extractTokenFromHeader(authHeader) || undefined;
      console.log('[Me API] Token from header:', token ? 'Present' : 'Missing');
    }

    if (!token) {
      console.log('[Me API] No token found');
      return NextResponse.json(
        {
          success: false,
          error: 'Token no proporcionado',
        },
        { status: 200 }
      );
    }

    // Verificar token
    console.log('[Me API] Verifying token...');
    const payload = verifyToken(token);

    if (!payload) {
      console.warn('[Me API] Invalid or expired token');
      return NextResponse.json(
        {
          success: false,
          error: 'Token inválido o expirado',
        },
        { status: 200 }
      );
    }
    console.log('[Me API] Token payload:', payload.email, payload.userId);

    // Obtener usuario de la base de datos
    console.log('[Me API] Fetching user from DB...');
    const user = await User.findById(payload.userId).select('-password');

    if (!user) {
      console.warn('[Me API] User not found in DB:', payload.userId);
      return NextResponse.json(
        {
          success: false,
          error: 'Usuario no encontrado',
        },
        { status: 404 }
      );
    }
    console.log('[Me API] User found:', user.email);

    // Verificar si el usuario está activo
    if (!user.isActive) {
      console.warn('[Me API] User is inactive:', user.email);
      return NextResponse.json(
        {
          success: false,
          error: 'Usuario desactivado',
        },
        { status: 403 }
      );
    }

    console.log('[Me API] Session verified successfully');
    return NextResponse.json(
      {
        success: true,
        data: user,
      },
      {
        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error: unknown) {
    console.error('[Me API] Error during session verification:', error);
    const message =
      error instanceof Error ? error.message : 'Error desconocido';

    return NextResponse.json(
      {
        success: false,
        error: 'Error al verificar el token',
        message: message,
      },
      { status: 500 }
    );
  }
}
