# Documentación de API - Boost Agency Dashboard (Español)

## Estructura del Dashboard

### Tecnologías Utilizadas
- Angular 20.2.1
- Angular Material
- SCSS para estilos
- TypeScript
- RxJS para manejo de observables
- JWT para autenticación

### Arquitectura del Proyecto

```
src/
├── app/
│   ├── pages/
│   │   ├── dashboard/          # Panel principal
│   │   ├── login/              # Autenticación
│   │   ├── leads/              # Gestión de leads
│   │   ├── content/            # Editor de contenido
│   │   ├── images/             # Gestor de imágenes
│   │   ├── themes/             # Personalización de temas
│   │   ├── users/              # Gestión de usuarios
│   │   ├── servicios/          # Gestión de servicios
│   │   ├── blog/               # Gestión de blog/podcast
│   │   ├── planes/             # Gestión de planes
│   │   └── tienda/             # Gestión de tienda
│   ├── services/
│   │   ├── api.service.ts      # Servicio principal de API
│   │   ├── auth.service.ts     # Servicio de autenticación
│   │   └── auth-role.service.ts # Gestión de roles
│   ├── interceptors/
│   │   └── auth.interceptor.ts # Interceptor JWT
│   └── guards/
│       └── auth.guard.ts       # Guard de autenticación
```

## Configuración de API

### URL Base
```
https://boost-agency-api.onrender.com
```

### Headers Requeridos
```
Content-Type: application/json
Authorization: Bearer {JWT_TOKEN}
```

## Endpoints Utilizados (Nombres en Español)

### Autenticación
```
POST /api/auth/login
Body: {
  "email": "string",
  "password": "string"
}
Response: {
  "success": boolean,
  "token": "string",
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "role": "string"
  }
}
```

### Gestión de Leads
```
GET /api/leads
Headers: Authorization: Bearer {token}
Response: {
  "data": [
    {
      "id": "string",
      "nombre": "string",
      "email": "string",
      "telefono": "string",
      "empresa": "string",
      "servicio": "string",
      "presupuesto": "string",
      "mensaje": "string",
      "origen": "string",
      "estado": "string",
      "fechaCreacion": "string"
    }
  ]
}

POST /api/leads
Body: {
  "nombre": "string",
  "email": "string",
  "telefono": "string",
  "empresa": "string",
  "servicio_interes": "string",
  "presupuesto": "string",
  "mensaje": "string",
  "origen": "string"
}

PUT /api/leads/{id}/estado
Body: {
  "estado": "string"
}

GET /api/leads/estadisticas
```

### Gestión de Contenido
```
GET /api/contenido
Response: {
  "data": {
    "inicio_hero": "string",
    "inicio_servicios": "string",
    "inicio_estadisticas": "string",
    "inicio_testimonios": "string",
    "tienda_hero": "string",
    "tienda_productos": "string"
  }
}

PUT /api/contenido/inicio
Body: {
  "hero": "object",
  "servicios_destacados": "array",
  "estadisticas": "object"
}

PUT /api/contenido/nosotros
Body: {
  "titulo": "string",
  "descripcion": "string",
  "mision": "string",
  "vision": "string",
  "valores": "array",
  "equipo": "array"
}

PUT /api/contenido/contacto
Body: {
  "titulo": "string",
  "descripcion": "string",
  "telefono": "string",
  "email": "string",
  "direccion": "string",
  "horarios": "string",
  "redes_sociales": "object"
}

PUT /api/contenido/footer
Body: {
  "descripcion": "string",
  "enlaces_rapidos": "array",
  "copyright": "string"
}
```

### Gestión de Usuarios
```
GET /api/users
POST /api/users
Body: {
  "email": "string",
  "password": "string",
  "name": "string",
  "lastname": "string",
  "username": "string",
  "role": "string"
}

PUT /api/users/{id}
Body: {
  "email": "string",
  "name": "string",
  "lastname": "string",
  "username": "string",
  "role": "string",
  "active": "boolean"
}

DELETE /api/users/{id}
PATCH /api/users/{id}/status
Body: {
  "active": "boolean"
}

POST /api/users/{id}/reset-password
Body: {
  "newPassword": "string"
}
```

