/**
 * @fileoverview Rutas de gestión de servicios para Boost Agency API
 * 
 * Maneja CRUD de servicios ofrecidos por la agencia
 * 
 * @author Boost Agency Development Team
 * @version 1.0.0
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken, requireRole } = require('../middleware/auth');
const router = express.Router();

// Cargar servicios desde archivo JSON
const loadServicios = () => {
  try {
    const serviciosPath = path.join(__dirname, '../content/servicios.json');
    return JSON.parse(fs.readFileSync(serviciosPath, 'utf8'));
  } catch (error) {
    console.error('Error loading servicios:', error);
    return { servicios: [] };
  }
};

// Guardar servicios en archivo JSON
const saveServicios = (servicios) => {
  try {
    const serviciosPath = path.join(__dirname, '../content/servicios.json');
    fs.writeFileSync(serviciosPath, JSON.stringify(servicios, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving servicios:', error);
    return false;
  }
};

/**
 * GET /api/servicios
 * Obtiene todos los servicios
 */
router.get('/', (req, res) => {
  try {
    const data = loadServicios();
    res.json({
      success: true,
      data: data.servicios || []
    });
  } catch (error) {
    console.error('Error getting servicios:', error);
    res.status(500).json({
      success: false,
      error: 'Error al cargar los servicios'
    });
  }
});

/**
 * GET /api/servicios/:id
 * Obtiene un servicio específico por ID
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const data = loadServicios();
    const servicio = data.servicios.find(s => s.id === id);

    if (!servicio) {
      return res.status(404).json({
        success: false,
        error: 'Servicio no encontrado'
      });
    }

    res.json({
      success: true,
      data: servicio
    });
  } catch (error) {
    console.error('Error getting servicio:', error);
    res.status(500).json({
      success: false,
      error: 'Error al cargar el servicio'
    });
  }
});

/**
 * POST /api/servicios
 * Crea un nuevo servicio
 */
router.post('/', authenticateToken, requireRole(['admin', 'editor']), (req, res) => {
  try {
    const { titulo, descripcion, imagen, caracteristicas, beneficios } = req.body;

    // Validar datos requeridos
    if (!titulo || !descripcion) {
      return res.status(400).json({
        success: false,
        error: 'Título y descripción son requeridos'
      });
    }

    const data = loadServicios();
    const nuevoServicio = {
      id: uuidv4(),
      titulo,
      descripcion,
      imagen: imagen || '/uploads/servicio-default.jpg',
      caracteristicas: caracteristicas || [],
      beneficios: beneficios || []
    };

    data.servicios.push(nuevoServicio);

    if (saveServicios(data)) {
      res.status(201).json({
        success: true,
        message: 'Servicio creado exitosamente',
        data: nuevoServicio
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error al guardar el servicio'
      });
    }
  } catch (error) {
    console.error('Error creating servicio:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * PUT /api/servicios/:id
 * Actualiza un servicio existente
 */
router.put('/:id', authenticateToken, requireRole(['admin', 'editor']), (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion, imagen, caracteristicas, beneficios } = req.body;

    const data = loadServicios();
    const servicioIndex = data.servicios.findIndex(s => s.id === id);

    if (servicioIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Servicio no encontrado'
      });
    }

    // Actualizar servicio
    data.servicios[servicioIndex] = {
      ...data.servicios[servicioIndex],
      titulo: titulo || data.servicios[servicioIndex].titulo,
      descripcion: descripcion || data.servicios[servicioIndex].descripcion,
      imagen: imagen || data.servicios[servicioIndex].imagen,
      caracteristicas: caracteristicas || data.servicios[servicioIndex].caracteristicas,
      beneficios: beneficios || data.servicios[servicioIndex].beneficios
    };

    if (saveServicios(data)) {
      res.json({
        success: true,
        message: 'Servicio actualizado exitosamente',
        data: data.servicios[servicioIndex]
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error al guardar el servicio'
      });
    }
  } catch (error) {
    console.error('Error updating servicio:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * DELETE /api/servicios/:id
 * Elimina un servicio
 */
router.delete('/:id', authenticateToken, requireRole(['admin']), (req, res) => {
  try {
    const { id } = req.params;

    const data = loadServicios();
    const servicioIndex = data.servicios.findIndex(s => s.id === id);

    if (servicioIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Servicio no encontrado'
      });
    }

    const servicioEliminado = data.servicios.splice(servicioIndex, 1)[0];

    if (saveServicios(data)) {
      res.json({
        success: true,
        message: 'Servicio eliminado exitosamente',
        data: servicioEliminado
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error al guardar los cambios'
      });
    }
  } catch (error) {
    console.error('Error deleting servicio:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;
