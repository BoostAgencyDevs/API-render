/**
 * @fileoverview Rutas de gestión de temas para Boost Agency API
 * 
 * Maneja configuración de temas y personalización visual
 * 
 * @author Boost Agency Development Team
 * @version 1.0.0
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const { authenticateToken, requireRole } = require('../middleware/auth');
const router = express.Router();

// Cargar temas desde archivo JSON
const loadThemes = () => {
  try {
    const themesPath = path.join(__dirname, '../content/themes.json');
    if (fs.existsSync(themesPath)) {
      return JSON.parse(fs.readFileSync(themesPath, 'utf8'));
    }
    // Tema por defecto
    return {
      tema_actual: 'default',
      temas: {
        default: {
          id: 'default',
          nombre: 'Tema por Defecto',
          colores: {
            primario: '#007bff',
            secundario: '#6c757d',
            exito: '#28a745',
            peligro: '#dc3545',
            advertencia: '#ffc107',
            info: '#17a2b8',
            claro: '#f8f9fa',
            oscuro: '#343a40'
          },
          tipografia: {
            fuente_principal: 'Inter, sans-serif',
            fuente_secundaria: 'Roboto, sans-serif',
            tamaño_base: '16px',
            peso_normal: '400',
            peso_bold: '700'
          },
          espaciado: {
            xs: '0.25rem',
            sm: '0.5rem',
            md: '1rem',
            lg: '1.5rem',
            xl: '3rem'
          },
          bordes: {
            radio: '0.375rem',
            grosor: '1px',
            estilo: 'solid'
          }
        }
      }
    };
  } catch (error) {
    console.error('Error loading themes:', error);
    return { tema_actual: 'default', temas: {} };
  }
};

// Guardar temas en archivo JSON
const saveThemes = (themes) => {
  try {
    const themesPath = path.join(__dirname, '../content/themes.json');
    const themesDir = path.dirname(themesPath);
    
    if (!fs.existsSync(themesDir)) {
      fs.mkdirSync(themesDir, { recursive: true });
    }
    
    fs.writeFileSync(themesPath, JSON.stringify(themes, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving themes:', error);
    return false;
  }
};

/**
 * GET /api/themes
 * Obtiene la configuración actual de temas
 */
router.get('/', (req, res) => {
  try {
    const themes = loadThemes();
    res.json({
      success: true,
      data: themes
    });
  } catch (error) {
    console.error('Error getting themes:', error);
    res.status(500).json({
      success: false,
      error: 'Error al cargar los temas'
    });
  }
});

/**
 * GET /api/themes/current
 * Obtiene el tema actual activo
 */
router.get('/current', (req, res) => {
  try {
    const themes = loadThemes();
    const currentTheme = themes.temas[themes.tema_actual];
    
    if (!currentTheme) {
      return res.status(404).json({
        success: false,
        error: 'Tema actual no encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        tema_actual: themes.tema_actual,
        configuracion: currentTheme
      }
    });
  } catch (error) {
    console.error('Error getting current theme:', error);
    res.status(500).json({
      success: false,
      error: 'Error al cargar el tema actual'
    });
  }
});

/**
 * PUT /api/themes
 * Actualiza la configuración de temas
 */
