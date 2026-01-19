# Módulo de Usuarios - Tanuki Admin

Módulo completo de gestión de usuarios implementado con MongoDB y Mongoose para la aplicación Tanuki Admin.

## 📁 Estructura de Archivos

```
src/
├── models/
│   └── User.ts                 # Modelo de Mongoose para usuarios
├── types/
│   └── user.ts                 # Interfaces y DTOs de TypeScript
├── lib/
│   └── auth.ts                 # Utilidades de autenticación
└── app/api/users/
    ├── route.ts                # GET (listar) y POST (crear)
    └── [id]/route.ts           # GET, PUT, DELETE por ID
```

## 📊 Modelo de Usuario

### Campos

| Campo       | Tipo    | Requerido | Descripción                                      |
| ----------- | ------- | --------- | ------------------------------------------------ |
| `email`     | String  | ✓         | Email único (lowercase, validado)                |
| `password`  | String  | ✓         | Contraseña hasheada con bcrypt                   |
| `name`      | String  | ✓         | Nombre completo del usuario                      |
| `role`      | Enum    | ✓         | Rol: `admin`, `user`, `viewer` (default: `user`) |
| `isActive`  | Boolean | ✓         | Estado del usuario (default: `true`)             |
| `lastLogin` | Date    | -         | Fecha del último inicio de sesión                |
| `createdAt` | Date    | ✓         | Fecha de creación (automático)                   |
| `updatedAt` | Date    | ✓         | Fecha de última actualización (automático)       |

### Validaciones

- **Email**: Formato válido, único, convertido a minúsculas
- **Password**: Mínimo 6 caracteres, hasheada con bcrypt (10 rounds)
- **Name**: Entre 2 y 100 caracteres

### Índices

- `email` (único)
- `role`
- `isActive`

## 🔐 Utilidades de Autenticación

### Funciones disponibles (`src/lib/auth.ts`)

```typescript
// Hash de contraseña
hashPassword(password: string): Promise<string>

// Verificar contraseña
verifyPassword(password: string, hashedPassword: string): Promise<boolean>

// Validar fortaleza de contraseña
validatePasswordStrength(password: string): string[]

// Validar email
validateEmail(email: string): boolean
```

## 🛣️ API Endpoints

### Base URL: `/api/users`

#### 1. **GET /api/users** - Listar usuarios

**Query Parameters:**

- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Elementos por página (default: 10)
- `role` (opcional): Filtrar por rol
- `isActive` (opcional): Filtrar por estado (`true`/`false`)

**Respuesta exitosa (200):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "email": "usuario@example.com",
      "name": "Juan Pérez",
      "role": "user",
      "isActive": true,
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

#### 2. **POST /api/users** - Crear usuario

**Request Body:**

```json
{
  "email": "nuevo@example.com",
  "password": "ContraseñaSegura123",
  "name": "María García",
  "role": "user" // opcional, default: "user"
}
```

**Respuesta exitosa (201):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "nuevo@example.com",
    "name": "María García",
    "role": "user",
    "isActive": true,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  },
  "message": "Usuario creado exitosamente"
}
```

**Errores:**

- `400`: Campos requeridos faltantes o email inválido
- `409`: Email ya registrado

#### 3. **GET /api/users/[id]** - Obtener usuario

**Respuesta exitosa (200):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "usuario@example.com",
    "name": "Juan Pérez",
    "role": "user",
    "isActive": true,
    "lastLogin": "2024-01-15T09:30:00.000Z",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Errores:**

- `400`: ID inválido
- `404`: Usuario no encontrado

#### 4. **PUT /api/users/[id]** - Actualizar usuario

**Request Body (todos los campos son opcionales):**

```json
{
  "email": "nuevo-email@example.com",
  "name": "Nuevo Nombre",
  "role": "admin",
  "isActive": false,
  "password": "NuevaContraseña123"
}
```

**Respuesta exitosa (200):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "nuevo-email@example.com",
    "name": "Nuevo Nombre",
    "role": "admin",
    "isActive": false,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  },
  "message": "Usuario actualizado exitosamente"
}
```

**Errores:**

- `400`: ID o email inválido
- `404`: Usuario no encontrado
- `409`: Email ya registrado por otro usuario

#### 5. **DELETE /api/users/[id]** - Desactivar usuario

**Nota**: Implementa soft delete (marca como inactivo) en lugar de eliminar.

**Respuesta exitosa (200):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "usuario@example.com",
    "name": "Juan Pérez",
    "role": "user",
    "isActive": false,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  },
  "message": "Usuario desactivado exitosamente"
}
```

**Errores:**

- `400`: ID inválido
- `404`: Usuario no encontrado

## 🔒 Seguridad

1. **Contraseñas**: Siempre se hashean con bcrypt antes de guardar
2. **Respuestas**: La contraseña nunca se incluye en las respuestas de la API
3. **Validación**: Emails y datos se validan antes de guardar
4. **Soft Delete**: Los usuarios se marcan como inactivos en lugar de eliminarse

## 💡 Ejemplos de Uso

### Con JavaScript/Fetch

```javascript
// Crear usuario
const response = await fetch('http://localhost:3000/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'Password123',
    name: 'Test User',
  }),
});
const data = await response.json();

// Listar usuarios (página 1, 10 por página)
const users = await fetch('http://localhost:3000/api/users?page=1&limit=10');
const usersData = await users.json();

// Actualizar usuario
const updateResponse = await fetch(
  'http://localhost:3000/api/users/507f1f77bcf86cd799439011',
  {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Nuevo Nombre',
    }),
  }
);
```

### Con cURL

```bash
# Crear usuario
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123","name":"Test User"}'

# Listar usuarios
curl http://localhost:3000/api/users?page=1&limit=10

# Obtener usuario específico
curl http://localhost:3000/api/users/507f1f77bcf86cd799439011

# Actualizar usuario
curl -X PUT http://localhost:3000/api/users/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -d '{"name":"Nuevo Nombre"}'

# Desactivar usuario
curl -X DELETE http://localhost:3000/api/users/507f1f77bcf86cd799439011
```

## 📝 Tipos TypeScript

### Interfaces disponibles (`src/types/user.ts`)

```typescript
// Enum de roles
enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  VIEWER = 'viewer',
}

// Interface del modelo
interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// DTO para crear usuario
interface CreateUserDTO {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

// DTO para actualizar usuario
interface UpdateUserDTO {
  email?: string;
  name?: string;
  role?: UserRole;
  isActive?: boolean;
  password?: string;
}

// Respuesta sin contraseña
interface UserResponse {
  _id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Función helper
function sanitizeUser(user: IUser): UserResponse;
```

## 🚀 Próximos Pasos (Opcionales)

- [ ] Implementar autenticación JWT
- [ ] Agregar sistema de permisos basado en roles
- [ ] Implementar recuperación de contraseña
- [ ] Agregar verificación de email
- [ ] Crear componentes de UI para gestión de usuarios
- [ ] Implementar logging de actividades de usuarios
- [ ] Agregar pruebas unitarias y E2E

## 📦 Dependencias

- **mongoose**: ODM para MongoDB
- **bcryptjs**: Hash de contraseñas
- **next**: Framework de React con API routes
