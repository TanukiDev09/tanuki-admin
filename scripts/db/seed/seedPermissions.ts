import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno antes de importar módulos que inicializan Mongoose
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

async function seedPermissions() {
  try {
    console.log('Cargando dependencias...');
    const dbConnect = (await import('../../../src/lib/mongodb')).default;
    const User = (await import('../../../src/models/User')).default;
    const { createDefaultPermissions } = await import('../../../src/lib/permissions');

    console.log('Conectando a MongoDB...');
    await dbConnect();

    console.log('Obteniendo usuarios...');
    const users = await User.find({});

    console.log(`Encontrados ${users.length} usuarios`);

    for (const user of users) {
      console.log(
        `\nProcesando usuario: ${user.name} (${user.email}) - Rol: ${user.role}`
      );

      try {
        await createDefaultPermissions(user._id.toString(), user.role);
        console.log(`✓ Permisos creados para ${user.name}`);
      } catch (error: unknown) {
        const mongoError = error as { code?: number; message?: string };
        if (mongoError.code === 11000) {
          console.log(`○ Permisos ya existen para ${user.name}`);
        } else {
          console.error(
            `✗ Error creando permisos para ${user.name}:`,
            mongoError.message
          );
        }
      }
    }

    console.log('\n✓ Proceso completado');
    process.exit(0);
  } catch (error) {
    console.error('Error sembrando permisos:', error);
    process.exit(1);
  }
}

seedPermissions();

