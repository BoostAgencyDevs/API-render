# 🚀 Boost Agency API - Despliegue en Render

## 📋 Información General

Esta API está configurada para desplegarse automáticamente en Render.com. El servidor Express maneja el contenido dinámico, carga de archivos y sirve la aplicación Angular frontend.

## 🔧 Configuración Técnica

### Dependencias
- **Node.js**: v18+ (recomendado)
- **Express**: ^4.18.2
- **CORS**: ^2.8.5
- **Multer**: ^1.4.5-lts.1

### Variables de Entorno
- `PORT`: Puerto del servidor (Render lo asigna automáticamente)
- `NODE_ENV`: Entorno de ejecución (production)

## 🚀 Pasos para Desplegar en Render

### 1. Preparar el Repositorio
```bash
# Asegúrate de que el backend esté en la raíz del repositorio o en una carpeta específica
# El archivo render.yaml debe estar en la raíz del proyecto
```

### 2. Crear Servicio en Render

1. **Accede a Render Dashboard**
   - Ve a [render.com](https://render.com)
   - Inicia sesión o crea una cuenta

2. **Crear Nuevo Servicio Web**
   - Haz clic en "New +" → "Web Service"
   - Conecta tu repositorio de GitHub/GitLab

3. **Configuración del Servicio**
   ```
   Name: boost-agency-api
   Environment: Node
   Region: Oregon (US West) o Frankfurt (EU Central)
   Branch: main
   Root Directory: backend
   Build Command: npm install
   Start Command: npm start
   ```

4. **Variables de Entorno**
   ```
   NODE_ENV=production
   PORT=10000
   ```

### 3. Configuración Avanzada

#### Health Check
- **Path**: `/api/contenido`
- **Timeout**: 30 segundos

#### Auto Deploy
- ✅ Habilitado para la rama `main`
- ✅ Deploy automático en cada push

## 📁 Estructura del Proyecto

```
backend/
├── content/                 # Contenido JSON del sitio
│   ├── contenido.json
│   ├── blog.json
│   ├── servicios.json
│   └── ...
├── uploads/                 # Archivos subidos (se crea automáticamente)
├── server.js               # Servidor principal
├── package.json            # Dependencias
├── render.yaml             # Configuración de Render
├── env.example             # Variables de entorno de ejemplo
└── README_RENDER.md        # Esta documentación
```

## 🔗 Endpoints de la API

### GET /api/contenido
Obtiene el contenido dinámico del sitio web.

**Respuesta:**
```json
{
  "inicio": { ... },
  "nosotros": { ... },
  "servicios": { ... }
}
```

### POST /api/upload
Sube un archivo al servidor.

**Parámetros:**
- `file`: Archivo a subir (multipart/form-data)

**Respuesta:**
```json
{
  "success": true,
  "file": "/uploads/filename.ext"
}
```

### GET /*
Sirve la aplicación Angular frontend (SPA).

## 🛠️ Desarrollo Local

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Ejecutar en modo producción
npm start
```

## 🔍 Monitoreo y Logs

- **Logs**: Disponibles en el dashboard de Render
- **Métricas**: CPU, memoria y tiempo de respuesta
- **Health Check**: Verificación automática cada 30 segundos

## 🚨 Solución de Problemas

### Error: "Cannot find module"
```bash
# Verificar que package.json esté en el directorio correcto
# Reinstalar dependencias
npm install
```

### Error: "Port already in use"
- Render asigna automáticamente el puerto
- No configures PORT manualmente en producción

### Error: "Upload directory not found"
- El directorio se crea automáticamente
- Verificar permisos de escritura

## 📞 Soporte

Para problemas específicos de Render:
- [Documentación de Render](https://render.com/docs)
- [Soporte de Render](https://render.com/help)

## 🔄 Actualizaciones

Para actualizar la API:
1. Haz push a la rama `main`
2. Render desplegará automáticamente
3. Verifica los logs en el dashboard

---

**Desarrollado por Boost Agency** 🚀
