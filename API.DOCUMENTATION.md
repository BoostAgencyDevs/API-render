# 📚 Boost Agency API - Documentación Completa

## Información General

- **Base URL:** `http://localhost:3000/api`
- **Versión:** 2.0.0
- **Base de Datos:** PostgreSQL
- **Autenticación:** JWT (JSON Web Token)

---

## 🔐 Autenticación

Todos los endpoints protegidos requieren un token JWT en el header:

```
Authorization: Bearer {tu_token_jwt}
```

### Roles disponibles:

- `admin`: Acceso total
- `editor`: Puede gestionar contenido, servicios, blog, etc.
- `user`: Acceso básico

---

## 📑 Índice de Endpoints

### 1. [Autenticación](#autenticación)

### 2. [Leads (CRM)](#leads-crm)

### 3. [Contenido](#contenido)

### 4. [Servicios](#servicios)

### 5. [Blog/Podcast](#blogpodcast)

### 6. [Planes](#planes)

### 7. [Tienda](#tienda)

### 8. [Upload](#upload)

---

## 🔐 Autenticación

### POST /api/auth/login

Inicia sesión y obtiene un token JWT.

**Body:**

```json
{
  "email": "admin@boostagency.com",
  "password": "Admin123!"
}
```

**Respuesta exitosa (200):**

```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "admin@boostagency.com",
      "full_name": "Administrador",
      "role": "admin",
      "avatar_url": null
    }
  }
}
```

**Errores:**

- `400`: Campos faltantes
- `401`: Credenciales inválidas
- `403`: Usuario inactivo o suspendido

---

### POST /api/auth/register

Crea un nuevo usuario (solo admins).

**Headers:** `Authorization: Bearer {token}` (rol: admin)

**Body:**

```json
{
  "email": "nuevo@boostagency.com",
  "password": "Password123!",
  "full_name": "Nuevo Usuario",
  "role": "editor",
  "phone": "+1234567890"
}
```

**Respuesta exitosa (201):**

```json
{
  "success": true,
  "message": "Usuario creado exitosamente",
  "data": {
    "id": "uuid",
    "email": "nuevo@boostagency.com",
    "full_name": "Nuevo Usuario",
    "role": "editor",
    "status": "active",
    "created_at": "2024-02-15T10:00:00.000Z"
  }
}
```

---

### GET /api/auth/me

Obtiene información del usuario autenticado.

**Headers:** `Authorization: Bearer {token}`

**Respuesta exitosa (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "admin@boostagency.com",
    "full_name": "Administrador",
    "role": "admin",
    "status": "active",
    "phone": null,
    "avatar_url": null,
    "created_at": "2024-01-01T00:00:00.000Z",
    "last_login": "2024-02-15T10:00:00.000Z"
  }
}
```

---

### PUT /api/auth/change-password

Cambia la contraseña del usuario autenticado.

**Headers:** `Authorization: Bearer {token}`

**Body:**

```json
{
  "current_password": "Admin123!",
  "new_password": "NewPassword456!"
}
```

**Respuesta exitosa (200):**

```json
{
  "success": true,
  "message": "Contraseña actualizada exitosamente"
}
```

---

### POST /api/auth/refresh

Renueva el token JWT.

**Headers:** `Authorization: Bearer {token_viejo}`

**Respuesta exitosa (200):**

```json
{
  "success": true,
  "message": "Token renovado exitosamente",
  "data": {
    "token": "nuevo_token_jwt"
  }
}
```

---

## 📊 Leads (CRM)

### GET /api/leads

Obtiene todos los leads con filtros y paginación.

**Headers:** `Authorization: Bearer {token}` (rol: admin o editor)

**Query Params:**

- `page` (default: 1)
- `limit` (default: 20)
- `estado`: nuevo, contactado, calificado, cerrado
- `servicio`: nombre del servicio de interés
- `fecha_desde`: ISO date (2024-01-01)
- `fecha_hasta`: ISO date (2024-12-31)
- `assigned_to`: UUID del usuario asignado

**Ejemplo:**

```
GET /api/leads?page=1&limit=10&estado=nuevo
```

**Respuesta exitosa (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "nombre": "Juan Pérez",
      "email": "juan@example.com",
      "telefono": "+1234567890",
      "empresa": "Tech Corp",
      "servicio_interes": "Marketing Digital",
      "presupuesto": "$5000-$10000",
      "mensaje": "Me interesa sus servicios",
      "origen": "formulario-web",
      "estado": "nuevo",
      "assigned_to": null,
      "assigned_to_name": null,
      "fecha": "2024-02-15T10:30:00.000Z",
      "created_at": "2024-02-15T10:30:00.000Z",
      "updated_at": "2024-02-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}
```

