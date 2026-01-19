import mongoose, { Schema } from 'mongoose';
import { IPermission, ModuleName, PermissionAction } from '@/types/permission';

const PermissionSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El ID de usuario es requerido'],
      index: true,
    },
    module: {
      type: String,
      enum: Object.values(ModuleName),
      required: [true, 'El módulo es requerido'],
      index: true,
    },
    actions: {
      type: [String],
      enum: Object.values(PermissionAction),
      required: [true, 'Las acciones son requeridas'],
      validate: {
        validator: function (actions: string[]) {
          return actions.length > 0;
        },
        message: 'Debe especificar al menos una acción',
      },
    },
  },
  {
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
  }
);

// Índice compuesto para búsquedas eficientes
// Asegura que un usuario solo tenga un documento de permisos por módulo
PermissionSchema.index({ userId: 1, module: 1 }, { unique: true });

// Método para verificar si tiene una acción específica
PermissionSchema.methods.hasAction = function (
  action: PermissionAction
): boolean {
  return this.actions.includes(action);
};

// Método estático para verificar permiso
PermissionSchema.statics.checkPermission = async function (
  userId: string,
  module: ModuleName,
  action: PermissionAction
): Promise<boolean> {
  const permission = await this.findOne({ userId, module });
  return permission ? permission.actions.includes(action) : false;
};

// Método estático para obtener todos los permisos de un usuario
PermissionSchema.statics.getUserPermissions = async function (
  userId: string
): Promise<IPermission[]> {
  return this.find({ userId }).sort({ module: 1 });
};

// Check if model already exists to prevent overwrite error in hot reload
export default mongoose.models.Permission ||
  mongoose.model<IPermission>('Permission', PermissionSchema, 'permissions');
