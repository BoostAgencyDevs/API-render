# Documentación de API - Boost Agency Dashboard

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

## Endpoints Utilizados

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
GET /api/content
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

PUT /api/content
Body: {
  "section": "string",
  "content": "string"
}
```

### Gestión de Usuarios
```
GET /api/users
POST /api/users
PUT /api/users/{id}
DELETE /api/users/{id}
PATCH /api/users/{id}/status
POST /api/users/{id}/reset-password
```

### Gestión de Servicios
```
GET /api/services
POST /api/services
PUT /api/services/{id}
DELETE /api/services/{id}
```

### Gestión de Blog/Podcast
```
GET /api/blog
POST /api/blog
PUT /api/blog/{id}
DELETE /api/blog/{id}
```

### Gestión de Planes
```
GET /api/plans
POST /api/plans
PUT /api/plans/{id}
DELETE /api/plans/{id}
```

### Gestión de Tienda
```
GET /api/products
POST /api/products
PUT /api/products/{id}
DELETE /api/products/{id}

GET /api/categories
POST /api/categories
```

### Gestión de Imágenes
```
GET /api/images
POST /api/images/upload
DELETE /api/images/{id}
```

### Gestión de Temas
```
GET /api/themes
PUT /api/themes
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