---

### GET /api/leads/estadisticas

Obtiene estadísticas de leads.

**Headers:** `Authorization: Bearer {token}` (rol: admin o editor)

**Respuesta exitosa (200):**

```json
{
  "success": true,
  "data": {
    "total": 150,
    "nuevos": 45,
    "contactados": 60,
    "calificados": 30,
    "cerrados": 15,
    "por_servicio": {
      "Marketing Digital": 80,
      "Desarrollo Web": 40,
      "Branding": 30
    },
    "por_mes": {
      "2024-02": 25,
      "2024-01": 30,
      "2023-12": 20
    }
  }
}
```

---

### GET /api/leads/search

Busca leads por texto.

**Headers:** `Authorization: Bearer {token}` (rol: admin o editor)

**Query Params:**

- `q`: término de búsqueda (mínimo 2 caracteres)
- `limit` (default: 10)

**Ejemplo:**

```
GET /api/leads/search?q=juan&limit=5
```

---

### GET /api/leads/:id

Obtiene un lead específico.

**Headers:** `Authorization: Bearer {token}` (rol: admin o editor)

**Respuesta exitosa (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    // ... todos los campos del lead
    "assigned_to_name": "Ana García",
    "assigned_to_email": "ana@boostagency.com"
  }
}
```

---

### POST /api/leads

Crea un nuevo lead (público - desde formulario web).

**Body:**

```json
{
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "telefono": "+1234567890",
  "empresa": "Tech Corp",
  "servicio_interes": "Marketing Digital",
  "presupuesto": "$5000-$10000",
  "mensaje": "Me interesa sus servicios",
  "origen": "formulario-web"
}
```

**Campos requeridos:** `nombre`, `email`, `telefono`, `servicio_interes`

**Respuesta exitosa (201):**

```json
{
  "success": true,
  "message": "Lead creado exitosamente",
  "data": {
    "id": "uuid"
    // ... datos del lead creado
  }
}
```

---

### PUT /api/leads/:id/estado

Actualiza el estado de un lead.

**Headers:** `Authorization: Bearer {token}` (rol: admin o editor)

**Body:**

```json
{
  "estado": "contactado"
}
```

**Estados válidos:** `nuevo`, `contactado`, `calificado`, `cerrado`

---

### PUT /api/leads/:id/asignar

Asigna un lead a un usuario.

**Headers:** `Authorization: Bearer {token}` (rol: admin o editor)

**Body:**

```json
{
  "user_id": "uuid-del-usuario"
}
```

---

### PUT /api/leads/:id

Actualiza un lead completo.

**Headers:** `Authorization: Bearer {token}` (rol: admin o editor)

**Body:** Cualquier campo del lead que quieras actualizar

---

### DELETE /api/leads/:id

Elimina un lead permanentemente.

**Headers:** `Authorization: Bearer {token}` (rol: admin)

---

## 📄 Contenido

### GET /api/content

Obtiene todas las secciones de contenido.

**Query Params:**

- `status`: published, draft, archived

**Respuesta exitosa (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "section_key": "inicio",
      "section_name": "Página de Inicio",
      "content_data": {
        "hero": {
          "titulo": "BOOST AGENCY",
          "subtitulo": "Impulsamos tu marca"
          // ... resto del contenido
        }
      },
      "status": "published",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-02-15T10:00:00.000Z"
    }
  ],
  "count": 5
}
```

---

### GET /api/content/:sectionKey

