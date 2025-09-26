/**
 * @fileoverview Rutas de gestión de planes para Boost Agency API
 * 
 * Maneja CRUD de planes de precios y beneficios
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

// Cargar planes desde archivo JSON
const loadPlanes = () => {
  try {
    const planesPath = path.join(__dirname, '../content/planes.json');
    return JSON.parse(fs.readFileSync(planesPath, 'utf8'));
  } catch (error) {
    console.error('Error loading planes:', error);
    return { planes: [], beneficios_generales: [], preguntas_frecuentes: [] };
  }
};

// Guardar planes en archivo JSON
const savePlanes = (planes) => {
  try {
    const planesPath = path.join(__dirname, '../content/planes.json');
    fs.writeFileSync(planesPath, JSON.stringify(planes, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving planes:', error);
    return false;
  }
};

/**
 * GET /api/planes
 * Obtiene todos los planes
 */
router.get('/', (req, res) => {
  try {
    const data = loadPlanes();
    res.json({
      success: true,
      data: data.planes || []
    });
  } catch (error) {
    console.error('Error getting planes:', error);
    res.status(500).json({
      success: false,
      error: 'Error al cargar los planes'
    });
  }
});

/**
 * GET /api/planes/:id
 * Obtiene un plan específico por ID
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const data = loadPlanes();
    const plan = data.planes.find(p => p.id === id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plan no encontrado'
      });
    }

    res.json({
      success: true,
      data: plan
    });
  } catch (error) {
    console.error('Error getting plan:', error);
    res.status(500).json({
      success: false,
      error: 'Error al cargar el plan'
    });
  }
});

/**
 * POST /api/planes
 * Crea un nuevo plan
 */
router.post('/', authenticateToken, requireRole(['admin', 'editor']), (req, res) => {
  try {
    const { 
      nombre, 
      precio, 
      periodo, 
      descripcion, 
      caracteristicas, 
      destacado, 
      cta_texto, 
      notas 
    } = req.body;

    // Validar datos requeridos
    if (!nombre || !precio || !periodo) {
      return res.status(400).json({
        success: false,
        error: 'Nombre, precio y período son requeridos'
      });
    }

    const data = loadPlanes();
    const nuevoPlan = {
      id: uuidv4(),
      nombre,
      precio,
      periodo,
      descripcion: descripcion || '',
      caracteristicas: caracteristicas || [],
      destacado: destacado || false,
      cta_texto: cta_texto || 'Comenzar Ahora',
      notas: notas || ''
    };

    data.planes.push(nuevoPlan);

    if (savePlanes(data)) {
      res.status(201).json({
        success: true,
        message: 'Plan creado exitosamente',
        data: nuevoPlan
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error al guardar el plan'
      });
    }
  } catch (error) {
    console.error('Error creating plan:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * PUT /api/planes/:id
 * Actualiza un plan existente
 */
router.put('/:id', authenticateToken, requireRole(['admin', 'editor']), (req, res) => {
  try {
    const { id } = req.params;
    const { 
      nombre, 
      precio, 
      periodo, 
      descripcion, 
      caracteristicas, 
      destacado, 
      cta_texto, 
      notas 
    } = req.body;

    const data = loadPlanes();
    const planIndex = data.planes.findIndex(p => p.id === id);

    if (planIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Plan no encontrado'
      });
    }

    // Actualizar plan
    data.planes[planIndex] = {
      ...data.planes[planIndex],
      nombre: nombre || data.planes[planIndex].nombre,
      precio: precio || data.planes[planIndex].precio,
      periodo: periodo || data.planes[planIndex].periodo,
      descripcion: descripcion || data.planes[planIndex].descripcion,
      caracteristicas: caracteristicas || data.planes[planIndex].caracteristicas,
      destacado: destacado !== undefined ? destacado : data.planes[planIndex].destacado,
      cta_texto: cta_texto || data.planes[planIndex].cta_texto,
      notas: notas || data.planes[planIndex].notas
    };

    if (savePlanes(data)) {
      res.json({
        success: true,
        message: 'Plan actualizado exitosamente',
        data: data.planes[planIndex]
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error al guardar el plan'
      });
    }
  } catch (error) {
    console.error('Error updating plan:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * DELETE /api/planes/:id
 * Elimina un plan
 */
router.delete('/:id', authenticateToken, requireRole(['admin']), (req, res) => {
  try {
    const { id } = req.params;

    const data = loadPlanes();
    const planIndex = data.planes.findIndex(p => p.id === id);

    if (planIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Plan no encontrado'
      });
    }

    const planEliminado = data.planes.splice(planIndex, 1)[0];

    if (savePlanes(data)) {
      res.json({
        success: true,
        message: 'Plan eliminado exitosamente',
        data: planEliminado
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error al guardar los cambios'
      });
    }
  } catch (error) {
    console.error('Error deleting plan:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * GET /api/planes/beneficios
 * Obtiene los beneficios generales
 */
router.get('/beneficios', (req, res) => {
  try {
    const data = loadPlanes();
    res.json({
      success: true,
      data: data.beneficios_generales || []
    });
  } catch (error) {
    console.error('Error getting beneficios:', error);
    res.status(500).json({
      success: false,
      error: 'Error al cargar los beneficios'
    });
  }
});

/**
 * PUT /api/planes/beneficios
 * Actualiza los beneficios generales
 */
router.put('/beneficios', authenticateToken, requireRole(['admin', 'editor']), (req, res) => {
  try {
    const { beneficios } = req.body;

    const data = loadPlanes();
    data.beneficios_generales = beneficios || [];

    if (savePlanes(data)) {
      res.json({
        success: true,
        message: 'Beneficios actualizados exitosamente',
        data: data.beneficios_generales
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error al guardar los beneficios'
      });
    }
  } catch (error) {
    console.error('Error updating beneficios:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * GET /api/planes/faq
 * Obtiene las preguntas frecuentes
 */
router.get('/faq', (req, res) => {
  try {
    const data = loadPlanes();
    res.json({
      success: true,
      data: data.preguntas_frecuentes || []
    });
  } catch (error) {
    console.error('Error getting FAQ:', error);
    res.status(500).json({
      success: false,
      error: 'Error al cargar las preguntas frecuentes'
    });
  }
});

/**
 * PUT /api/planes/faq
 * Actualiza las preguntas frecuentes
 */
router.put('/faq', authenticateToken, requireRole(['admin', 'editor']), (req, res) => {
  try {
    const { preguntas_frecuentes } = req.body;

    const data = loadPlanes();
    data.preguntas_frecuentes = preguntas_frecuentes || [];

    if (savePlanes(data)) {
      res.json({
        success: true,
        message: 'Preguntas frecuentes actualizadas exitosamente',
        data: data.preguntas_frecuentes
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error al guardar las preguntas frecuentes'
      });
    }
  } catch (error) {
    console.error('Error updating FAQ:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;
