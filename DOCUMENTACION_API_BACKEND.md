# Documentación API Backend - Boost Agency

## Información General

**API Base URL:** `https://boost-agency-api.onrender.com/api`

Esta documentación especifica todos los endpoints que debe implementar el backend para que el panel de control pueda gestionar el contenido de la página principal.

## Estructura de Respuesta Estándar

Todos los endpoints deben devolver respuestas en el siguiente formato:

```json
{
  "success": true,
  "data": {
    // Contenido específico de cada endpoint
  },
  "message": "Operación exitosa"
}
```

## Endpoints Requeridos

### 1. CONTENIDO DE PÁGINAS

#### 1.1 Página de Inicio

**GET** `/api/contenido/inicio`
- **Descripción:** Obtiene todo el contenido de la página de inicio
- **Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "hero": {
      "titulo": "Make digital decisions for business growth.",
      "subtitulo": "Consultoría estratégica, marketing digital e IA para marcas que quieren liderar el futuro.",
      "imagen_fondo": "assets/images/inicio/Aros_Franja1.mp4",
      "boton_cta": "El futuro es ahora"
    },
    "servicios_destacados": [
      {
        "id": "servicio-1",
        "titulo": "Focused Design Solutions",
        "descripcion": "Soluciones de diseño enfocadas",
        "icono": "icono_url",
        "enlace": "/servicios"
      }
    ],
    "estadisticas": {
      "clientes": 150,
      "proyectos": 120000,
      "satisfaccion": 92
    }
  },
  "message": "Contenido de inicio cargado correctamente"
}
```

**PUT** `/api/contenido/inicio`
- **Descripción:** Actualiza el contenido de la página de inicio
- **Body:** Mismo formato que la respuesta GET
- **Respuesta:** Confirmación de actualización

#### 1.2 Página Nosotros

**GET** `/api/contenido/nosotros`
- **Descripción:** Obtiene todo el contenido de la página nosotros
- **Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "titulo": "ABOUT US",
    "descripcion": "Learn more about our story and mission",
    "mision": "Impulsar el crecimiento de negocios y marcas...",
    "vision": "Ser la agencia referente en América Latina...",
    "valores": [
      "Estrategia accionable",
      "Innovación constante",
      "Personalización real",
      "Excelencia operativa",
      "Compromiso con resultados"
    ],
    "historia": "Boost Digital Business nace con una convicción clara..."
  },
  "message": "Contenido de nosotros cargado correctamente"
}
```

**PUT** `/api/contenido/nosotros`
- **Descripción:** Actualiza el contenido de la página nosotros
- **Body:** Mismo formato que la respuesta GET

#### 1.3 Página Contacto

**GET** `/api/contenido/contacto`
- **Descripción:** Obtiene todo el contenido de la página contacto
- **Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "titulo": "Contáctanos",
    "descripcion": "¿Tienes alguna pregunta? Contáctanos y te responderemos lo antes posible.",
    "telefono": "+1 234 567 890",
    "email": "info@boostagency.com",
    "direccion": "123 Calle Principal, Ciudad",
    "horarios": "Lun-Vie: 9:00-18:00",
    "redes_sociales": {
      "facebook": "https://facebook.com/boostagency",
      "instagram": "https://instagram.com/boostagency",
      "linkedin": "https://linkedin.com/company/boostagency"
    }
  },
  "message": "Contenido de contacto cargado correctamente"
}
```

**PUT** `/api/contenido/contacto`
- **Descripción:** Actualiza el contenido de la página contacto
- **Body:** Mismo formato que la respuesta GET

### 2. SERVICIOS

#### 2.1 Lista de Servicios

**GET** `/api/servicios`
- **Descripción:** Obtiene todos los servicios disponibles
- **Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "servicios": [
      {
        "id": "performance-ads",
        "titulo": "Performance Ads",
        "descripcion": "Publicidad digital de alto rendimiento con resultados medibles y ROI optimizado para maximizar tu inversión publicitaria.",
        "imagen": "url_imagen",
        "caracteristicas": [
          "SEO y SEM",
          "Redes Sociales",
          "Email Marketing"
        ],
        "beneficios": [
          "Mayor visibilidad",
          "Más conversiones",
          "ROI medible"
        ],
        "precio_desde": 999,
        "activo": true
      }
    ]
  },
  "message": "Servicios cargados correctamente"
}
```