Obtiene el contenido de una sección específica.

**Ejemplo:**

```
GET /api/content/inicio
GET /api/content/nosotros
GET /api/content/contacto
GET /api/content/footer
GET /api/content/fundacion
```

**Respuesta exitosa (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "section_key": "inicio",
    "section_name": "Página de Inicio",
    "content_data": {
      // ... contenido completo de la sección
    },
    "status": "published"
  }
}
```

---

### POST /api/content

Crea o actualiza una sección de contenido.

**Headers:** `Authorization: Bearer {token}` (rol: admin o editor)

**Body:**

```json
{
  "section_key": "inicio",
  "section_name": "Página de Inicio",
  "content_data": {
    "hero": {
      "titulo": "Nuevo título",
      "subtitulo": "Nuevo subtítulo"
    }
  },
  "status": "published"
}
```

---

### PUT /api/content/:sectionKey

Actualiza una sección existente.

**Headers:** `Authorization: Bearer {token}` (rol: admin o editor)

---

### PATCH /api/content/:sectionKey/partial

Actualiza solo una parte del contenido.

**Headers:** `Authorization: Bearer {token}` (rol: admin o editor)

**Body:**

```json
{
  "path": "hero.titulo",
  "value": "Nuevo título del hero"
}
```

**Ejemplos de paths:**

- `"hero.titulo"`
- `"nosotros.mision"`
- `"estadisticas.clientes_satisfechos"`

---

## 🎯 Servicios

### GET /api/servicios

Obtiene todos los servicios activos.

**Query Params:**

- `status`: active, inactive
- `includeInactive`: true/false

**Respuesta exitosa (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "service_id": "marketing-digital",
      "title": "Marketing Digital",
      "description": "Estrategias integrales de marketing",
      "image_url": "/uploads/marketing.jpg",
      "features": [
        "SEO y posicionamiento",
        "Marketing de contenidos",
        "Email marketing"
      ],
      "benefits": ["Mayor visibilidad online", "Incremento en leads"],
      "display_order": 1,
      "status": "active",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 4
}
```

---

### GET /api/servicios/:serviceId

Obtiene un servicio específico.

**Ejemplo:** `GET /api/servicios/marketing-digital`

---

### POST /api/servicios

Crea un nuevo servicio.

**Headers:** `Authorization: Bearer {token}` (rol: admin o editor)

**Body:**

```json
{
  "service_id": "nuevo-servicio",
  "title": "Nuevo Servicio",
  "description": "Descripción del servicio",
  "image_url": "/uploads/servicio.jpg",
  "features": ["Característica 1", "Característica 2"],
  "benefits": ["Beneficio 1", "Beneficio 2"],
  "display_order": 4
}
```

---

### PUT /api/servicios/:serviceId

Actualiza un servicio.

**Headers:** `Authorization: Bearer {token}` (rol: admin o editor)

---

### PATCH /api/servicios/:serviceId/status

Activa/desactiva un servicio.

**Headers:** `Authorization: Bearer {token}` (rol: admin o editor)

**Body:**

```json
{
  "status": "inactive"
}
```

---

### POST /api/servicios/reorder

Reordena los servicios.

**Headers:** `Authorization: Bearer {token}` (rol: admin o editor)

**Body:**

```json
{
  "order": [
    { "service_id": "marketing-digital", "order": 1 },
    { "service_id": "desarrollo-web", "order": 2 }
  ]
}
```

---

### DELETE /api/servicios/:serviceId

Elimina un servicio (soft delete).

**Headers:** `Authorization: Bearer {token}` (rol: admin o editor)

---

## 🎙️ Blog/Podcast

### GET /api/blog

Obtiene todos los episodios con paginación.

**Query Params:**

- `page` (default: 1)
- `limit` (default: 20)
- `status`: published, draft, archived
- `onlyFeatured`: true/false

