import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { UpdateUserDTO, sanitizeUser } from '@/types/user';
import { hashPassword, validateEmail } from '@/lib/auth';
import mongoose from 'mongoose';

/**
 * GET /api/users/[id]
 * Obtener un usuario por ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      data: user,
    });
  } catch (error: any) {
    console.error('Error al obtener usuario:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener el usuario',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users/[id]
 * Actualizar un usuario
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { email, name, role, isActive, password } = body;

    // Preparar datos a actualizar
    const updateData: any = {};

    if (email) {
      if (!validateEmail(email)) {
        return NextResponse.json(
          { success: false, error: 'Email inválido' },
          { status: 400 }
        );
      }

      // Verificar si el email ya está en uso por otro usuario
      const existingUser = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: id },
      });

      if (existingUser) {
        return NextResponse.json(
          { success: false, error: 'El email ya está registrado' },
          { status: 409 }
        );
      }

      updateData.email = email.toLowerCase();
    }

    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    // Si se proporciona nueva contraseña, hashearla
    if (password) {
      updateData.password = await hashPassword(password);
    }

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
      data: user,
      message: 'Usuario actualizado exitosamente',
    });
  } catch (error: any) {
    console.error('Error al actualizar usuario:', error);

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
        error: 'Error al actualizar el usuario',
        message: error.message,
      },
      { status: 500 }
    );
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
      data: user,
      message: 'Usuario desactivado exitosamente',
    });
  } catch (error: any) {
    console.error('Error al eliminar usuario:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al eliminar el usuario',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
