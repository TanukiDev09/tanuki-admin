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
    await dbConnect();

    const { email, password } = await request.json();

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
      return NextResponse.json(
        {
          success: false,
          error: 'Credenciales inválidas',
        },
        { status: 401 }
      );
    }

    // Verificar si el usuario está activo
    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: 'Usuario desactivado',
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
          error: 'Credenciales inválidas',
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
    console.error('Error en login:', error);
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
