/**
 * @fileoverview Rutas de gestión de archivos para Boost Agency API
 * 
 * Maneja upload, listado y eliminación de archivos
 * 
 * @author Boost Agency Development Team
 * @version 1.0.0
 */

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken, requireRole } = require('../middleware/auth');
const router = express.Router();

// Configuración de multer para upload de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB límite
  },
  fileFilter: (req, file, cb) => {
    // Tipos de archivo permitidos
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|mp3|mp4|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'));
    }
  }
});

// Cargar archivos desde archivo JSON
const loadFiles = () => {
  try {
    const filesPath = path.join(__dirname, '../database/files.json');
    if (fs.existsSync(filesPath)) {
      return JSON.parse(fs.readFileSync(filesPath, 'utf8'));
    }
    return [];
  } catch (error) {
    console.error('Error loading files:', error);
    return [];
  }
};

// Guardar archivos en archivo JSON
const saveFiles = (files) => {
  try {
    const filesPath = path.join(__dirname, '../database/files.json');
    const filesDir = path.dirname(filesPath);
    
    if (!fs.existsSync(filesDir)) {
      fs.mkdirSync(filesDir, { recursive: true });
    }
    
    fs.writeFileSync(filesPath, JSON.stringify(files, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving files:', error);
    return false;
  }
};

/**
 * POST /api/upload
 * Sube un archivo al servidor
 */
router.post('/', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No se subió ningún archivo'
      });
    }

    const files = loadFiles();
    const nuevoArchivo = {
      id: uuidv4(),
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: `/uploads/${req.file.filename}`,
      size: req.file.size,
      mimeType: req.file.mimetype,
      uploadedAt: new Date().toISOString(),
      uploadedBy: req.user ? req.user.id : 'anonymous'
    };

    files.push(nuevoArchivo);
    saveFiles(files);

    res.json({
      success: true,
      message: 'Archivo subido exitosamente',
      data: nuevoArchivo
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      success: false,
      error: 'Error al subir el archivo'
    });
  }
});

/**
 * GET /api/upload/list
 * Lista todos los archivos subidos
 */
router.get('/list', authenticateToken, requireRole(['admin', 'editor']), (req, res) => {
  try {
    const { categoria, page = 1, limit = 20 } = req.query;
    let files = loadFiles();

    // Filtrar por categoría si se especifica
    if (categoria) {
      files = files.filter(file => {
        const ext = path.extname(file.originalName).toLowerCase();
        switch (categoria) {
          case 'imagenes':
            return ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);
          case 'documentos':
            return ['.pdf', '.doc', '.docx'].includes(ext);
          case 'audio':
            return ['.mp3', '.wav'].includes(ext);
          case 'video':
            return ['.mp4', '.webm'].includes(ext);
          default:
            return true;
        }
      });
    }

    // Ordenar por fecha de subida (más recientes primero)
    files.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    // Paginación
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedFiles = files.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedFiles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: files.length,
        pages: Math.ceil(files.length / limit)
      }
    });
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({
      success: false,
      error: 'Error al listar los archivos'
    });
  }
});

/**
 * GET /api/upload/:filename/info
 * Obtiene información de un archivo específico
 */
router.get('/:filename/info', authenticateToken, requireRole(['admin', 'editor']), (req, res) => {
  try {
    const { filename } = req.params;
    const files = loadFiles();
    const file = files.find(f => f.filename === filename);

    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'Archivo no encontrado'
      });
    }

    res.json({
      success: true,
      data: file
    });
  } catch (error) {
    console.error('Error getting file info:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener información del archivo'
    });
  }
});

/**
 * DELETE /api/upload/:filename
 * Elimina un archivo
 */
router.delete('/:filename', authenticateToken, requireRole(['admin']), (req, res) => {
  try {
    const { filename } = req.params;
    const files = loadFiles();
    const fileIndex = files.findIndex(f => f.filename === filename);

    if (fileIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Archivo no encontrado'
      });
    }

    const file = files[fileIndex];
    const filePath = path.join(__dirname, '../uploads', filename);

    // Eliminar archivo físico
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Eliminar de la base de datos
    files.splice(fileIndex, 1);
    saveFiles(files);

    res.json({
      success: true,
      message: 'Archivo eliminado exitosamente',
      data: file
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar el archivo'
    });
  }
});

/**
 * GET /api/upload/stats
 * Obtiene estadísticas de archivos
 */
router.get('/stats', authenticateToken, requireRole(['admin', 'editor']), (req, res) => {
  try {
    const files = loadFiles();
    
    const total = files.length;
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    
    // Estadísticas por tipo
    const porTipo = {};
    files.forEach(file => {
      const ext = path.extname(file.originalName).toLowerCase();
      porTipo[ext] = (porTipo[ext] || 0) + 1;
    });

    // Archivos recientes (últimos 7 días)
    const sieteDiasAtras = new Date();
    sieteDiasAtras.setDate(sieteDiasAtras.getDate() - 7);
    const recientes = files.filter(file => 
      new Date(file.uploadedAt) > sieteDiasAtras
    ).length;

    res.json({
      success: true,
      data: {
        total,
        totalSize,
        porTipo,
        recientes,
        tamañoPromedio: total > 0 ? Math.round(totalSize / total) : 0
      }
    });
  } catch (error) {
    console.error('Error getting file stats:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas de archivos'
    });
  }
});

module.exports = router;
