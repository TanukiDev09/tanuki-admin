import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { CreateUserDTO, sanitizeUser } from '@/types/user';
import { hashPassword, validateEmail } from '@/lib/auth';

/**
 * GET /api/users
 * Obtener todos los usuarios (con paginación)
 */
export async function GET(request: NextRequest) {
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
    const query: any = {};
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
  } catch (error: any) {
    console.error('Error al obtener usuarios:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener los usuarios',
        message: error.message,
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

    // Crear usuario
    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      role: role || 'user',
    });

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
  } catch (error: any) {
    console.error('Error al crear usuario:', error);

    // Manejar errores de validación de Mongoose
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(
        (err: any) => err.message
      );
      return NextResponse.json(
        { success: false, error: 'Error de validación', messages },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Error al crear el usuario',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
