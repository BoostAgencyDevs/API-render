/**
 * @fileoverview Rutas de gestión de contenido para Boost Agency API
 * 
 * Maneja CRUD de contenido principal del sitio web
 * 
 * @author Boost Agency Development Team
 * @version 1.0.0
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const { authenticateToken, requireRole } = require('../middleware/auth');
const router = express.Router();

// Cargar contenido desde archivo JSON
const loadContenido = () => {
  try {
    const contenidoPath = path.join(__dirname, '../content/contenido.json');
    return JSON.parse(fs.readFileSync(contenidoPath, 'utf8'));
  } catch (error) {
    console.error('Error loading contenido:', error);
    return {};
  }
};

// Guardar contenido en archivo JSON
const saveContenido = (contenido) => {
  try {
    const contenidoPath = path.join(__dirname, '../content/contenido.json');
    fs.writeFileSync(contenidoPath, JSON.stringify(contenido, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving contenido:', error);
    return false;
  }
};

/**
 * GET /api/contenido
 * Obtiene todo el contenido del sitio
 */
router.get('/', (req, res) => {
  try {
    const contenido = loadContenido();
    res.json({
      success: true,
      data: contenido
    });
  } catch (error) {
    console.error('Error getting contenido:', error);
    res.status(500).json({
      success: false,
      error: 'Error al cargar el contenido'
    });
  }
});

/**
 * PUT /api/contenido/inicio
 * Actualiza el contenido de la página de inicio
 */
router.put('/inicio', authenticateToken, requireRole(['admin', 'editor']), (req, res) => {
  try {
    const { hero, servicios_destacados, estadisticas } = req.body;
    
    const contenido = loadContenido();
    contenido.inicio = {
      hero: hero || contenido.inicio?.hero || {},
      servicios_destacados: servicios_destacados || contenido.inicio?.servicios_destacados || [],
      estadisticas: estadisticas || contenido.inicio?.estadisticas || {}
    };

    if (saveContenido(contenido)) {
      res.json({
        success: true,
        message: 'Contenido de inicio actualizado exitosamente',
        data: contenido.inicio
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error al guardar el contenido'
      });
    }
  } catch (error) {
    console.error('Error updating inicio:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * PUT /api/contenido/nosotros
 * Actualiza el contenido de la página nosotros
 */
router.put('/nosotros', authenticateToken, requireRole(['admin', 'editor']), (req, res) => {
  try {
    const { titulo, descripcion, mision, vision, valores, equipo } = req.body;
    
    const contenido = loadContenido();
    contenido.nosotros = {
      titulo: titulo || contenido.nosotros?.titulo || '',
      descripcion: descripcion || contenido.nosotros?.descripcion || '',
      mision: mision || contenido.nosotros?.mision || '',
      vision: vision || contenido.nosotros?.vision || '',
      valores: valores || contenido.nosotros?.valores || [],
      equipo: equipo || contenido.nosotros?.equipo || []
    };

    if (saveContenido(contenido)) {
      res.json({
        success: true,
        message: 'Contenido de nosotros actualizado exitosamente',
        data: contenido.nosotros
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error al guardar el contenido'
      });
    }
  } catch (error) {
    console.error('Error updating nosotros:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * PUT /api/contenido/contacto
 * Actualiza el contenido de la página de contacto
 */
router.put('/contacto', authenticateToken, requireRole(['admin', 'editor']), (req, res) => {
  try {
    const { titulo, descripcion, telefono, email, direccion, horarios, redes_sociales } = req.body;
    
    const contenido = loadContenido();
    contenido.contacto = {
      titulo: titulo || contenido.contacto?.titulo || '',
      descripcion: descripcion || contenido.contacto?.descripcion || '',
      telefono: telefono || contenido.contacto?.telefono || '',
      email: email || contenido.contacto?.email || '',
      direccion: direccion || contenido.contacto?.direccion || '',
      horarios: horarios || contenido.contacto?.horarios || '',
      redes_sociales: redes_sociales || contenido.contacto?.redes_sociales || {}
    };

    if (saveContenido(contenido)) {
      res.json({
        success: true,
        message: 'Contenido de contacto actualizado exitosamente',
        data: contenido.contacto
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error al guardar el contenido'
      });
    }
  } catch (error) {
    console.error('Error updating contacto:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * PUT /api/contenido/footer
 * Actualiza el contenido del footer
 */
router.put('/footer', authenticateToken, requireRole(['admin', 'editor']), (req, res) => {
  try {
    const { descripcion, enlaces_rapidos, copyright } = req.body;
    
    const contenido = loadContenido();
    contenido.footer = {
      descripcion: descripcion || contenido.footer?.descripcion || '',
      enlaces_rapidos: enlaces_rapidos || contenido.footer?.enlaces_rapidos || [],
      copyright: copyright || contenido.footer?.copyright || ''
    };

    if (saveContenido(contenido)) {
      res.json({
        success: true,
        message: 'Contenido del footer actualizado exitosamente',
        data: contenido.footer
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error al guardar el contenido'
      });
    }
  } catch (error) {
    console.error('Error updating footer:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * GET /api/contenido/inicio
 * Obtiene solo el contenido de inicio
 */
router.get('/inicio', (req, res) => {
  try {
    const contenido = loadContenido();
    res.json({
      success: true,
      data: contenido.inicio || {}
    });
  } catch (error) {
    console.error('Error getting inicio:', error);
    res.status(500).json({
      success: false,
      error: 'Error al cargar el contenido de inicio'
    });
  }
});

/**
 * GET /api/contenido/nosotros
 * Obtiene solo el contenido de nosotros
 */
router.get('/nosotros', (req, res) => {
  try {
    const contenido = loadContenido();
    res.json({
      success: true,
      data: contenido.nosotros || {}
    });
  } catch (error) {
    console.error('Error getting nosotros:', error);
    res.status(500).json({
      success: false,
      error: 'Error al cargar el contenido de nosotros'
    });
  }
});

/**
 * GET /api/contenido/contacto
 * Obtiene solo el contenido de contacto
 */
router.get('/contacto', (req, res) => {
  try {
    const contenido = loadContenido();
    res.json({
      success: true,
      data: contenido.contacto || {}
    });
  } catch (error) {
    console.error('Error getting contacto:', error);
    res.status(500).json({
      success: false,
      error: 'Error al cargar el contenido de contacto'
    });
  }
});

module.exports = router;
