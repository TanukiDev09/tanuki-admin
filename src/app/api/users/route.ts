import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { CreateUserDTO, sanitizeUser } from '@/types/user';
import { hashPassword, validateEmail } from '@/lib/auth';
import { createDefaultPermissions } from '@/lib/permissions';

interface MongooseValidationErrors {
  errors: Record<string, { message: string }>;
}

/**
 * GET /api/users
 * Obtener todos los usuarios (con paginación)
 */
export async function GET(request: NextRequest) {
  const permissionError = await requirePermission(
    request,
    ModuleName.USERS,
    PermissionAction.READ
  );
  if (permissionError) return permissionError;

  try {
    await dbConnect();

    // Parámetros de paginación
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Filtros opcionales
    const role = searchParams.get('role');
    const isActive = searchParams.get('isActive');

    // Construir query
    const query: Record<string, unknown> = {};
    if (role) query.role = role;
    if (isActive !== null) query.isActive = isActive === 'true';

    // Obtener usuarios
    const users = await User.find(query)
      .select('-password') // Excluir contraseña
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    // Contar total de documentos
    const total = await User.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    console.error('Error al obtener usuarios:', error);
    const message =
      error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener los usuarios',
        message: message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users
 * Crear un nuevo usuario
 */
export async function POST(request: NextRequest) {
  const permissionError = await requirePermission(
    request,
    ModuleName.USERS,
    PermissionAction.CREATE
  );
  if (permissionError) return permissionError;

  try {
    await dbConnect();

    const body: CreateUserDTO = await request.json();
    const { email, password, name, role } = body;

    // Validaciones
    if (!email || !password || !name) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email, contraseña y nombre son requeridos',
        },
        { status: 400 }
      );
    }

    // Validar email
    if (!validateEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Email inválido' },
        { status: 400 }
      );
    }

    // Verificar si el email ya existe
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'El email ya está registrado' },
        { status: 409 }
      );
    }

    // Hashear contraseña
    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      role: role || 'user',
    });

    // Crear permisos por defecto
    await createDefaultPermissions(user._id.toString(), user.role);

    // Sanitizar respuesta
    const userResponse = sanitizeUser(user);

    return NextResponse.json(
      {
        success: true,
        data: userResponse,
        message: 'Usuario creado exitosamente',
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Error al crear usuario:', error);

    // Manejar errores de validación de Mongoose
    if (error instanceof Error && error.name === 'ValidationError') {
      const mongooseError = error as unknown as MongooseValidationErrors;
      const messages = Object.values(mongooseError.errors).map(
        (err) => err.message
      );
      return NextResponse.json(
        { success: false, error: 'Error de validación', messages },
        { status: 400 }
      );
    }

    const message =
      error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      {
        success: false,
        error: 'Error al crear el usuario',
        message: message,
      },
      { status: 500 }
    );
  }
}