### Gestión de Servicios
```
GET /api/servicios
POST /api/servicios
Body: {
  "titulo": "string",
  "descripcion": "string",
  "imagen": "string",
  "caracteristicas": "array",
  "beneficios": "array"
}

PUT /api/servicios/{id}
DELETE /api/servicios/{id}
```

### Gestión de Blog/Podcast
```
GET /api/blog
GET /api/blog/episodios
POST /api/blog/episodios
Body: {
  "titulo": "string",
  "descripcion": "string",
  "fecha": "string",
  "duracion": "string",
  "invitado": "string",
  "cargo_invitado": "string",
  "imagen": "string",
  "audio_url": "string",
  "destacado": "boolean",
  "temas": "array"
}

PUT /api/blog/episodios/{id}
DELETE /api/blog/episodios/{id}
```

### Gestión de Planes
```
GET /api/planes
POST /api/planes
Body: {
  "nombre": "string",
  "precio": "number",
  "periodo": "string",
  "descripcion": "string",
  "caracteristicas": "array",
  "destacado": "boolean",
  "cta_texto": "string",
  "notas": "string"
}

PUT /api/planes/{id}
DELETE /api/planes/{id}

GET /api/planes/beneficios
PUT /api/planes/beneficios
Body: {
  "beneficios": "array"
}

GET /api/planes/faq
PUT /api/planes/faq
Body: {
  "preguntas_frecuentes": "array"
}
```

### Gestión de Tienda
```
GET /api/tienda/productos
POST /api/tienda/productos
Body: {
  "categoria": "string",
  "nombre": "string",
  "descripcion": "string",
  "precio": "number",
  "precio_descuento": "number",
  "imagen": "string",
  "destacado": "boolean",
  "caracteristicas": "array",
  "incluye": "array"
}

PUT /api/tienda/productos/{id}
DELETE /api/tienda/productos/{id}

GET /api/tienda/categorias
POST /api/tienda/categorias
Body: {
  "nombre": "string",
  "descripcion": "string"
}

PUT /api/tienda/categorias/{id}
DELETE /api/tienda/categorias/{id}
```

### Gestión de Imágenes
```
GET /api/images
POST /api/images/upload
Body: FormData con campo 'image'
Query: {
  "categoria": "string",
  "descripcion": "string",
  "tags": "string"
}

PUT /api/images/{id}
Body: {
  "categoria": "string",
  "descripcion": "string",
  "tags": "string"
}

DELETE /api/images/{id}

GET /api/images/stats
```

### Gestión de Temas
```
GET /api/themes
PUT /api/themes
Body: {
  "tema_actual": "string",
  "colores": "object",
  "tipografia": "object",
  "espaciado": "object",
  "bordes": "object"
}

POST /api/themes
Body: {
  "id": "string",
  "nombre": "string",
  "colores": "object",
  "tipografia": "object",
  "espaciado": "object",
  "bordes": "object"
}

PUT /api/themes/switch/{themeId}
DELETE /api/themes/{themeId}

GET /api/themes/current
GET /api/themes/preview/{themeId}
```

### Gestión de Archivos
```
POST /api/upload
Body: FormData con campo 'file'

GET /api/upload/list
DELETE /api/upload/{filename}

GET /api/upload/stats
```

## Estructura de Respuestas de API

### Respuesta Exitosa
```json
{
  "success": true,
  "data": {},
  "message": "string"
}
```

### Respuesta de Error
```json
{
  "success": false,
  "error": "string",
  "message": "string"
}
```

## Manejo de Errores

### Códigos de Estado HTTP
- 200: Éxito
- 201: Creado exitosamente
- 400: Error de validación
- 401: No autorizado (token inválido)
- 403: Prohibido
- 404: No encontrado
- 500: Error interno del servidor

### Manejo de Token JWT
- El token se almacena en localStorage como 'boost_agency_token'
- Se incluye automáticamente en todas las peticiones mediante interceptor
- Se limpia automáticamente en errores 401

## Variables de Entorno

### Development
```typescript
export const environment = {
  production: false,
  apiUrl: 'https://boost-agency-api.onrender.com',
  appName: 'Boost Agency - Panel de Control',
  version: '1.0.0'
};
```

