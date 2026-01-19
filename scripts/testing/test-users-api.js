/**
 * Script de prueba para el módulo de usuarios
 *
 * Uso: node scripts/test-users-api.js
 *
 * Asegúrate de que el servidor esté corriendo: npm run dev
 */

const BASE_URL = 'http://localhost:3000/api/users';

// Colores para la consola
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testAPI() {
  let createdUserId = null;

  try {
    log('\n🚀 Iniciando pruebas del API de usuarios\n', colors.blue);

    // Test 1: Crear usuario
    log('1️⃣  Test: Crear usuario nuevo...', colors.yellow);
    const createResponse = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `test${Date.now()}@example.com`,
        password: 'Password123',
        name: 'Usuario de Prueba',
        role: 'user',
      }),
    });

    const createData = await createResponse.json();

    if (createResponse.ok && createData.success) {
      createdUserId = createData.data._id;
      log('✅ Usuario creado exitosamente', colors.green);
      log(`   ID: ${createdUserId}`, colors.reset);
      log(`   Email: ${createData.data.email}`, colors.reset);
    } else {
      log(`❌ Error al crear usuario: ${createData.error}`, colors.red);
    }

    // Test 2: Listar usuarios
    log('\n2️⃣  Test: Listar usuarios...', colors.yellow);
    const listResponse = await fetch(`${BASE_URL}?page=1&limit=5`);
    const listData = await listResponse.json();

    if (listResponse.ok && listData.success) {
      log('✅ Usuarios listados exitosamente', colors.green);
      log(`   Total de usuarios: ${listData.pagination.total}`, colors.reset);
      log(`   Usuarios en esta página: ${listData.data.length}`, colors.reset);
    } else {
      log(`❌ Error al listar usuarios: ${listData.error}`, colors.red);
    }

    if (!createdUserId) {
      log('\n⚠️  No se puede continuar sin un ID de usuario', colors.yellow);
      return;
    }

    // Test 3: Obtener usuario por ID
    log('\n3️⃣  Test: Obtener usuario por ID...', colors.yellow);
    const getResponse = await fetch(`${BASE_URL}/${createdUserId}`);
    const getData = await getResponse.json();

    if (getResponse.ok && getData.success) {
      log('✅ Usuario obtenido exitosamente', colors.green);
      log(`   Nombre: ${getData.data.name}`, colors.reset);
      log(`   Email: ${getData.data.email}`, colors.reset);
    } else {
      log(`❌ Error al obtener usuario: ${getData.error}`, colors.red);
    }

    // Test 4: Actualizar usuario
    log('\n4️⃣  Test: Actualizar usuario...', colors.yellow);
    const updateResponse = await fetch(`${BASE_URL}/${createdUserId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Usuario Actualizado',
      }),
    });
    const updateData = await updateResponse.json();

    if (updateResponse.ok && updateData.success) {
      log('✅ Usuario actualizado exitosamente', colors.green);
      log(`   Nuevo nombre: ${updateData.data.name}`, colors.reset);
    } else {
      log(`❌ Error al actualizar usuario: ${updateData.error}`, colors.red);
    }

    // Test 5: Eliminar usuario (soft delete)
    log('\n5️⃣  Test: Desactivar usuario...', colors.yellow);
    const deleteResponse = await fetch(`${BASE_URL}/${createdUserId}`, {
      method: 'DELETE',
    });
    const deleteData = await deleteResponse.json();

    if (deleteResponse.ok && deleteData.success) {
      log('✅ Usuario desactivado exitosamente', colors.green);
      log(`   Estado activo: ${deleteData.data.isActive}`, colors.reset);
    } else {
      log(`❌ Error al desactivar usuario: ${deleteData.error}`, colors.red);
    }

    // Test 6: Validación - Email duplicado
    log('\n6️⃣  Test: Validación - Email duplicado...', colors.yellow);
    const duplicateResponse = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: createData.data.email, // Usar el mismo email del primer usuario
        password: 'Password123',
        name: 'Usuario Duplicado',
      }),
    });

    const duplicateData = await duplicateResponse.json();

    if (duplicateResponse.status === 409) {
      log(
        '✅ Validación funcionando correctamente (email duplicado rechazado)',
        colors.green
      );
    } else {
      log(`❌ La validación no funcionó como esperado`, colors.red);
    }

    log('\n✨ Pruebas completadas!\n', colors.blue);
  } catch (error) {
    log(`\n❌ Error general: ${error.message}`, colors.red);
    log(
      '⚠️  Asegúrate de que el servidor esté corriendo (npm run dev)\n',
      colors.yellow
    );
  }
}

// Ejecutar pruebas
testAPI();