**Respuesta exitosa (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "episode_id": "ep-001",
      "episode_number": 1,
      "title": "El futuro del marketing digital",
      "description": "Exploramos las tendencias...",
      "publish_date": "2024-01-15",
      "duration": "45:30",
      "guest_name": "Ana Martínez",
      "guest_title": "CMO de TechCorp",
      "cover_image_url": "/uploads/ep001.jpg",
      "audio_url": "/audio/ep001.mp3",
      "is_featured": true,
      "topics": ["Inteligencia Artificial", "SEO"],
      "views_count": 1250,
      "status": "published",
      "author_name": "Admin"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 25,
    "pages": 2
  }
}
```

---

### GET /api/blog/recent

Obtiene los episodios más recientes.

**Query Params:**

- `limit` (default: 5)

---

### GET /api/blog/featured

Obtiene episodios destacados.

---

### GET /api/blog/stats

Obtiene estadísticas del podcast.

**Headers:** `Authorization: Bearer {token}` (rol: admin o editor)

---

### GET /api/blog/topics/:topic

Busca episodios por tema.

**Ejemplo:** `GET /api/blog/topics/SEO`

---

### GET /api/blog/:episodeId

Obtiene un episodio específico.

**Ejemplo:** `GET /api/blog/ep-001`

---

### POST /api/blog

Crea un nuevo episodio.

**Headers:** `Authorization: Bearer {token}` (rol: admin o editor)

**Body:**

```json
{
  "episode_id": "ep-026",
  "episode_number": 26,
  "title": "Título del episodio",
  "description": "Descripción completa",
  "publish_date": "2024-02-20",
  "duration": "42:30",
  "guest_name": "Nombre Invitado",
  "guest_title": "Cargo",
  "cover_image_url": "/uploads/ep026.jpg",
  "audio_url": "/audio/ep026.mp3",
  "topics": ["Marketing", "SEO"],
  "is_featured": false,
  "status": "draft"
}
```

---

### PUT /api/blog/:episodeId

Actualiza un episodio.

**Headers:** `Authorization: Bearer {token}` (rol: admin o editor)

---

### PATCH /api/blog/:episodeId/status

Cambia el estado del episodio.

**Headers:** `Authorization: Bearer {token}` (rol: admin o editor)

**Body:**

```json
{
  "status": "published"
}
```

---

### PATCH /api/blog/:episodeId/featured

Marca/desmarca como destacado.

**Headers:** `Authorization: Bearer {token}` (rol: admin o editor)

**Body:**

```json
{
  "featured": true
}
```

---

### POST /api/blog/:episodeId/view

Incrementa contador de vistas (público).

---

### DELETE /api/blog/:episodeId

Elimina un episodio (soft delete).

**Headers:** `Authorization: Bearer {token}` (rol: admin o editor)

---

## 💰 Planes

### GET /api/planes

Obtiene todos los planes activos.

**Query Params:**

- `status`: active, inactive
- `includeInactive`: true/false

**Respuesta exitosa (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "plan_id": "professional",
      "name": "Professional",
      "price": 2499,
      "price_currency": "USD",
      "billing_period": "mes",
      "description": "Perfecto para empresas en crecimiento",
      "features": [
        "Gestión de 5 redes sociales",
        "24 posts mensuales",
        "Diseño premium de posts",
        "Estrategia de contenidos"
      ],
      "is_featured": true,
      "cta_text": "Elegir Professional",
      "notes": "* Incluye setup inicial gratuito",
      "display_order": 2,
      "status": "active",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 3
}
```

---

### GET /api/planes/featured

Obtiene el plan destacado (recomendado).

---

### GET /api/planes/:planId

Obtiene un plan específico.

**Ejemplo:** `GET /api/planes/professional`

---

### POST /api/planes

Crea un nuevo plan.

**Headers:** `Authorization: Bearer {token}` (rol: admin o editor)

**Body:**

```json
{
  "plan_id": "premium",
  "name": "Premium",
  "price": 3999,
  "billing_period": "mes",
  "description": "Plan premium para empresas grandes",
  "features": ["Característica 1", "Característica 2"],
  "is_featured": false,
  "cta_text": "Elegir Premium",
  "notes": "Nota adicional",
  "display_order": 3
}
```

---

### PUT /api/planes/:planId

Actualiza un plan.

