# Módulo de Catálogo - Tanuki Admin

Módulo completo de gestión de catálogo de libros implementado con MongoDB y Mongoose para la aplicación Tanuki Admin.

## 📁 Estructura de Archivos

```
src/
├── models/
│   └── Book.ts                 # Modelo de Mongoose para libros
├── types/
│   └── book.ts                 # Interfaces y DTOs de TypeScript
├── app/api/books/
│   ├── route.ts                # GET (listar) y POST (crear)
│   └── [id]/route.ts           # GET, PUT, DELETE por ID
├── app/dashboard/catalogo/
│   └── page.tsx                # Página principal del catálogo
└── components/admin/
    ├── BookManagementTable.tsx # Tabla de gestión
    ├── CreateBookModal.tsx     # Modal para crear
    └── EditBookModal.tsx       # Modal para editar
```

## 📊 Modelo de Libro

### Campos

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `isbn` | String | ✓ | ISBN único (10 o 13 dígitos) |
| `title` | String | ✓ | Título del libro (1-200 caracteres) |
| `author` | String | ✓ | Autor principal (mínimo 2 caracteres) |
| `coauthors` | Array\<String\> | - | Lista de coautores |
| `publicationDate` | Date | ✓ | Fecha de publicación |
| `genre` | String | ✓ | Género/categoría del libro |
| `language` | String | ✓ | Idioma (default: 'es') |
| `pages` | Number | ✓ | Número de páginas (mínimo 1) |
| `price` | Number | ✓ | Precio de venta (no negativo) |
| `stock` | Number | ✓ | Cantidad en inventario (default: 0) |
| `description` | String | - | Sinopsis o descripción |
| `coverImage` | String | - | URL de la imagen de portada |
| `isActive` | Boolean | ✓ | Estado activo/inactivo (default: true) |
| `createdAt` | Date | ✓ | Fecha de creación (automático) |
| `updatedAt` | Date | ✓ | Fecha de última actualización (automático) |

### Validaciones

- **ISBN**: Formato de 10 o 13 dígitos, único en la base de datos
- **Title**: Entre 1 y 200 caracteres
- **Author**: Mínimo 2 caracteres
- **Pages**: Número entero positivo (mínimo 1)
- **Price**: Número no negativo
- **Stock**: Número entero no negativo

### Índices

- `isbn` (único)
- `title`
- `author`
- `genre`
- `isActive`

## 🛣️ API Endpoints

### Base URL: `/api/books`

#### 1. **GET /api/books** - Listar libros

**Query Parameters:**
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Elementos por página (default: 10)
- `genre` (opcional): Filtrar por género
- `isActive` (opcional): Filtrar por estado (`true`/`false`)
- `search` (opcional): Buscar por título, autor o ISBN

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "isbn": "9781234567890",
      "title": "El nombre del viento",
      "author": "Patrick Rothfuss",
      "coauthors": [],
      "publicationDate": "2007-03-27T00:00:00.000Z",
      "genre": "Fantasía",
      "language": "es",
      "pages": 662,
      "price": 29.99,
      "stock": 15,
      "description": "Primera entrega de Crónica del Asesino de Reyes",
      "coverImage": "https://example.com/cover.jpg",
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

#### 2. **POST /api/books** - Crear libro

**Request Body:**
```json
{
  "isbn": "9781234567890",
  "title": "El nombre del viento",
  "author": "Patrick Rothfuss",
  "coauthors": [],
  "publicationDate": "2007-03-27",
  "genre": "Fantasía",
  "language": "es",
  "pages": 662,
  "price": 29.99,
  "stock": 15,
  "description": "Primera entrega de Crónica del Asesino de Reyes",
  "coverImage": "https://example.com/cover.jpg"
}
```

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "isbn": "9781234567890",
    "title": "El nombre del viento",
    "author": "Patrick Rothfuss",
    "genre": "Fantasía",
    "price": 29.99,
    "stock": 15,
    "isActive": true,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  },
  "message": "Libro creado exitosamente"
}
```

**Errores:**
- `400`: Campos requeridos faltantes o formato ISBN inválido
- `409`: ISBN ya registrado

#### 3. **GET /api/books/[id]** - Obtener libro por ID

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "isbn": "9781234567890",
    "title": "El nombre del viento",
    "author": "Patrick Rothfuss",
    "genre": "Fantasía",
    "price": 29.99,
    "stock": 15,
    "isActive": true
  }
}
```

**Errores:**
- `400`: ID inválido
- `404`: Libro no encontrado

#### 4. **PUT /api/books/[id]** - Actualizar libro

**Request Body (todos los campos son opcionales):**
```json
{
  "title": "Nuevo título",
  "price": 34.99,
  "stock": 20,
  "isActive": true
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Nuevo título",
    "price": 34.99,
    "stock": 20,
    "updatedAt": "2024-01-15T11:00:00.000Z"
  },
  "message": "Libro actualizado exitosamente"
}
```

**Errores:**
- `400`: ID o datos inválidos
- `404`: Libro no encontrado
- `409`: ISBN ya registrado en otro libro

#### 5. **DELETE /api/books/[id]** - Desactivar libro

