# 🚀 Boost Agency API - Despliegue en Render

## 📋 Información General

Esta API está configurada para desplegarse automáticamente en Render.com. El servidor Express maneja el contenido dinámico, carga de archivos, autenticación JWT y todas las APIs necesarias para el panel de control.

## 🔧 Configuración Técnica

### Dependencias
- **Node.js**: v18+ (recomendado)
- **Express**: ^4.18.2
- **CORS**: ^2.8.5
- **Multer**: ^1.4.5-lts.1
- **JWT**: ^9.0.0
- **bcryptjs**: ^2.4.3
- **Helmet**: ^7.0.0
- **Rate Limiting**: ^6.8.0

### Variables de Entorno (OBLIGATORIAS)
- `NODE_ENV`: production
- `PORT`: 10000
- `JWT_SECRET`: boost-agency-super-secret-key-2024

## 🚀 Pasos para Desplegar en Render

### 1. Subir Código a GitHub
```bash
# Asegúrate de estar en el directorio raíz del proyecto
cd C:\Users\edizo\Desktop\Pagina_Johana

# Agregar todos los archivos
git add .

# Commit con mensaje descriptivo
git commit -m "Backend completo con APIs para panel de control - Listo para Render"

# Subir a GitHub
git push origin main
```

**Nota**: El proyecto se sube a GitHub con todos los archivos en la raíz del repositorio. Render usará la raíz del repositorio como Root Directory (dejar vacío).

### 2. Crear Servicio en Render

