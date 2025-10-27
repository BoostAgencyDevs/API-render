/**
 * @fileoverview Rutas de gestión de leads para Boost Agency API
 *
 * ✅ MIGRADO A POSTGRESQL
 *
 * CAMBIOS PRINCIPALES:
 * - ❌ Eliminado: loadLeads() y saveLeads() con archivos JSON
 * - ❌ Eliminado: fs, path (ya no se necesitan)
 * - ✅ Nuevo: Usa el modelo Lead de PostgreSQL
 * - ✅ Nuevo: Manejo de errores mejorado con try-catch
 * - ✅ Nuevo: Validaciones más robustas
 *
 * @author Boost Agency Development Team
 * @version 2.0.0
 */

const express = require("express");
const {
  authenticateToken,
  requireRole,
  requireEditor,
  requireAdmin,
} = require("../middleware/auth");
const Lead = require("../models/Lead");
const router = express.Router();

/**
 * GET /api/leads
 * Obtiene todos los leads con filtros opcionales
 *
 * CAMBIOS:
 * - ANTES: Leía archivo JSON, filtraba en memoria, paginaba manualmente
 * - AHORA: El modelo Lead.findAll() hace todo (filtros, paginación, ordenamiento)
 */
router.get("/", authenticateToken, requireEditor, async (req, res) => {
  try {
    const {
      estado,
      servicio,
      fecha_desde,
      fecha_hasta,
      assigned_to,
      page,
      limit,
    } = req.query;

    // El modelo maneja todos los filtros y paginación
    const result = await Lead.findAll({
      estado,
      servicio,
      fecha_desde,
      fecha_hasta,
      assigned_to,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });

    res.json({
      success: true,
      data: result.leads,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error obteniendo leads:", error);
    res.status(500).json({
      success: false,
      error: "Error al cargar los leads",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * GET /api/leads/estadisticas
 * Obtiene estadísticas de leads
 *
 * ⚠️ IMPORTANTE: Esta ruta debe ir ANTES de /api/leads/:id
 * para evitar que Express interprete "estadisticas" como un ID
 *
 * CAMBIOS:
 * - ANTES: Calculaba estadísticas en JavaScript iterando el array
 * - AHORA: PostgreSQL hace los cálculos (mucho más rápido con COUNT, GROUP BY)
 */
router.get(
  "/estadisticas",
  authenticateToken,
  requireEditor,
  async (req, res) => {
    try {
      const stats = await Lead.getEstadisticas();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Error obteniendo estadísticas:", error);
      res.status(500).json({
        success: false,
        error: "Error al cargar las estadísticas",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

/**
 * GET /api/leads/search
 * Busca leads por texto (nombre, email, empresa, mensaje)
 *
 * NUEVO ENDPOINT: No existía en la versión JSON
 */
router.get("/search", authenticateToken, requireEditor, async (req, res) => {
  try {
    const { q, limit } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: "El término de búsqueda debe tener al menos 2 caracteres",
      });
    }

    const leads = await Lead.search(q, limit ? parseInt(limit) : 10);

    res.json({
      success: true,
      data: leads,
      count: leads.length,
    });
  } catch (error) {
    console.error("Error buscando leads:", error);
    res.status(500).json({
      success: false,
      error: "Error en la búsqueda",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * GET /api/leads/:id
 * Obtiene un lead específico por ID
 *
 * CAMBIOS:
 * - ANTES: Buscaba en array con .find()
 * - AHORA: Consulta directa por UUID con índice (más rápido)
 */
router.get("/:id", authenticateToken, requireEditor, async (req, res) => {
  try {
    const { id } = req.params;

    const lead = await Lead.findById(id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: "Lead no encontrado",
      });
    }

    res.json({
      success: true,
      data: lead,
    });
  } catch (error) {
    console.error("Error obteniendo lead:", error);
    res.status(500).json({
      success: false,
      error: "Error al cargar el lead",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * POST /api/leads
 * Crea un nuevo lead (desde formulario web)
 *
 * CAMBIOS:
 * - ANTES: Agregaba al array y escribía todo el archivo JSON
 * - AHORA: INSERT en PostgreSQL (mucho más rápido y seguro)
 * - NUEVO: Validaciones mejoradas con mensajes específicos
 */
router.post("/", async (req, res) => {
  try {
    const {
      nombre,
      email,
      telefono,
      empresa,
      servicio_interes,
      presupuesto,
      mensaje,
      origen,
    } = req.body;

    // Validar datos requeridos
    const camposRequeridos = [
      "nombre",
      "email",
      "telefono",
      "servicio_interes",
    ];
    const camposFaltantes = camposRequeridos.filter(
      (campo) => !req.body[campo]
    );

    if (camposFaltantes.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Campos requeridos faltantes",
        campos_faltantes: camposFaltantes,
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "Formato de email inválido",
      });
    }

    // Crear lead en la base de datos
    const nuevoLead = await Lead.create({
      nombre,
      email,
      telefono,
      empresa,
      servicio_interes,
      presupuesto,
      mensaje,
      origen: origen || "formulario-web",
    });

    res.status(201).json({
      success: true,
      message: "Lead creado exitosamente",
      data: nuevoLead,
    });
  } catch (error) {
    console.error("Error creando lead:", error);
    res.status(500).json({
      success: false,
      error: "Error al crear el lead",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * PUT /api/leads/:id/estado
 * Actualiza el estado de un lead
 *
 * CAMBIOS:
 * - ANTES: Buscaba en array, modificaba, guardaba todo el archivo
 * - AHORA: UPDATE directo en PostgreSQL (solo el campo necesario)
 */
router.put(
  "/:id/estado",
  authenticateToken,
  requireEditor,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { estado } = req.body;

      if (!estado) {
        return res.status(400).json({
          success: false,
          error: "El campo estado es requerido",
        });
      }

      // El modelo valida que el estado sea válido
      const leadActualizado = await Lead.updateEstado(id, estado);

      res.json({
        success: true,
        message: "Estado del lead actualizado exitosamente",
        data: leadActualizado,
      });
    } catch (error) {
      console.error("Error actualizando estado del lead:", error);

      if (error.message.includes("Estado inválido")) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      if (error.message.includes("no encontrado")) {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        error: "Error al actualizar el estado",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

/**
 * PUT /api/leads/:id/asignar
 * Asigna un lead a un usuario (vendedor)
 *
 * NUEVO ENDPOINT: No existía en la versión JSON
 */
router.put(
  "/:id/asignar",
  authenticateToken,
  requireEditor,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { user_id } = req.body;

      if (!user_id) {
        return res.status(400).json({
          success: false,
          error: "El campo user_id es requerido",
        });
      }

      const leadActualizado = await Lead.assignTo(id, user_id);

      res.json({
        success: true,
        message: "Lead asignado exitosamente",
        data: leadActualizado,
      });
    } catch (error) {
      console.error("Error asignando lead:", error);

      if (error.message.includes("no encontrado")) {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        error: "Error al asignar el lead",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

/**
 * PUT /api/leads/:id
 * Actualiza un lead completo
 *
 * CAMBIOS:
 * - ANTES: Modificaba objeto en array y guardaba todo
 * - AHORA: UPDATE solo de campos modificados (más eficiente)
 */
router.put("/:id", authenticateToken, requireEditor, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remover campos que no deben actualizarse
    delete updates.id;
    delete updates.created_at;
    delete updates.fecha;

    const leadActualizado = await Lead.update(id, updates);

    res.json({
      success: true,
      message: "Lead actualizado exitosamente",
      data: leadActualizado,
    });
  } catch (error) {
    console.error("Error actualizando lead:", error);

    if (error.message.includes("no encontrado")) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    if (error.message.includes("No hay campos válidos")) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: "Error al actualizar el lead",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * DELETE /api/leads/:id
 * Elimina un lead permanentemente
 *
 * CAMBIOS:
 * - ANTES: Filtraba array y guardaba todo el archivo
 * - AHORA: DELETE en PostgreSQL (con RETURNING para confirmar)
 */
router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const leadEliminado = await Lead.delete(id);

    res.json({
      success: true,
      message: "Lead eliminado exitosamente",
      data: leadEliminado,
    });
  } catch (error) {
    console.error("Error eliminando lead:", error);

    if (error.message.includes("no encontrado")) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: "Error al eliminar el lead",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;
