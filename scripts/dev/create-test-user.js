/**
 * Script para crear un usuario de prueba para login
 *
 * Uso: node scripts/create-test-user.js
 */

const BASE_URL = 'http://localhost:3000/api/users';

async function createTestUser() {
  try {
    console.log('🔐 Creando usuario de prueba...\n');

    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@tanuki.com',
        password: 'admin123',
        name: 'Administrador Tanuki',
        role: 'admin',
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Usuario creado exitosamente!');
      console.log('\n📧 Email:', data.data.email);
      console.log('🔑 Password: admin123');
      console.log('👤 Nombre:', data.data.name);
      console.log('🎭 Rol:', data.data.role);
      console.log('\n🚀 Ya puedes hacer login en http://localhost:3000');
    } else {
      if (response.status === 409) {
        console.log('⚠️  El usuario ya existe');
        console.log('\n📧 Email: admin@tanuki.com');
        console.log('🔑 Password: admin123');
        console.log('\n🚀 Puedes hacer login en http://localhost:3000');
      } else {
        console.log('❌ Error:', data.error);
      }
    }
  } catch (error) {
    console.error('❌ Error al crear usuario:', error.message);
    console.log(
      '⚠️  Asegúrate de que el servidor esté corriendo (npm run dev)'
    );
  }
}

createTestUser();