1. **Accede a Render Dashboard**
   - Ve a [render.com](https://render.com)
   - Inicia sesión o crea una cuenta

2. **Crear Nuevo Servicio Web**
   - Haz clic en "New +" → "Web Service"
   - Conecta tu repositorio de GitHub

3. **Configuración del Servicio**
   ```
   Name: boost-agency-api
   Environment: Node
   Region: Oregon (US West) o Frankfurt (EU Central)
   Branch: main
   Root Directory: (dejar vacío - usar raíz del repositorio)
   Build Command: npm install
   Start Command: npm start
   ```

   **Importante**: 
   - El Root Directory debe estar **VACÍO** (usar la raíz del repositorio)
   - Render buscará el `package.json` en la raíz del repositorio
   - El servidor se ejecutará desde la raíz del repositorio

4. **Variables de Entorno**
   ```
   NODE_ENV=production
   PORT=10000
   JWT_SECRET=boost-agency-super-secret-key-2024
   ```
   
   **Nota**: Render detecta automáticamente el archivo `env` en la raíz del repositorio.

### 3. Configuración Avanzada

#### Health Check
- **Path**: `/api/contenido`
- **Timeout**: 30 segundos

#### Auto Deploy
- ✅ Habilitado para la rama `main`
- ✅ Deploy automático en cada push

## 📁 Estructura del Proyecto

### Estructura del Repositorio API-render
```
API-render/                 # Repositorio raíz (Root Directory en Render)
├── content/                # Contenido JSON del sitio
│   ├── contenido.json
│   ├── blog.json
│   ├── servicios.json
│   ├── planes.json
│   ├── tienda.json
│   └── formularios/
├── database/               # Base de datos JSON (se crea automáticamente)
│   ├── users.json
│   └── files.json
├── middleware/             # Middleware de autenticación
│   └── auth.js
├── routes/                 # Rutas de la API
│   ├── auth.js
│   ├── contenido.js
│   ├── servicios.js
│   ├── blog.js
│   ├── planes.js
│   ├── leads.js
│   ├── tienda.js
│   └── upload.js
├── uploads/                # Archivos subidos (se crea automáticamente)
├── server.js               # Servidor principal
├── package.json            # Dependencias
├── render.yaml             # Configuración de Render
├── env                     # Variables de entorno para Render
├── .gitignore              # Archivos a ignorar en Git
└── README_RENDER.md        # Esta documentación
```

### Lo que Render Ve (Root Directory vacío)
```
API-render/                 # Root Directory en Render (raíz del repositorio)
├── content/
├── database/
├── middleware/
├── routes/
├── uploads/
├── server.js
├── package.json
└── README_RENDER.md
```

## 🔗 Endpoints de la API

### 🔐 Autenticación
- `POST /api/auth/login` - Login de usuario
- `POST /api/auth/refresh` - Renovar token
- `GET /api/auth/me` - Usuario actual
- `POST /api/auth/logout` - Cerrar sesión

### 📄 Contenido
- `GET /api/contenido` - Todo el contenido
- `PUT /api/contenido/inicio` - Actualizar inicio
- `PUT /api/contenido/nosotros` - Actualizar nosotros
- `PUT /api/contenido/contacto` - Actualizar contacto

### 🛠️ Servicios
- `GET /api/servicios` - Listar servicios
- `POST /api/servicios` - Crear servicio
- `PUT /api/servicios/:id` - Actualizar servicio
- `DELETE /api/servicios/:id` - Eliminar servicio

### 🎙️ Blog/Podcast
- `GET /api/blog/episodios` - Listar episodios
- `POST /api/blog/episodios` - Crear episodio
- `PUT /api/blog/episodios/:id` - Actualizar episodio
- `DELETE /api/blog/episodios/:id` - Eliminar episodio

### 💰 Planes
- `GET /api/planes` - Listar planes
- `POST /api/planes` - Crear plan
- `PUT /api/planes/:id` - Actualizar plan
- `DELETE /api/planes/:id` - Eliminar plan

### 🛒 Tienda
- `GET /api/tienda/productos` - Listar productos
- `POST /api/tienda/productos` - Crear producto
- `PUT /api/tienda/productos/:id` - Actualizar producto
- `DELETE /api/tienda/productos/:id` - Eliminar producto

### 📞 Leads (CRM)
- `GET /api/leads` - Listar leads
- `POST /api/leads` - Crear lead
- `PUT /api/leads/:id/estado` - Actualizar estado
- `GET /api/leads/estadisticas` - Estadísticas

### 📁 Archivos
- `POST /api/upload` - Subir archivo
- `GET /api/upload/list` - Listar archivos
- `DELETE /api/upload/:filename` - Eliminar archivo

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

## 🔍 Verificación del Despliegue

### Health Check
```bash
curl https://boost-agency-api.onrender.com/api/contenido
```

### Probar Login
```bash
curl -X POST https://boost-agency-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@boostagency.com","password":"admin123"}'
```

### Usuario por Defecto
- **Email**: `admin@boostagency.com`
- **Password**: `admin123`
- **Rol**: `admin`

## 🔍 Monitoreo y Logs

- **Logs**: Disponibles en el dashboard de Render
- **Métricas**: CPU, memoria y tiempo de respuesta
- **Health Check**: Verificación automática cada 30 segundos

## 🚨 Solución de Problemas

### Error: "Cannot find module"
- Verificar que `package.json` esté en la raíz del repositorio
- Verificar que el Root Directory esté **VACÍO** (usar raíz del repositorio)
- Reinstalar dependencias: `npm install`

### Error: "JWT Secret not defined"
- Verificar que `JWT_SECRET` esté configurada en Render
- Reiniciar el servicio

### Error: "Port already in use"
- Render asigna automáticamente el puerto
- No configures PORT manualmente en producción

### Error: "Upload directory not found"
- El directorio se crea automáticamente
- Verificar permisos de escritura

### Error: "Root Directory not found"
- Verificar que el Root Directory esté **VACÍO** (no poner `backend`)
- El `package.json` debe estar en la raíz del repositorio

## 📱 Para tu Panel de Control

### URL de la API
```typescript
const API_URL = 'https://boost-agency-api.onrender.com';
```

### Ejemplo de Servicio Angular
```typescript
@Injectable()
export class ApiService {
  private baseUrl = 'https://boost-agency-api.onrender.com';
  
  login(email: string, password: string) {
    return this.http.post(`${this.baseUrl}/api/auth/login`, { email, password });
  }
  
  getContenido() {
    return this.http.get(`${this.baseUrl}/api/contenido`);
  }
}
```

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
