/**
 * @fileoverview Rutas de gestión de blog/podcast para Boost Agency API
 * 
 * Maneja CRUD de episodios del podcast y configuración
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

// Cargar blog desde archivo JSON
const loadBlog = () => {
  try {
    const blogPath = path.join(__dirname, '../content/blog.json');
    return JSON.parse(fs.readFileSync(blogPath, 'utf8'));
  } catch (error) {
    console.error('Error loading blog:', error);
    return { boostcast: {}, episodios: [], estadisticas: {}, suscripcion: {} };
  }
};

// Guardar blog en archivo JSON
const saveBlog = (blog) => {
  try {
    const blogPath = path.join(__dirname, '../content/blog.json');
    fs.writeFileSync(blogPath, JSON.stringify(blog, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving blog:', error);
    return false;
  }
};

/**
 * GET /api/blog
 * Obtiene toda la información del blog/podcast
 */
router.get('/', (req, res) => {
  try {
    const data = loadBlog();
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error getting blog:', error);
    res.status(500).json({
      success: false,
      error: 'Error al cargar el blog'
    });
  }
});

/**
 * GET /api/blog/episodios
 * Obtiene todos los episodios
 */
router.get('/episodios', (req, res) => {
  try {
    const data = loadBlog();
    res.json({
      success: true,
      data: data.episodios || []
    });
  } catch (error) {
    console.error('Error getting episodios:', error);
    res.status(500).json({
      success: false,
      error: 'Error al cargar los episodios'
    });
  }
});

/**
 * GET /api/blog/episodios/:id
 * Obtiene un episodio específico por ID
 */
router.get('/episodios/:id', (req, res) => {
  try {
    const { id } = req.params;
    const data = loadBlog();
    const episodio = data.episodios.find(e => e.id === id);

    if (!episodio) {
      return res.status(404).json({
        success: false,
        error: 'Episodio no encontrado'
      });
    }

    res.json({
      success: true,
      data: episodio
    });
  } catch (error) {
    console.error('Error getting episodio:', error);
    res.status(500).json({
      success: false,
      error: 'Error al cargar el episodio'
    });
  }
});

/**
 * POST /api/blog/episodios
 * Crea un nuevo episodio
 */
router.post('/episodios', authenticateToken, requireRole(['admin', 'editor']), (req, res) => {
  try {
    const { 
      titulo, 
      descripcion, 
      fecha, 
      duracion, 
      invitado, 
      cargo_invitado, 
      imagen, 
      audio_url, 
      destacado, 
      temas 
    } = req.body;

    // Validar datos requeridos
    if (!titulo || !descripcion) {
      return res.status(400).json({
        success: false,
        error: 'Título y descripción son requeridos'
      });
    }

    const data = loadBlog();
    const nuevoEpisodio = {
      id: uuidv4(),
      numero: (data.episodios.length + 1),
      titulo,
      descripcion,
      fecha: fecha || new Date().toISOString().split('T')[0],
      duracion: duracion || '00:00',
      invitado: invitado || '',
      cargo_invitado: cargo_invitado || '',
      imagen: imagen || '/uploads/episodio-default.jpg',
      audio_url: audio_url || '',
      destacado: destacado || false,
      temas: temas || []
    };

    data.episodios.push(nuevoEpisodio);

    if (saveBlog(data)) {
      res.status(201).json({
        success: true,
        message: 'Episodio creado exitosamente',
        data: nuevoEpisodio
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error al guardar el episodio'
      });
    }
  } catch (error) {
    console.error('Error creating episodio:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * PUT /api/blog/episodios/:id
 * Actualiza un episodio existente
 */
router.put('/episodios/:id', authenticateToken, requireRole(['admin', 'editor']), (req, res) => {
  try {
    const { id } = req.params;
    const { 
      titulo, 
      descripcion, 
      fecha, 
      duracion, 
      invitado, 
      cargo_invitado, 
      imagen, 
      audio_url, 
      destacado, 
      temas 
    } = req.body;

    const data = loadBlog();
    const episodioIndex = data.episodios.findIndex(e => e.id === id);

    if (episodioIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Episodio no encontrado'
      });
    }

    // Actualizar episodio
    data.episodios[episodioIndex] = {
      ...data.episodios[episodioIndex],
      titulo: titulo || data.episodios[episodioIndex].titulo,
      descripcion: descripcion || data.episodios[episodioIndex].descripcion,
      fecha: fecha || data.episodios[episodioIndex].fecha,
      duracion: duracion || data.episodios[episodioIndex].duracion,
      invitado: invitado || data.episodios[episodioIndex].invitado,
      cargo_invitado: cargo_invitado || data.episodios[episodioIndex].cargo_invitado,
      imagen: imagen || data.episodios[episodioIndex].imagen,
      audio_url: audio_url || data.episodios[episodioIndex].audio_url,
      destacado: destacado !== undefined ? destacado : data.episodios[episodioIndex].destacado,
      temas: temas || data.episodios[episodioIndex].temas
    };

    if (saveBlog(data)) {
      res.json({
        success: true,
        message: 'Episodio actualizado exitosamente',
        data: data.episodios[episodioIndex]
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error al guardar el episodio'
      });
    }
  } catch (error) {
    console.error('Error updating episodio:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * DELETE /api/blog/episodios/:id
 * Elimina un episodio
 */
router.delete('/episodios/:id', authenticateToken, requireRole(['admin']), (req, res) => {
  try {
    const { id } = req.params;

    const data = loadBlog();
    const episodioIndex = data.episodios.findIndex(e => e.id === id);

    if (episodioIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Episodio no encontrado'
      });
    }

    const episodioEliminado = data.episodios.splice(episodioIndex, 1)[0];

    if (saveBlog(data)) {
      res.json({
        success: true,
        message: 'Episodio eliminado exitosamente',
        data: episodioEliminado
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error al guardar los cambios'
      });
    }
  } catch (error) {
    console.error('Error deleting episodio:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * PUT /api/blog/configuracion
 * Actualiza la configuración del podcast
 */
router.put('/configuracion', authenticateToken, requireRole(['admin', 'editor']), (req, res) => {
  try {
    const { boostcast, estadisticas, suscripcion } = req.body;

    const data = loadBlog();
    
    if (boostcast) {
      data.boostcast = { ...data.boostcast, ...boostcast };
    }
    
    if (estadisticas) {
      data.estadisticas = { ...data.estadisticas, ...estadisticas };
    }
    
    if (suscripcion) {
      data.suscripcion = { ...data.suscripcion, ...suscripcion };
    }

    if (saveBlog(data)) {
      res.json({
        success: true,
        message: 'Configuración del podcast actualizada exitosamente',
        data: {
          boostcast: data.boostcast,
          estadisticas: data.estadisticas,
          suscripcion: data.suscripcion
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error al guardar la configuración'
      });
    }
  } catch (error) {
    console.error('Error updating configuracion:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;
