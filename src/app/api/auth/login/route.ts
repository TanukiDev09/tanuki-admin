import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { verifyPassword } from '@/lib/auth';
import { generateToken } from '@/lib/jwt';
import { sanitizeUser } from '@/types/user';
import { setAuthCookie } from '@/lib/auth-cookies';
import { createDefaultPermissions } from '@/lib/permissions';
import rateLimit from '@/lib/rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 500, // Max 500 users per second
});

/**
 * POST /api/auth/login
 * Autenticar usuario y generar token JWT
 */
export async function POST(request: NextRequest) {
  try {
    // Rate Limiting: 5 attempts per minute per IP
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    await limiter.check(5, ip);
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Demasiados intentos. Por favor intente nuevamente en 1 minuto.',
      },
      { status: 429 }
    );
  }

  try {
    await dbConnect();

    const body = await request.json();
    const { email, password } = body;

    // Generic error message to prevent enumeration
    const AUTH_FAILED_MSG = 'Credenciales inválidas';

    // Validar campos requeridos
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email y contraseña son requeridos',
        },
        { status: 400 }
      );
    }

    // Buscar usuario por email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Simulate password check delay to prevent timing attacks (optional but good practice)
      // await verifyPassword('dummy', 'dummyhash');
      return NextResponse.json(
        {
          success: false,
          error: AUTH_FAILED_MSG,
        },
        { status: 401 }
      );
    }

    // Verificar si el usuario está activo
    if (!user.isActive) {
      // Intentionally detailed log for admin debug, but generic response for user
      console.warn(`[Login API] Inactive user login attempt: ${user._id}`);
      return NextResponse.json(
        {
          success: false,
          error: 'Cuenta desactivada. Contacte al administrador.',
        },
        { status: 403 }
      );
    }

    // Verificar contraseña
    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          error: AUTH_FAILED_MSG,
        },
        { status: 401 }
      );
    }

    // Actualizar último login
    user.lastLogin = new Date();
    await user.save();

    // Asegurar que tenga permisos por defecto creados
    await createDefaultPermissions(user._id.toString(), user.role);

    // Generar token JWT
    const userResponse = sanitizeUser(user);
    const token = generateToken(userResponse);

    // Guardar token en cookie HttpOnly
    await setAuthCookie(token);

    // Retornar token y datos del usuario (mantener token en body por compatibilidad temporal)
    return NextResponse.json({
      success: true,
      data: {
        user: userResponse,
        token,
      },
      message: 'Login exitoso',
    });
  } catch (error: unknown) {
    console.error('[Login API] Error during login');
    const message =
      error instanceof Error ? error.message : 'Error desconocido';

    return NextResponse.json(
      {
        success: false,
        error: 'Error al procesar el login',
        message: process.env.NODE_ENV === 'development' ? message : undefined,
      },
      { status: 500 }
    );
  }
}
