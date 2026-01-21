import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SystemSettings from '@/models/SystemSettings';
import { requirePermission, getUserIdFromRequest } from '@/lib/apiPermissions';
import User from '@/models/User';
import { ModuleName, PermissionAction } from '@/types/permission';
import { UserRole } from '@/types/user';

const SETTINGS_KEY = 'editorial_data';

// Default values if no settings are found
const DEFAULT_EDITORIAL_DATA = {
  name: 'EDITORIAL TANUKI SAS',
  nit: '901.624.469-6',
  address: 'Calle 45 # 21 - 34',
  city: 'Bogotá',
  phone: '',
  email: '',
  website: '',
};

export async function GET(req: NextRequest) {
  try {
    const authError = await requirePermission(
      req,
      ModuleName.USERS,
      PermissionAction.READ
    );
    if (authError) return authError;

    await dbConnect();
    const settings = await SystemSettings.findOne({ key: SETTINGS_KEY });

    return NextResponse.json({
      data: settings?.value || DEFAULT_EDITORIAL_DATA,
    });
  } catch (error) {
    console.error('Error fetching editorial settings:', error);
    return NextResponse.json(
      { error: 'Error al obtener la configuración de la editorial' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // Strict admin check for updates
    const authError = await requirePermission(
      req,
      ModuleName.USERS,
      PermissionAction.UPDATE
    );
    if (authError) return authError;

    // Additional check to ensure it's specifically an ADMIN role
    const userId = await getUserIdFromRequest(req);
    const user = userId ? await User.findById(userId) : null;

    if (!user || user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Solo los administradores pueden modificar estos datos' },
        { status: 403 }
      );
    }

    const body = await req.json();
    await dbConnect();

    const settings = await SystemSettings.findOneAndUpdate(
      { key: SETTINGS_KEY },
      {
        value: body,
        lastUpdatedBy: user._id,
      },
      { upsert: true, new: true, runValidators: true }
    );

    return NextResponse.json({
      message: 'Configuración actualizada correctamente',
      data: settings.value,
    });
  } catch (error) {
    console.error('Error updating editorial settings:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la configuración de la editorial' },
      { status: 500 }
    );
  }
}