**Headers:** `Authorization: Bearer {token}` (rol: admin o editor)

---

### PATCH /api/planes/:planId/status

Activa/desactiva un plan.

**Headers:** `Authorization: Bearer {token}` (rol: admin o editor)

**Body:**

```json
{
  "status": "inactive"
}
```

---

### PATCH /api/planes/:planId/featured

Marca/desmarca como plan destacado.

**Headers:** `Authorization: Bearer {token}` (rol: admin o editor)

**Body:**

```json
{
  "featured": true
}
```

**Nota:** Solo puede haber un plan destacado a la vez. Al marcar uno como destacado, automáticamente se quita el destacado de los demás.

---

### POST /api/planes/reorder

Reordena los planes.

**Headers:** `Authorization: Bearer {token}` (rol: admin o editor)

**Body:**

```json
{
  "order": [
    { "plan_id": "starter", "order": 1 },
    { "plan_id": "professional", "order": 2 },
    { "plan_id": "enterprise", "order": 3 }
  ]
}
```

---

### DELETE /api/planes/:planId

Elimina un plan (soft delete).

**Headers:** `Authorization: Bearer {token}` (rol: admin o editor)

---

## 🛒 Tienda

### GET /api/tienda

Obtiene todos los productos con paginación.

**Query Params:**

- `page` (default: 1)
- `limit` (default: 20)
- `category_id`: UUID de la categoría
- `status`: active, inactive
- `onlyFeatured`: true/false

