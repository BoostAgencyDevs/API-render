/**
 * @fileoverview Rutas de gestión de imágenes para Boost Agency API
 * 
 * Maneja CRUD de imágenes y archivos multimedia
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

// Configuración de multer para imágenes
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
    // Solo imágenes permitidas
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen (JPEG, JPG, PNG, GIF, WEBP, SVG)'));
    }
  }
});

// Cargar imágenes desde archivo JSON
const loadImages = () => {
  try {
    const imagesPath = path.join(__dirname, '../database/images.json');
    if (fs.existsSync(imagesPath)) {
      return JSON.parse(fs.readFileSync(imagesPath, 'utf8'));
    }
    return [];
  } catch (error) {
    console.error('Error loading images:', error);
    return [];
  }
};

// Guardar imágenes en archivo JSON
const saveImages = (images) => {
  try {
    const imagesPath = path.join(__dirname, '../database/images.json');
    const imagesDir = path.dirname(imagesPath);
    
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }
    
    fs.writeFileSync(imagesPath, JSON.stringify(images, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving images:', error);
    return false;
  }
};

/**
 * GET /api/images
 * Obtiene todas las imágenes
 */
router.get('/', authenticateToken, requireRole(['admin', 'editor']), (req, res) => {
  try {
    const { categoria, page = 1, limit = 20 } = req.query;
    let images = loadImages();

    // Filtrar por categoría si se especifica
    if (categoria) {
      images = images.filter(image => image.categoria === categoria);
    }

    // Ordenar por fecha de subida (más recientes primero)
    images.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    // Paginación
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedImages = images.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedImages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: images.length,
        pages: Math.ceil(images.length / limit)
      }
    });
  } catch (error) {
    console.error('Error getting images:', error);
    res.status(500).json({
      success: false,
      error: 'Error al cargar las imágenes'
    });
  }
});

/**
 * GET /api/images/:id
 * Obtiene una imagen específica por ID
 */
router.get('/:id', authenticateToken, requireRole(['admin', 'editor']), (req, res) => {
  try {
    const { id } = req.params;
    const images = loadImages();
    const image = images.find(img => img.id === id);

    if (!image) {
      return res.status(404).json({
        success: false,
        error: 'Imagen no encontrada'
      });
    }

    res.json({
      success: true,
      data: image
    });
  } catch (error) {
    console.error('Error getting image:', error);
    res.status(500).json({
      success: false,
      error: 'Error al cargar la imagen'
    });
  }
});

/**
 * POST /api/images/upload
 * Sube una nueva imagen
 */
router.post('/upload', authenticateToken, requireRole(['admin', 'editor']), upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No se subió ninguna imagen'
      });
    }

    const { categoria, descripcion, tags } = req.body;
    const images = loadImages();
    
    const nuevaImagen = {
      id: uuidv4(),
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: `/uploads/${req.file.filename}`,
      size: req.file.size,
      mimeType: req.file.mimetype,
      categoria: categoria || 'general',
      descripcion: descripcion || '',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      uploadedAt: new Date().toISOString(),
      uploadedBy: req.user.id
    };

    images.push(nuevaImagen);
    saveImages(images);

    res.json({
      success: true,
      message: 'Imagen subida exitosamente',
      data: nuevaImagen
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({
      success: false,
      error: 'Error al subir la imagen'
    });
  }
});

/**
 * PUT /api/images/:id
 * Actualiza información de una imagen
 */
router.put('/:id', authenticateToken, requireRole(['admin', 'editor']), (req, res) => {
  try {
    const { id } = req.params;
    const { categoria, descripcion, tags } = req.body;

    const images = loadImages();
    const imageIndex = images.findIndex(img => img.id === id);

    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Imagen no encontrada'
      });
    }

    // Actualizar imagen
    if (categoria) images[imageIndex].categoria = categoria;
    if (descripcion !== undefined) images[imageIndex].descripcion = descripcion;
    if (tags) images[imageIndex].tags = tags.split(',').map(tag => tag.trim());

    saveImages(images);

    res.json({
      success: true,
      message: 'Imagen actualizada exitosamente',
      data: images[imageIndex]
    });
  } catch (error) {
    console.error('Error updating image:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * DELETE /api/images/:id
 * Elimina una imagen
 */
router.delete('/:id', authenticateToken, requireRole(['admin']), (req, res) => {
  try {
    const { id } = req.params;
    const images = loadImages();
    const imageIndex = images.findIndex(img => img.id === id);

    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Imagen no encontrada'
      });
    }

    const image = images[imageIndex];
    const imagePath = path.join(__dirname, '../uploads', image.filename);

    // Eliminar archivo físico
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    // Eliminar de la base de datos
    images.splice(imageIndex, 1);
    saveImages(images);

    res.json({
      success: true,
      message: 'Imagen eliminada exitosamente',
      data: image
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar la imagen'
    });
  }
});

/**
 * GET /api/images/stats
 * Obtiene estadísticas de imágenes
 */
router.get('/stats', authenticateToken, requireRole(['admin', 'editor']), (req, res) => {
  try {
    const images = loadImages();
    
    const total = images.length;
    const totalSize = images.reduce((sum, image) => sum + image.size, 0);
    
    // Estadísticas por categoría
    const porCategoria = {};
    images.forEach(image => {
      const categoria = image.categoria || 'sin-categoria';
      porCategoria[categoria] = (porCategoria[categoria] || 0) + 1;
    });

    // Estadísticas por tipo
    const porTipo = {};
    images.forEach(image => {
      const ext = path.extname(image.originalName).toLowerCase();
      porTipo[ext] = (porTipo[ext] || 0) + 1;
    });

    // Imágenes recientes (últimos 7 días)
    const sieteDiasAtras = new Date();
    sieteDiasAtras.setDate(sieteDiasAtras.getDate() - 7);
    const recientes = images.filter(image => 
      new Date(image.uploadedAt) > sieteDiasAtras
    ).length;

    res.json({
      success: true,
      data: {
        total,
        totalSize,
        porCategoria,
        porTipo,
        recientes,
        tamañoPromedio: total > 0 ? Math.round(totalSize / total) : 0
      }
    });
  } catch (error) {
    console.error('Error getting image stats:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas de imágenes'
    });
  }
});

module.exports = router;