**PUT** `/api/servicios/{id}`
- **Descripción:** Actualiza un servicio específico
- **Parámetros:** `id` - ID del servicio
- **Body:** Datos del servicio a actualizar

**POST** `/api/servicios`
- **Descripción:** Crea un nuevo servicio
- **Body:** Datos del nuevo servicio

**DELETE** `/api/servicios/{id}`
- **Descripción:** Elimina un servicio
- **Parámetros:** `id` - ID del servicio

### 3. PLANES

#### 3.1 Lista de Planes

**GET** `/api/planes`
- **Descripción:** Obtiene todos los planes disponibles
- **Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "planes": [
      {
        "id": "starter",
        "nombre": "STARTER BOOST",
        "precio": 800,
        "periodo": "USD",
        "descripcion": "Ideal para emprendedores digitales",
        "caracteristicas": [
          "Diseño web básico",
          "Branding esencial",
          "1 pauta mensual"
        ],
        "destacado": false,
        "cta_texto": "Comenzar Ahora",
        "notas": "Sin compromiso de permanencia"
      }
    ]
  },
  "message": "Planes cargados correctamente"
}
```

**PUT** `/api/planes/{id}`
- **Descripción:** Actualiza un plan específico
- **Parámetros:** `id` - ID del plan

**POST** `/api/planes`
- **Descripción:** Crea un nuevo plan

**DELETE** `/api/planes/{id}`
- **Descripción:** Elimina un plan

### 4. TIENDA

#### 4.1 Productos de la Tienda

**GET** `/api/tienda/productos`
- **Descripción:** Obtiene todos los productos de la tienda
- **Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "productos": [
      {
        "id": "gorra-digital-mind",
        "categoria": "Gorras",
        "nombre": "Gorra Digital Mind",
        "descripcion": "Diseño para mentes digitales.",
        "precio": 29.99,
        "precio_descuento": null,
        "imagen": "assets/images/Tienda/GORRAS/Gorra_Digital_Mind.png",
        "destacado": true,
        "caracteristicas": [
          "Material premium",
          "Diseño exclusivo",
          "Envío gratuito"
        ],
        "incluye": [
          "Gorra",
          "Sticker pack",
          "Garantía"
        ]
      }
    ]
  },
  "message": "Productos cargados correctamente"
}
```

**PUT** `/api/tienda/productos/{id}`
- **Descripción:** Actualiza un producto específico
- **Parámetros:** `id` - ID del producto

**POST** `/api/tienda/productos`
- **Descripción:** Crea un nuevo producto

**DELETE** `/api/tienda/productos/{id}`
- **Descripción:** Elimina un producto

### 5. BLOG/PODCAST

#### 5.1 Episodios del Blog

**GET** `/api/blog/episodios`
- **Descripción:** Obtiene todos los episodios del blog/podcast
- **Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "episodios": [
      {
        "id": "ep-001",
        "numero": 1,
        "titulo": "El poder del marketing de contenidos",
        "descripcion": "Cómo crear contenido cautivante y convertir clientes potenciales.",
        "fecha": "2024-04-25",
        "duracion": "45:30",
        "invitado": "Carlos Rodríguez",
        "cargo_invitado": "CEO de DigitalPro",
        "imagen": "url_imagen",
        "audio_url": "url_audio",
        "destacado": true,
        "temas": ["marketing", "contenido", "conversión"]
      }
    ]
  },
  "message": "Episodios cargados correctamente"
}
```

**PUT** `/api/blog/episodios/{id}`
- **Descripción:** Actualiza un episodio específico
- **Parámetros:** `id` - ID del episodio

**POST** `/api/blog/episodios`
- **Descripción:** Crea un nuevo episodio

**DELETE** `/api/blog/episodios/{id}`
- **Descripción:** Elimina un episodio

### 6. UPLOAD DE ARCHIVOS

#### 6.1 Subida de Imágenes

**POST** `/api/upload/image`
- **Descripción:** Sube una imagen al servidor
- **Content-Type:** `multipart/form-data`
- **Body:** `file` - Archivo de imagen
- **Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "url": "https://cdn.boostagency.com/images/uploaded-image.jpg",
    "filename": "uploaded-image.jpg",
    "size": 1024000,
    "type": "image/jpeg"
  },
  "message": "Imagen subida correctamente"
}
```