router.put('/', authenticateToken, requireRole(['admin', 'editor']), (req, res) => {
  try {
    const { tema_actual, colores, tipografia, espaciado, bordes } = req.body;
    
    const themes = loadThemes();
    
    // Actualizar tema actual si se especifica
    if (tema_actual && themes.temas[tema_actual]) {
      themes.tema_actual = tema_actual;
    }
    
    // Actualizar configuración del tema actual
    const currentTheme = themes.temas[themes.tema_actual];
    if (!currentTheme) {
      return res.status(404).json({
        success: false,
        error: 'Tema actual no encontrado'
      });
    }
    
    if (colores) {
      currentTheme.colores = { ...currentTheme.colores, ...colores };
    }
    
    if (tipografia) {
      currentTheme.tipografia = { ...currentTheme.tipografia, ...tipografia };
    }
    
    if (espaciado) {
      currentTheme.espaciado = { ...currentTheme.espaciado, ...espaciado };
    }
    
    if (bordes) {
      currentTheme.bordes = { ...currentTheme.bordes, ...bordes };
    }

    if (saveThemes(themes)) {
      res.json({
        success: true,
        message: 'Tema actualizado exitosamente',
        data: {
          tema_actual: themes.tema_actual,
          configuracion: currentTheme
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error al guardar el tema'
      });
    }
  } catch (error) {
    console.error('Error updating theme:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * POST /api/themes
 * Crea un nuevo tema personalizado
 */
router.post('/', authenticateToken, requireRole(['admin', 'editor']), (req, res) => {
  try {
    const { id, nombre, colores, tipografia, espaciado, bordes } = req.body;
    
    if (!id || !nombre) {
      return res.status(400).json({
        success: false,
        error: 'ID y nombre del tema son requeridos'
      });
    }
    
    const themes = loadThemes();
    
    // Verificar que el ID no exista
    if (themes.temas[id]) {
      return res.status(400).json({
        success: false,
        error: 'Ya existe un tema con ese ID'
      });
    }
    
    // Crear nuevo tema basado en el tema por defecto
    const defaultTheme = themes.temas.default;
    const nuevoTema = {
      id,
      nombre,
      colores: colores || defaultTheme.colores,
      tipografia: tipografia || defaultTheme.tipografia,
      espaciado: espaciado || defaultTheme.espaciado,
      bordes: bordes || defaultTheme.bordes
    };
    
    themes.temas[id] = nuevoTema;
    
    if (saveThemes(themes)) {
      res.status(201).json({
        success: true,
        message: 'Tema creado exitosamente',
        data: nuevoTema
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error al guardar el tema'
      });
    }
  } catch (error) {
    console.error('Error creating theme:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * PUT /api/themes/switch/:themeId
 * Cambia al tema especificado
 */
router.put('/switch/:themeId', authenticateToken, requireRole(['admin', 'editor']), (req, res) => {
  try {
    const { themeId } = req.params;
    const themes = loadThemes();
    
    if (!themes.temas[themeId]) {
      return res.status(404).json({
        success: false,
        error: 'Tema no encontrado'
      });
    }
    
    themes.tema_actual = themeId;
    
    if (saveThemes(themes)) {
      res.json({
        success: true,
        message: 'Tema cambiado exitosamente',
        data: {
          tema_actual: themeId,
          configuracion: themes.temas[themeId]
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error al guardar el cambio de tema'
      });
    }
  } catch (error) {
    console.error('Error switching theme:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * DELETE /api/themes/:themeId
 * Elimina un tema personalizado
 */
router.delete('/:themeId', authenticateToken, requireRole(['admin']), (req, res) => {
  try {
    const { themeId } = req.params;
    const themes = loadThemes();
    
    // No permitir eliminar el tema por defecto
    if (themeId === 'default') {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar el tema por defecto'
      });
    }
    
    if (!themes.temas[themeId]) {
      return res.status(404).json({
        success: false,
        error: 'Tema no encontrado'
      });
    }
    
    // Si se está eliminando el tema actual, cambiar al por defecto
    if (themes.tema_actual === themeId) {
      themes.tema_actual = 'default';
    }
    
    const temaEliminado = themes.temas[themeId];
    delete themes.temas[themeId];
    
    if (saveThemes(themes)) {
      res.json({
        success: true,
        message: 'Tema eliminado exitosamente',
        data: temaEliminado
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error al guardar los cambios'
      });
    }
  } catch (error) {
    console.error('Error deleting theme:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * GET /api/themes/preview/:themeId
 * Obtiene una vista previa de un tema
 */
router.get('/preview/:themeId', (req, res) => {
  try {
    const { themeId } = req.params;
    const themes = loadThemes();
    
    if (!themes.temas[themeId]) {
      return res.status(404).json({
        success: false,
        error: 'Tema no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: {
        id: themeId,
        configuracion: themes.temas[themeId]
      }
    });
  } catch (error) {
    console.error('Error getting theme preview:', error);
    res.status(500).json({
      success: false,
      error: 'Error al cargar la vista previa del tema'
    });
  }
});

module.exports = router;
