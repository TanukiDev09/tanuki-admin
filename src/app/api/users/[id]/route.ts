import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/apiPermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { UpdateUserDTO, sanitizeUser } from '@/types/user';
import { hashPassword, validateEmail } from '@/lib/auth';
import mongoose from 'mongoose';

interface MongooseValidationErrors {
  errors: Record<string, { message: string }>;
}

/**
 * GET /api/users/[id]
 * Obtener un usuario por ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permissionError = await requirePermission(
    request,
    ModuleName.USERS,
    PermissionAction.READ
  );
  if (permissionError) return permissionError;

  try {
    await dbConnect();

    const { id } = await params;

    // Validar formato de ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'ID de usuario inválido' },
        { status: 400 }
      );
    }

    const user = await User.findById(id).select('-password');

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: sanitizeUser(user),
    });
  } catch (error: unknown) {
    console.error('Error al obtener usuario:', error);
    const message =
      error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener el usuario',
        message: message,
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users/[id]
 * Actualizar un usuario
 */
async function prepareUpdateData(body: UpdateUserDTO, id: string) {
  const { email, name, role, isActive, password } = body;
  const updateData: Record<string, unknown> = {};

  if (email) {
    if (!validateEmail(email)) {
      throw new Error('Email inválido');
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase(),
      _id: { $ne: id },
    });

    if (existingUser) {
      throw new Error('El email ya está registrado');
    }
    updateData.email = email.toLowerCase();
  }

  if (name) updateData.name = name;
  if (role) updateData.role = role;
  if (typeof isActive === 'boolean') updateData.isActive = isActive;
  if (password) {
    updateData.password = await hashPassword(password);
  }

  return updateData;
}

function handleUserError(error: unknown) {
  console.error('Error al actualizar/eliminar usuario:', error);

  if (error instanceof Error && error.name === 'ValidationError') {
    const mongooseError = error as unknown as MongooseValidationErrors;
    const messages = Object.values(mongooseError.errors || {}).map(
      (err) => err.message
    );
    return NextResponse.json(
      { success: false, error: 'Error de validación', messages },
      { status: 400 }
    );
  }

  const message = error instanceof Error ? error.message : 'Error desconocido';

  if (message === 'Email inválido') {
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
  if (message === 'El email ya está registrado') {
    return NextResponse.json(
      { success: false, error: message },
      { status: 409 }
    );
  }
  if (message === 'ID de usuario inválido') {
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      success: false,
      error: 'Error al procesar la solicitud',
      message: message,
    },
    { status: 500 }
  );
}
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permissionError = await requirePermission(
    request,
    ModuleName.USERS,
    PermissionAction.UPDATE
  );
  if (permissionError) return permissionError;

  try {
    await dbConnect();

    const { id } = await params;

    // Validar formato de ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'ID de usuario inválido' },
        { status: 400 }
      );
    }

    const body: UpdateUserDTO = await request.json();
    const updateData = await prepareUpdateData(body, id);

    // Actualizar usuario
    const user = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: sanitizeUser(user),
      message: 'Usuario actualizado exitosamente',
    });
  } catch (error: unknown) {
    return handleUserError(error);
  }
}

/**
 * DELETE /api/users/[id]
 * Eliminar un usuario (soft delete - marca como inactivo)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permissionError = await requirePermission(
    request,
    ModuleName.USERS,
    PermissionAction.DELETE
  );
  if (permissionError) return permissionError;

  try {
    await dbConnect();

    const { id } = await params;

    // Validar formato de ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'ID de usuario inválido' },
        { status: 400 }
      );
    }

    // Soft delete: marcar como inactivo en lugar de eliminar
    const user = await User.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: sanitizeUser(user),
      message: 'Usuario desactivado exitosamente',
    });
  } catch (error: unknown) {
    console.error('Error al eliminar usuario:', error);
    const message =
      error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      {
        success: false,
        error: 'Error al eliminar el usuario',
        message: message,
      },
      { status: 500 }
    );
  }
}
