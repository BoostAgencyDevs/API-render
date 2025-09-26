/**
 * @fileoverview Rutas de gestión de leads para Boost Agency API
 * 
 * Maneja CRUD de leads y estadísticas del CRM
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

// Cargar leads desde archivo JSON
const loadLeads = () => {
  try {
    const leadsPath = path.join(__dirname, '../content/formularios/leads.json');
    return JSON.parse(fs.readFileSync(leadsPath, 'utf8'));
  } catch (error) {
    console.error('Error loading leads:', error);
    return { leads: [], configuracion: {} };
  }
};

// Guardar leads en archivo JSON
const saveLeads = (leads) => {
  try {
    const leadsPath = path.join(__dirname, '../content/formularios/leads.json');
    fs.writeFileSync(leadsPath, JSON.stringify(leads, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving leads:', error);
    return false;
  }
};

/**
 * GET /api/leads
 * Obtiene todos los leads con filtros opcionales
 */
router.get('/', (req, res) => {
  try {
    const { estado, servicio, fecha_desde, fecha_hasta, page = 1, limit = 20 } = req.query;
    const data = loadLeads();
    let leads = data.leads || [];

    // Aplicar filtros
    if (estado) {
      leads = leads.filter(lead => lead.estado === estado);
    }
    
    if (servicio) {
      leads = leads.filter(lead => lead.servicio_interes === servicio);
    }
    
    if (fecha_desde) {
      leads = leads.filter(lead => new Date(lead.fecha) >= new Date(fecha_desde));
    }
    
    if (fecha_hasta) {
      leads = leads.filter(lead => new Date(lead.fecha) <= new Date(fecha_hasta));
    }

    // Ordenar por fecha (más recientes primero)
    leads.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    // Paginación
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedLeads = leads.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedLeads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: leads.length,
        pages: Math.ceil(leads.length / limit)
      }
    });
  } catch (error) {
    console.error('Error getting leads:', error);
    res.status(500).json({
      success: false,
      error: 'Error al cargar los leads'
    });
  }
});

/**
 * GET /api/leads/:id
 * Obtiene un lead específico por ID
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const data = loadLeads();
    const lead = data.leads.find(l => l.id === id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead no encontrado'
      });
    }

    res.json({
      success: true,
      data: lead
    });
  } catch (error) {
    console.error('Error getting lead:', error);
    res.status(500).json({
      success: false,
      error: 'Error al cargar el lead'
    });
  }
});

/**
 * POST /api/leads
 * Crea un nuevo lead (desde formulario web)
 */