#### 6.2 Subida de Audio

**POST** `/api/upload/audio`
- **Descripción:** Sube un archivo de audio al servidor
- **Content-Type:** `multipart/form-data`
- **Body:** `file` - Archivo de audio

#### 6.3 Subida de Video

**POST** `/api/upload/video`
- **Descripción:** Sube un archivo de video al servidor
- **Content-Type:** `multipart/form-data`
- **Body:** `file` - Archivo de video

## Códigos de Estado HTTP

- **200 OK:** Operación exitosa
- **201 Created:** Recurso creado exitosamente
- **400 Bad Request:** Datos de entrada inválidos
- **401 Unauthorized:** No autorizado
- **403 Forbidden:** Prohibido
- **404 Not Found:** Recurso no encontrado
- **500 Internal Server Error:** Error interno del servidor

## Manejo de Errores

Todos los errores deben devolverse en el siguiente formato:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Descripción del error",
    "details": "Detalles adicionales del error"
  },
  "message": "Error en la operación"
}
```

## Autenticación

Para operaciones de escritura (PUT, POST, DELETE), se requiere autenticación mediante:

- **Header:** `Authorization: Bearer {token}`
- **Token:** JWT token válido

## CORS

Configurar CORS para permitir requests desde:
- `http://localhost:4200` (Panel de control)
- `https://boostdigitalstudio2.netlify.app` (Página principal)

## Base de Datos

### Estructura de Tablas Sugerida

```sql
-- Contenido de páginas
CREATE TABLE contenido_paginas (
  id VARCHAR(50) PRIMARY KEY,
  pagina VARCHAR(50) NOT NULL,
  seccion VARCHAR(50) NOT NULL,
  contenido JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Servicios
CREATE TABLE servicios (
  id VARCHAR(50) PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  imagen VARCHAR(500),
  caracteristicas JSON,
  beneficios JSON,
  precio_desde DECIMAL(10,2),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Planes
CREATE TABLE planes (
  id VARCHAR(50) PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  periodo VARCHAR(50),
  descripcion TEXT,
  caracteristicas JSON,
  destacado BOOLEAN DEFAULT false,
  cta_texto VARCHAR(255),
  notas TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Productos de tienda
CREATE TABLE productos_tienda (
  id VARCHAR(50) PRIMARY KEY,
  categoria VARCHAR(100) NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10,2) NOT NULL,
  precio_descuento DECIMAL(10,2),
  imagen VARCHAR(500),
  destacado BOOLEAN DEFAULT false,
  caracteristicas JSON,
  incluye JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Episodios de blog
CREATE TABLE episodios_blog (
  id VARCHAR(50) PRIMARY KEY,
  numero INT NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  fecha DATE NOT NULL,
  duracion VARCHAR(20),
  invitado VARCHAR(255),
  cargo_invitado VARCHAR(255),
  imagen VARCHAR(500),
  audio_url VARCHAR(500),
  destacado BOOLEAN DEFAULT false,
  temas JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Notas de Implementación

1. **Validación de Datos:** Implementar validación en todos los endpoints
2. **Sanitización:** Sanitizar todos los inputs para prevenir XSS
3. **Rate Limiting:** Implementar límites de rate para prevenir abuso
4. **Logging:** Registrar todas las operaciones para auditoría
5. **Backup:** Implementar backup automático de la base de datos
6. **Cache:** Implementar cache para mejorar rendimiento
7. **Compresión:** Habilitar compresión gzip para respuestas
8. **SSL:** Usar HTTPS en producción

## Testing

Implementar tests para:
- Todos los endpoints GET
- Todos los endpoints PUT/POST/DELETE
- Validación de datos
- Manejo de errores
- Autenticación
- CORS

## Deployment

- **Producción:** `https://boost-agency-api.onrender.com`
- **Staging:** `https://boost-agency-api-staging.onrender.com`
- **Desarrollo:** `http://localhost:3000`

## Monitoreo

Implementar monitoreo para:
- Uptime del servidor
- Tiempo de respuesta
- Errores 4xx y 5xx
- Uso de recursos
- Logs de aplicación
