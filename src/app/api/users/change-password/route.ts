import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { verifyToken, extractTokenFromHeader } from '@/lib/jwt';
import { getAuthCookie } from '@/lib/auth-cookies';
import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
} from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // 1. Authenticate User
    let token = await getAuthCookie();

    if (!token) {
      const authHeader = request.headers.get('authorization');
      token = extractTokenFromHeader(authHeader) || undefined;
    }

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: No token provided' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }

    // 2. Parse Body
    const body = await request.json();
    const { oldPassword, newPassword } = body;

    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          error: 'Se requieren la contraseña actual y la nueva',
        },
        { status: 400 }
      );
    }

    // 3. Validate New Password Strength
    const validationErrors = validatePasswordStrength(newPassword);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'La nueva contraseña no es segura',
          messages: validationErrors,
        },
        { status: 400 }
      );
    }

    // 4. Get User (explicitly selecting password)
    const user = await User.findById(payload.userId).select('+password');

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // 5. Verify Old Password
    const isMatch = await verifyPassword(oldPassword, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: 'La contraseña actual es incorrecta' },
        { status: 401 }
      );
    }

    // 6. Update Password
    user.password = await hashPassword(newPassword);
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Contraseña actualizada exitosamente',
    });
  } catch (error: unknown) {
    console.error('Error changing password:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