**Respuesta exitosa (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "product_id": "curso-marketing-digital",
      "name": "Marketing Digital Masterclass",
      "description": "Curso completo de marketing digital",
      "price": 199.99,
      "discount_price": 149.99,
      "price_currency": "USD",
      "image_url": "/uploads/curso-marketing.jpg",
      "is_featured": true,
      "features": [
        "40 horas de contenido",
        "Certificado incluido",
        "Acceso de por vida"
      ],
      "includes": [
        "Videos HD",
        "Recursos descargables",
        "Ejercicios prácticos"
      ],
      "category_id": "uuid",
      "category_name": "Cursos Digitales",
      "category_slug": "cursos",
      "display_order": 1,
      "status": "active",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "pages": 1
  }
}
```

---

### GET /api/tienda/featured

Obtiene productos destacados.

**Query Params:**

- `limit` (default: 3)

---

### GET /api/tienda/search

Busca productos por texto.

**Query Params:**

- `q`: término de búsqueda (mínimo 2 caracteres)
- `limit` (default: 10)

**Ejemplo:**

```
GET /api/tienda/search?q=marketing&limit=5
```

---

### GET /api/tienda/categoria/:categorySlug

Obtiene productos de una categoría.

**Ejemplo:**

```
GET /api/tienda/categoria/cursos
GET /api/tienda/categoria/templates
GET /api/tienda/categoria/ebooks
```

---

### GET /api/tienda/:productId

Obtiene un producto específico.

**Ejemplo:** `GET /api/tienda/curso-marketing-digital`

---

### POST /api/tienda

Crea un nuevo producto.

**Headers:** `Authorization: Bearer {token}` (rol: admin o editor)

**Body:**

```json
{
  "product_id": "nuevo-curso",
  "name": "Nombre del Producto",
  "description": "Descripción completa",
  "price": 199.99,
  "discount_price": 149.99,
  "image_url": "/uploads/producto.jpg",
  "features": ["Característica 1", "Característica 2"],
  "includes": ["Incluye 1", "Incluye 2"],
  "category_id": "uuid-de-categoria",
  "is_featured": false,
  "display_order": 1
}
```

---

### PUT /api/tienda/:productId

Actualiza un producto.

**Headers:** `Authorization: Bearer {token}` (rol: admin o editor)

---

### PATCH /api/tienda/:productId/status

Activa/desactiva un producto.

**Headers:** `Authorization: Bearer {token}` (rol: admin o editor)

**Body:**

```json
{
  "status": "inactive"
}
```

---

### PATCH /api/tienda/:productId/featured

Marca/desmarca como producto destacado.

**Headers:** `Authorization: Bearer {token}` (rol: admin o editor)

**Body:**

```json
{
  "featured": true
}
```

---

### POST /api/tienda/reorder

Reordena los productos.

**Headers:** `Authorization: Bearer {token}` (rol: admin o editor)

**Body:**

```json
{
  "order": [
    { "product_id": "curso-marketing", "order": 1 },
    { "product_id": "template-instagram", "order": 2 }
  ]
}
```

---

### DELETE /api/tienda/:productId

Elimina un producto (soft delete).

**Headers:** `Authorization: Bearer {token}` (rol: admin o editor)

---

## 📤 Upload

### POST /api/upload

Sube un archivo al servidor.

**Headers:** `Authorization: Bearer {token}` (rol: admin o editor)

**Content-Type:** `multipart/form-data`

**Form Data:**

- `file`: Archivo (requerido)
- `alt_text`: Texto alternativo (opcional)
- `caption`: Descripción (opcional)
- `folder`: Carpeta/categoría (opcional)

**Tipos de archivo permitidos:**

- Imágenes: jpeg, jpg, png, gif, webp, svg
- Documentos: pdf, doc, docx
- Audio: mp3, wav
- Video: mp4, webm

**Tamaño máximo:** 10MB

**Respuesta exitosa (200):**

```json
{
  "success": true,
  "message": "Archivo subido exitosamente",
  "data": {
    "id": "uuid",
    "filename": "1708000000000-123456789-imagen.jpg",
    "original_filename": "mi-imagen.jpg",
    "file_path": "/home/api/uploads/imagenes/1708000000000-123456789-imagen.jpg",
    "file_url": "/uploads/imagenes/1708000000000-123456789-imagen.jpg",
    "mime_type": "image/jpeg",
    "file_size": 245678,
    "width": 1920,
    "height": 1080,
    "alt_text": "Descripción de la imagen",
    "caption": null,
    "folder": "imagenes",
    "uploaded_by": "uuid-usuario",
    "created_at": "2024-02-15T10:00:00.000Z"
  }
}
```

---

### POST /api/upload/multiple

Sube múltiples archivos a la vez (máximo 10).

**Headers:** `Authorization: Bearer {token}` (rol: admin o editor)

**Content-Type:** `multipart/form-data`

**Form Data:**

- `files`: Archivos múltiples (requerido)
- `folder`: Carpeta común para todos (opcional)

---

### GET /api/upload/list

Lista todos los archivos con filtros.

**Headers:** `Authorization: Bearer {token}` (rol: admin o editor)

**Query Params:**

- `page` (default: 1)
- `limit` (default: 20)
- `categoria`: imagenes, audio, video, documentos, otros
- `folder`: carpeta específica
- `search`: búsqueda por nombre
- `sortBy`: created_at, file_size, filename, mime_type (default: created_at)
- `sortOrder`: ASC, DESC (default: DESC)

**Respuesta exitosa (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "filename": "1708000000000-123456789-imagen.jpg",
      "original_filename": "mi-imagen.jpg",
      "file_url": "/uploads/imagenes/1708000000000-123456789-imagen.jpg",
      "mime_type": "image/jpeg",
      "file_size": 245678,
      "width": 1920,
      "height": 1080,
      "folder": "imagenes",
      "uploaded_by_name": "Admin Usuario",
      "created_at": "2024-02-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

---

### GET /api/upload/:id

Obtiene información de un archivo específico.

**Headers:** `Authorization: Bearer {token}` (rol: admin o editor)

---

### PUT /api/upload/:id

Actualiza metadatos de un archivo.

**Headers:** `Authorization: Bearer {token}` (rol: admin o editor)

**Body:**

```json
{
  "alt_text": "Nueva descripción",
  "caption": "Nuevo caption",
  "folder": "nueva-carpeta"
}
```

---

### DELETE /api/upload/:id

Elimina un archivo (físico y registro).

**Headers:** `Authorization: Bearer {token}` (rol: admin)

---

### GET /api/upload/stats

Obtiene estadísticas de archivos.

**Headers:** `Authorization: Bearer {token}` (rol: admin o editor)

**Respuesta exitosa (200):**

```json
{
  "success": true,
  "data": {
    "total": 125,
    "totalSize": 1048576000,
    "avgSize": 8388608,
    "recientes": 15,
    "porFolder": {
      "imagenes": 80,
      "documentos": 25,
      "audio": 15,
      "video": 5
    },
    "porExtension": {
      "jpg": 50,
      "png": 30,
      "pdf": 25,
      "mp3": 15,
      "mp4": 5
    }
  }
}
```

---

## 📋 Códigos de Estado HTTP

| Código | Significado           | Uso                             |
| ------ | --------------------- | ------------------------------- |
| 200    | OK                    | Solicitud exitosa               |
| 201    | Created               | Recurso creado exitosamente     |
| 400    | Bad Request           | Datos inválidos o faltantes     |
| 401    | Unauthorized          | Token faltante o inválido       |
| 403    | Forbidden             | Permisos insuficientes          |
| 404    | Not Found             | Recurso no encontrado           |
| 409    | Conflict              | Conflicto (ej: email duplicado) |
| 500    | Internal Server Error | Error del servidor              |

---

## 🛠️ Estructura de Respuestas

### Respuesta Exitosa

```json
{
  "success": true,
  "message": "Mensaje descriptivo",
  "data": {
    /* datos */
  }
}
```

### Respuesta con Error

```json
{
  "success": false,
  "error": "Mensaje de error",
  "details": "Detalles técnicos (solo en development)"
}
```

### Respuesta con Paginación

```json
{
  "success": true,
  "data": [
    /* array de datos */
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

## 🔒 Seguridad

### Mejores Prácticas

1. **Nunca compartas tu JWT token** en repositorios o logs
2. **Cambia la contraseña del admin** después del primer login
3. **Usa HTTPS** en producción
4. **Configura CORS** adecuadamente para tu dominio
5. **Implementa rate limiting** para prevenir abusos
6. **Haz backups regulares** de PostgreSQL

### Variables de Entorno Requeridas

```env
# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=boost_agency
DB_USER=postgres
DB_PASSWORD=tu_password_seguro

# JWT
JWT_SECRET=tu_secret_muy_seguro_y_largo_minimo_32_caracteres
JWT_EXPIRES_IN=7d

# API
PORT=3000
NODE_ENV=production

# Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
```

---

## 📊 Testing con cURL

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@boostagency.com","password":"Admin123!"}'
```

### Obtener leads (con autenticación)

```bash
curl -X GET "http://localhost:3000/api/leads?page=1&limit=10" \
  -H "Authorization: Bearer TU_TOKEN_JWT"
```

### Crear un lead (público)

```bash
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "nombre":"Juan Pérez",
    "email":"juan@example.com",
    "telefono":"+1234567890",
    "servicio_interes":"Marketing Digital"
  }'
```

### Subir archivo

```bash
curl -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer TU_TOKEN_JWT" \
  -F "file=@/ruta/a/imagen.jpg" \
  -F "alt_text=Descripción de la imagen"
```

---

## 🎯 Postman Collection

Puedes importar esta colección básica en Postman:

```json
{
  "info": {
    "name": "Boost Agency API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3000/api"
    },
    {
      "key": "token",
      "value": ""
    }
  ]
}
```

---

## 📞 Soporte

Para soporte técnico o preguntas sobre la API:

- **Email:** dev@boostagency.com
- **Documentación:** https://docs.boostagency.com
- **GitHub Issues:** https://github.com/boostagency/api/issues

---

## 📝 Changelog

### v2.0.0 (octubre 2025)

- ✅ Migración completa de JSON a PostgreSQL
- ✅ Sistema de autenticación con JWT
- ✅ Gestión de roles y permisos
- ✅ Upload de archivos con organización por carpetas
- ✅ Estadísticas y analytics mejorados
- ✅ Búsqueda y filtros optimizados
- ✅ Paginación en todos los endpoints relevantes
- ✅ Soft deletes en lugar de eliminación permanente
- ✅ Mejor manejo de errores y validaciones