router.post('/', (req, res) => {
  try {
    const { 
      nombre, 
      email, 
      telefono, 
      empresa, 
      servicio_interes, 
      presupuesto, 
      mensaje, 
      origen = 'formulario-web' 
    } = req.body;

    // Validar datos requeridos
    if (!nombre || !email || !telefono || !servicio_interes) {
      return res.status(400).json({
        success: false,
        error: 'Nombre, email, teléfono y servicio de interés son requeridos'
      });
    }

    const data = loadLeads();
    const nuevoLead = {
      id: uuidv4(),
      fecha: new Date().toISOString(),
      nombre,
      email,
      telefono,
      empresa: empresa || '',
      servicio_interes,
      presupuesto: presupuesto || '',
      mensaje: mensaje || '',
      origen,
      estado: 'nuevo'
    };

    data.leads.push(nuevoLead);

    if (saveLeads(data)) {
      res.status(201).json({
        success: true,
        message: 'Lead creado exitosamente',
        data: nuevoLead
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error al guardar el lead'
      });
    }
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * PUT /api/leads/:id/estado
 * Actualiza el estado de un lead
 */
router.put('/:id/estado', authenticateToken, requireRole(['admin', 'editor']), (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    // Validar estado
    const estadosValidos = ['nuevo', 'contactado', 'calificado', 'cerrado'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        error: 'Estado inválido. Estados válidos: ' + estadosValidos.join(', ')
      });
    }

    const data = loadLeads();
    const leadIndex = data.leads.findIndex(l => l.id === id);

    if (leadIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Lead no encontrado'
      });
    }

    data.leads[leadIndex].estado = estado;

    if (saveLeads(data)) {
      res.json({
        success: true,
        message: 'Estado del lead actualizado exitosamente',
        data: data.leads[leadIndex]
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error al guardar el lead'
      });
    }
  } catch (error) {
    console.error('Error updating lead estado:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * PUT /api/leads/:id
 * Actualiza un lead completo
 */
router.put('/:id', authenticateToken, requireRole(['admin', 'editor']), (req, res) => {
  try {
    const { id } = req.params;
    const { 
      nombre, 
      email, 
      telefono, 
      empresa, 
      servicio_interes, 
      presupuesto, 
      mensaje, 
      estado 
    } = req.body;

    const data = loadLeads();
    const leadIndex = data.leads.findIndex(l => l.id === id);

    if (leadIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Lead no encontrado'
      });
    }

    // Actualizar lead
    data.leads[leadIndex] = {
      ...data.leads[leadIndex],
      nombre: nombre || data.leads[leadIndex].nombre,
      email: email || data.leads[leadIndex].email,
      telefono: telefono || data.leads[leadIndex].telefono,
      empresa: empresa || data.leads[leadIndex].empresa,
      servicio_interes: servicio_interes || data.leads[leadIndex].servicio_interes,
      presupuesto: presupuesto || data.leads[leadIndex].presupuesto,
      mensaje: mensaje || data.leads[leadIndex].mensaje,
      estado: estado || data.leads[leadIndex].estado
    };

    if (saveLeads(data)) {
      res.json({
        success: true,
        message: 'Lead actualizado exitosamente',
        data: data.leads[leadIndex]
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error al guardar el lead'
      });
    }
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * DELETE /api/leads/:id
 * Elimina un lead
 */
router.delete('/:id', authenticateToken, requireRole(['admin']), (req, res) => {
  try {
    const { id } = req.params;

    const data = loadLeads();
    const leadIndex = data.leads.findIndex(l => l.id === id);

    if (leadIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Lead no encontrado'
      });
    }

    const leadEliminado = data.leads.splice(leadIndex, 1)[0];

    if (saveLeads(data)) {
      res.json({
        success: true,
        message: 'Lead eliminado exitosamente',
        data: leadEliminado
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error al guardar los cambios'
      });
    }
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * GET /api/leads/estadisticas
 * Obtiene estadísticas de leads
 */
router.get('/estadisticas', authenticateToken, requireRole(['admin', 'editor']), (req, res) => {
  try {
    const data = loadLeads();
    const leads = data.leads || [];

    // Estadísticas generales
    const total = leads.length;
    const nuevos = leads.filter(l => l.estado === 'nuevo').length;
    const contactados = leads.filter(l => l.estado === 'contactado').length;
    const calificados = leads.filter(l => l.estado === 'calificado').length;
    const cerrados = leads.filter(l => l.estado === 'cerrado').length;

    // Estadísticas por servicio
    const porServicio = {};
    leads.forEach(lead => {
      const servicio = lead.servicio_interes;
      porServicio[servicio] = (porServicio[servicio] || 0) + 1;
    });

    // Estadísticas por mes (últimos 12 meses)
    const porMes = {};
    const ahora = new Date();
    for (let i = 0; i < 12; i++) {
      const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      const mes = fecha.toISOString().substring(0, 7);
      porMes[mes] = 0;
    }

    leads.forEach(lead => {
      const mes = lead.fecha.substring(0, 7);
      if (porMes[mes] !== undefined) {
        porMes[mes]++;
      }
    });

    res.json({
      success: true,
      data: {
        total,
        nuevos,
        contactados,
        calificados,
        cerrados,
        por_servicio: porServicio,
        por_mes: porMes
      }
    });
  } catch (error) {
    console.error('Error getting estadisticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al cargar las estadísticas'
    });
  }
});

module.exports = router;