**Nota**: Implementa soft delete (marca como inactivo) en lugar de eliminar.

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "isActive": false,
    "updatedAt": "2024-01-15T12:00:00.000Z"
  },
  "message": "Libro desactivado exitosamente"
}
```

**Errores:**
- `400`: ID inválido
- `404`: Libro no encontrado

## 🎨 Componentes de UI

### BookManagementTable

Tabla completa para gestionar libros con:
- **Búsqueda**: Por título, autor o ISBN
- **Filtros**: Todos, Activos, Inactivos
- **Columnas**: Portada, ISBN, Título, Autor, Género, Precio, Stock, Estado, Acciones
- **Acciones**: Editar, Activar/Desactivar, Eliminar
- **Diseño responsive**: Se adapta a diferentes tamaños de pantalla

### CreateBookModal

Modal para crear nuevos libros:
- Formulario completo con todos los campos
- Validaciones en cliente y servidor
- Manejo de errores con mensajes claros
- Campo de coautores separados por comas
- Selector de idioma predefinido

### EditBookModal

Modal para editar libros existentes:
- Pre-carga datos del libro seleccionado
- Permite actualización parcial de campos
- Validaciones y manejo de errores
- Mismo diseño que CreateBookModal

## 💡 Ejemplos de Uso

### Con JavaScript/Fetch

```javascript
// Crear libro
const response = await fetch('http://localhost:3000/api/books', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    isbn: '9781234567890',
    title: 'El nombre del viento',
    author: 'Patrick Rothfuss',
    publicationDate: '2007-03-27',
    genre: 'Fantasía',
    pages: 662,
    price: 29.99,
    stock: 15
  })
});
const data = await response.json();

// Listar libros con búsqueda
const books = await fetch(
  'http://localhost:3000/api/books?search=viento&limit=20'
);
const booksData = await books.json();

// Actualizar precio y stock
const updateResponse = await fetch(
  'http://localhost:3000/api/books/507f1f77bcf86cd799439011',
  {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      price: 34.99,
      stock: 25
    })
  }
);
```

### Con cURL

```bash
# Crear libro
curl -X POST http://localhost:3000/api/books \
  -H "Content-Type: application/json" \
  -d '{
    "isbn":"9781234567890",
    "title":"El nombre del viento",
    "author":"Patrick Rothfuss",
    "publicationDate":"2007-03-27",
    "genre":"Fantasía",
    "pages":662,
    "price":29.99,
    "stock":15
  }'

# Listar libros activos
curl "http://localhost:3000/api/books?isActive=true&limit=20"

# Obtener libro específico
curl http://localhost:3000/api/books/507f1f77bcf86cd799439011

# Actualizar libro
curl -X PUT http://localhost:3000/api/books/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -d '{"price":34.99,"stock":25}'

# Desactivar libro
curl -X DELETE http://localhost:3000/api/books/507f1f77bcf86cd799439011
```

## 📝 Tipos TypeScript

### Interfaces disponibles (`src/types/book.ts`)

```typescript
// Interface del modelo
interface IBook extends Document {
  isbn: string;
  title: string;
  author: string;
  coauthors?: string[];
  publicationDate: Date;
  genre: string;
  language: string;
  pages: number;
  price: number;
  stock: number;
  description?: string;
  coverImage?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// DTO para crear libro
interface CreateBookDTO {
  isbn: string;
  title: string;
  author: string;
  coauthors?: string[];
  publicationDate: Date;
  genre: string;
  language?: string;
  pages: number;
  price: number;
  stock?: number;
  description?: string;
  coverImage?: string;
}

// DTO para actualizar libro
interface UpdateBookDTO {
  isbn?: string;
  title?: string;
  author?: string;
  coauthors?: string[];
  publicationDate?: Date;
  genre?: string;
  language?: string;
  pages?: number;
  price?: number;
  stock?: number;
  description?: string;
  coverImage?: string;
  isActive?: boolean;
}

// Respuesta del API
interface BookResponse {
  _id: string;
  isbn: string;
  title: string;
  author: string;
  coauthors?: string[];
  publicationDate: Date;
  genre: string;
  language: string;
  pages: number;
  price: number;
  stock: number;
  description?: string;
  coverImage?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Función helper
function sanitizeBook(book: IBook): BookResponse
```

## 🚀 Próximos Pasos (Opcionales)

- [ ] Implementar subida de imágenes para portadas
- [ ] Agregar sistema de categorías/etiquetas
- [ ] Implementar reseñas y calificaciones
- [ ] Agregar historial de cambios de precio
- [ ] Crear reportes de inventario
- [ ] Implementar alertas de stock bajo
- [ ] Agregar importación masiva desde CSV
- [ ] Crear vista pública del catálogo
- [ ] Agregar pruebas unitarias y E2E

## 📦 Dependencias

- **mongoose**: ODM para MongoDB
- **next**: Framework de React con API routes
- **lucide-react**: Iconos (BookOpen, BookPlus, BookX, BookCheck, etc.)

## 🔒 Seguridad

1. **Validaciones**: Todos los campos se validan en backend y frontend
2. **Soft Delete**: Los libros se marcan como inactivos en lugar de eliminarse
3. **Índices únicos**: El ISBN debe ser único en la base de datos
4. **Sanitización**: Los datos se sanitizan antes de enviarlos al cliente

## 📱 Responsive Design

El módulo está completamente optimizado para:
- **Desktop**: Tabla completa con todas las columnas
- **Tablet**: Ajuste automático de columnas
- **Móvil**: Vista optimizada con información esencial