### Production
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://boost-agency-api.onrender.com',
  appName: 'Boost Agency - Panel de Control',
  version: '1.0.0'
};
```

## Flujo de Autenticación

1. Usuario ingresa credenciales en /login
2. Se envía POST a /api/auth/login
3. Si es exitoso, se guarda el token en localStorage
4. El interceptor agrega el token a todas las peticiones
5. El AuthGuard verifica el token en rutas protegidas

## Páginas del Dashboard

### Dashboard Principal (/dashboard)
- Estadísticas generales
- Acciones rápidas
- Actividad reciente

### Gestión de Leads (/leads)
- Lista de leads
- Filtros por estado, servicio, fecha
- Formulario de creación/edición
- Estadísticas de leads

### Editor de Contenido (/content)
- Editor WYSIWYG
- Gestión de páginas (Inicio, Nosotros, Contacto, Servicios, Tienda)
- Gestión de secciones por página
- Vista previa

### Gestión de Imágenes (/images)
- Subida de archivos
- Galería de imágenes
- Filtros y búsqueda
- Estadísticas de uso

### Personalización de Temas (/themes)
- Editor visual de colores
- Configuración de tipografía
- Espaciado y bordes
- Temas predefinidos

### Gestión de Usuarios (/users)
- Lista de usuarios
- Creación/edición de usuarios
- Gestión de roles
- Reset de contraseñas

### Gestión de Servicios (/servicios)
- Lista de servicios
- Formulario de creación/edición
- Características y precios
- Estado activo/inactivo

### Gestión de Blog/Podcast (/blog)
- Lista de episodios/artículos
- Editor de contenido
- Estado publicado/borrador
- Categorías y tags

### Gestión de Planes (/planes)
- Lista de planes
- Configuración de precios
- Características por plan
- Estado activo/inactivo

### Gestión de Tienda (/tienda)
- Lista de productos
- Categorías de productos
- Gestión de stock
- Precios y descuentos

## Requisitos de la API

### Base de Datos
- Tabla de usuarios con roles
- Tabla de leads con estados
- Tabla de contenido por secciones
- Tabla de servicios
- Tabla de blog/podcast
- Tabla de planes
- Tabla de productos
- Tabla de imágenes
- Tabla de temas

### Middleware Requerido
- Autenticación JWT
- Validación de datos
- Manejo de CORS
- Logging de peticiones
- Rate limiting

### Validaciones
- Email único para usuarios
- Campos requeridos según endpoint
- Formato de archivos para imágenes
- Límites de tamaño de contenido

## Notas de Implementación

- Todas las peticiones usan HTTPS
- El interceptor maneja automáticamente el token JWT
- Los errores 401 redirigen automáticamente al login
- El contenido se carga dinámicamente según la sección seleccionada
- Los estilos CSS se aplican en tiempo real en el editor
- Las imágenes se suben mediante multipart/form-data
- Los temas se guardan como objetos JSON

## Usuario por Defecto

- **Email**: `admin@boostagency.com`
- **Password**: `admin123`
- **Rol**: `admin`

## Comandos para Actualizar el Dashboard

Para que el dashboard use los nombres en español, actualiza los servicios Angular:

### 1. ApiService
```typescript
// Cambiar de:
getContent() {
  return this.http.get(`${this.baseUrl}/api/content`);
}

// A:
getContent() {
  return this.http.get(`${this.baseUrl}/api/contenido`);
}
```

### 2. ServiciosService
```typescript
// Cambiar de:
getServices() {
  return this.http.get(`${this.baseUrl}/api/services`);
}

// A:
getServices() {
  return this.http.get(`${this.baseUrl}/api/servicios`);
}
```

### 3. PlansService
```typescript
// Cambiar de:
getPlans() {
  return this.http.get(`${this.baseUrl}/api/plans`);
}

// A:
getPlans() {
  return this.http.get(`${this.baseUrl}/api/planes`);
}
```

### 4. ProductsService
```typescript
// Cambiar de:
getProducts() {
  return this.http.get(`${this.baseUrl}/api/products`);
}

// A:
getProducts() {
  return this.http.get(`${this.baseUrl}/api/tienda/productos`);
}
```

---

**Desarrollado por Boost Agency** 🚀
