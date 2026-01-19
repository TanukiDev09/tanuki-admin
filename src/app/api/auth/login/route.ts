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
    const conn = await dbConnect();
    const dbName = conn.connection.db?.databaseName;


    const body = await request.json();
    const { email, password } = body;

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
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      const allUsersCount = await User.countDocuments();
      console.warn(
        `[Login API] User not found: "${email}". Total users count in DB: ${allUsersCount}`
      );

      // Si hay pocos usuarios, podrías querer ver cuáles son (opcional, solo para debug inicial)
      if (allUsersCount > 0 && allUsersCount < 5) {
        const users = await User.find({}, 'email');
      }

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
