import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { verifyPassword } from '@/lib/auth';
import { generateToken } from '@/lib/jwt';
import { sanitizeUser } from '@/types/user';
import { setAuthCookie } from '@/lib/auth-cookies';
import { createDefaultPermissions } from '@/lib/permissions';

/**
 * POST /api/auth/login
 * Autenticar usuario y generar token JWT
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[Login API] Starting login process...');
    await dbConnect();
    console.log('[Login API] DB connected');

    const body = await request.json();
    const { email, password } = body;
    console.log('[Login API] Request received for email:', email);

    // Validar campos requeridos
    if (!email || !password) {
      console.warn('[Login API] Missing email or password');
      return NextResponse.json(
        {
          success: false,
          error: 'Email y contraseña son requeridos',
        },
        { status: 400 }
      );
    }

    // Buscar usuario por email
    console.log('[Login API] Searching for user...');
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.warn('[Login API] User not found:', email);
      return NextResponse.json(
        {
          success: false,
          error: 'Credenciales inválidas',
        },
        { status: 401 }
      );
    }
    console.log('[Login API] User found:', user.email, 'Role:', user.role);

    // Verificar si el usuario está activo
    if (!user.isActive) {
      console.warn('[Login API] User is inactive:', email);
      return NextResponse.json(
        {
          success: false,
          error: 'Usuario desactivado',
        },
        { status: 403 }
      );
    }

    // Verificar contraseña
    console.log('[Login API] Verifying password...');
    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      console.warn('[Login API] Invalid password for user:', email);
      return NextResponse.json(
        {
          success: false,
          error: 'Credenciales inválidas',
        },
        { status: 401 }
      );
    }
    console.log('[Login API] Password verified');

    // Actualizar último login
    user.lastLogin = new Date();
    await user.save();
    console.log('[Login API] Last login updated');

    // Asegurar que tenga permisos por defecto creados
    console.log('[Login API] Checking/creating default permissions...');
    await createDefaultPermissions(user._id.toString(), user.role);
    console.log('[Login API] Permissions check completed');

    // Generar token JWT
    console.log('[Login API] Generating token...');
    const userResponse = sanitizeUser(user);
    const token = generateToken(userResponse);
    console.log('[Login API] Token generated');

    // Guardar token en cookie HttpOnly
    console.log('[Login API] Setting auth cookie...');
    await setAuthCookie(token);
    console.log('[Login API] Auth cookie set');

    // Retornar token y datos del usuario (mantener token en body por compatibilidad temporal)
    console.log('[Login API] Login successful');
    return NextResponse.json({
      success: true,
      data: {
        user: userResponse,
        token,
      },
      message: 'Login exitoso',
    });
  } catch (error: unknown) {
    console.error('[Login API] Critical error during login:', error);
    const message =
      error instanceof Error ? error.message : 'Error desconocido';

    return NextResponse.json(
      {
        success: false,
        error: 'Error al procesar el login',
        message: message,
      },
      { status: 500 }
    );
  }
}
