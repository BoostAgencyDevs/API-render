/**
 * @fileoverview Servidor Express para Boost Agency
 * 
 * Este servidor proporciona la API backend para la aplicación Angular,
 * manejando contenido dinámico, carga de archivos y servir la aplicación frontend.
 * 
 * @author Boost Agency Development Team
 * @version 1.0.0
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;  // Puerto configurable por variable de entorno

// Crear directorio uploads si no existe
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuración de middleware
app.use(helmet());  // Seguridad básica
app.use(cors());  // Habilitar CORS para peticiones cross-origin
app.use(express.json({ limit: '10mb' }));  // Parsear JSON en el body de las peticiones
app.use(express.urlencoded({ extended: true, limit: '10mb' }));  // Parsear datos de formularios

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP por ventana
  message: {
    success: false,
    error: 'Demasiadas peticiones, intenta de nuevo más tarde'
  }
});
app.use('/api/', limiter);

/**
 * Configuración de Multer para carga de archivos
 * 
 * Almacena archivos en el directorio 'uploads' con nombres únicos
 * basados en timestamp para evitar conflictos
 */
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'uploads/'))  // Directorio de destino
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)  // Nombre único con timestamp
    }
});

const upload = multer({ storage: storage });

// Servir archivos estáticos desde el directorio uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/**
 * RUTAS DE LA API
 */

// Importar rutas
const authRoutes = require('./routes/auth');
const contenidoRoutes = require('./routes/contenido');
const serviciosRoutes = require('./routes/servicios');
const blogRoutes = require('./routes/blog');
const planesRoutes = require('./routes/planes');
const leadsRoutes = require('./routes/leads');
const tiendaRoutes = require('./routes/tienda');
const uploadRoutes = require('./routes/upload');

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/contenido', contenidoRoutes);
app.use('/api/servicios', serviciosRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/planes', planesRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/tienda', tiendaRoutes);
app.use('/api/upload', uploadRoutes);

// Ruta /api/contenido manejada por routes/contenido.js

/**
 * POST /api/upload (compatibilidad con frontend existente)
 * Sube un archivo al servidor
 * 
 * @param {File} file - Archivo a subir (usando multer)
 * @returns {Object} Respuesta con información del archivo subido
 */
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ 
        success: true,
        file: `/uploads/${req.file.filename}`  // Ruta del archivo subido
    });
});

/**
 * CONFIGURACIÓN PARA PRODUCCIÓN
 * 
 * Solo API - No sirve frontend
 */

// Ruta de bienvenida para la API
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '🚀 Boost Agency API está funcionando correctamente',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            contenido: '/api/contenido',
            servicios: '/api/servicios',
            blog: '/api/blog',
            planes: '/api/planes',
            leads: '/api/leads',
            tienda: '/api/tienda',
            upload: '/api/upload'
        },
        documentation: 'https://github.com/BoostAgencyDevs/API-render'
    });
});

// Ruta catch-all para APIs no encontradas
app.get('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint no encontrado',
        message: 'Consulta la documentación de la API',
        availableEndpoints: [
            'GET /',
            'POST /api/auth/login',
            'GET /api/contenido',
            'GET /api/servicios',
            'GET /api/blog/episodios',
            'GET /api/planes',
            'GET /api/leads',
            'GET /api/tienda/productos',
            'POST /api/upload'
        ]
    });
});

/**
 * Iniciar el servidor
 * 
 * Escucha en el puerto configurado y muestra mensaje de confirmación
 */
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Boost Agency API server is running on port ${PORT}`);
    console.log(`📁 Upload directory: ${uploadsDir}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
