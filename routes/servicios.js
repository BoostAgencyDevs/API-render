/**
 * @fileoverview Rutas de gestión de servicios
 *
 * 🆕 ARCHIVO NUEVO - Reemplaza servicios.json
 *
 * Gestiona los servicios de la agencia:
 * - Marketing Digital
 * - Desarrollo Web
 * - Branding
 * - Social Media
 *
 * @author Boost Agency Development Team
 * @version 2.0.0
 */

const express = require("express");
const {
  authenticateToken,
  requireEditor,
  optionalAuth,
} = require("../middleware/auth");
const Service = require("../models/Service");
const router = express.Router();

/**
 * GET /api/servicios
 * Obtiene todos los servicios activos
 *
 * Query params:
 * - status: 'active', 'inactive'
 * - includeInactive: true/false
 */
router.get("/", async (req, res) => {
  try {
    const { status, includeInactive } = req.query;

    const services = await Service.getAll({
      status,
      includeInactive: includeInactive === "true",
    });

    res.json({
      success: true,
      data: services,
      count: services.length,
    });
  } catch (error) {
    console.error("Error obteniendo servicios:", error);
    res.status(500).json({
      success: false,
      error: "Error al cargar los servicios",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * GET /api/servicios/:serviceId
 * Obtiene un servicio específico por su service_id
 *
 * Ejemplo: GET /api/servicios/marketing-digital
 */
router.get("/:serviceId", async (req, res) => {
  try {
    const { serviceId } = req.params;

    const service = await Service.getByServiceId(serviceId);

    if (!service) {
      return res.status(404).json({
        success: false,
        error: "Servicio no encontrado",
      });
    }

    res.json({
      success: true,
      data: service,
    });
  } catch (error) {
    console.error("Error obteniendo servicio:", error);
    res.status(500).json({
      success: false,
      error: "Error al cargar el servicio",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * POST /api/servicios
 * Crea un nuevo servicio
 *
 * Body:
 * {
 *   "service_id": "nuevo-servicio",
 *   "title": "Nuevo Servicio",
 *   "description": "Descripción del servicio",
 *   "image_url": "/uploads/servicio.jpg",
 *   "features": ["Característica 1", "Característica 2"],
 *   "benefits": ["Beneficio 1", "Beneficio 2"],
 *   "display_order": 4
 * }
 */
router.post("/", authenticateToken, requireEditor, async (req, res) => {
  try {
    const {
      service_id,
      title,
      description,
      image_url,
      features,
      benefits,
      display_order,
      status,
    } = req.body;

    // Validar campos requeridos
    if (!service_id || !title || !description) {
      return res.status(400).json({
        success: false,
        error: "service_id, title y description son requeridos",
      });
    }

    // Validar que service_id sea lowercase con guiones
    if (!/^[a-z0-9-]+$/.test(service_id)) {
      return res.status(400).json({
        success: false,
        error:
          "service_id debe ser lowercase y solo contener letras, números y guiones",
      });
    }

    const newService = await Service.create({
      service_id,
      title,
      description,
      image_url,
      features: features || [],
      benefits: benefits || [],
      display_order: display_order || 0,
      status: status || "active",
      created_by: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Servicio creado exitosamente",
      data: newService,
    });
  } catch (error) {
    console.error("Error creando servicio:", error);

    if (
      error.message.includes("duplicate") ||
      error.message.includes("already exists")
    ) {
      return res.status(409).json({
        success: false,
        error: "Ya existe un servicio con ese service_id",
      });
    }

    res.status(500).json({
      success: false,
      error: "Error al crear el servicio",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * PUT /api/servicios/:serviceId
 * Actualiza un servicio existente
 *
 * Body: Solo los campos que quieras actualizar
 * {
 *   "title": "Título actualizado",
 *   "description": "Nueva descripción"
 * }
 */
router.put(
  "/:serviceId",
  authenticateToken,
  requireEditor,
  async (req, res) => {
    try {
      const { serviceId } = req.params;
      const updates = req.body;

      // Remover campos que no deben actualizarse
      delete updates.service_id;
      delete updates.id;
      delete updates.created_at;
      delete updates.created_by;

      const serviceUpdated = await Service.update(serviceId, updates);

      res.json({
        success: true,
        message: "Servicio actualizado exitosamente",
        data: serviceUpdated,
      });
    } catch (error) {
      console.error("Error actualizando servicio:", error);

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
        error: "Error al actualizar el servicio",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

/**
 * PATCH /api/servicios/:serviceId/status
 * Cambia el estado de un servicio (activar/desactivar)
 *
 * Body:
 * {
 *   "status": "inactive"
 * }
 */
router.patch(
  "/:serviceId/status",
  authenticateToken,
  requireEditor,
  async (req, res) => {
    try {
      const { serviceId } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          error: "El campo status es requerido",
        });
      }

      const serviceUpdated = await Service.changeStatus(serviceId, status);

      res.json({
        success: true,
        message: `Servicio ${
          status === "active" ? "activado" : "desactivado"
        } exitosamente`,
        data: serviceUpdated,
      });
    } catch (error) {
      console.error("Error cambiando estado del servicio:", error);

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
        error: "Error al cambiar el estado",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

/**
 * POST /api/servicios/reorder
 * Reordena los servicios
 *
 * Body:
 * {
 *   "order": [
 *     { "service_id": "marketing-digital", "order": 1 },
 *     { "service_id": "desarrollo-web", "order": 2 },
 *     { "service_id": "branding", "order": 3 }
 *   ]
 * }
 */
router.post("/reorder", authenticateToken, requireEditor, async (req, res) => {
  try {
    const { order } = req.body;

    if (!Array.isArray(order)) {
      return res.status(400).json({
        success: false,
        error: "El campo order debe ser un array",
      });
    }

    await Service.reorder(order);

    res.json({
      success: true,
      message: "Servicios reordenados exitosamente",
    });
  } catch (error) {
    console.error("Error reordenando servicios:", error);
    res.status(500).json({
      success: false,
      error: "Error al reordenar los servicios",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * DELETE /api/servicios/:serviceId
 * Elimina un servicio (soft delete - lo desactiva)
 */
router.delete(
  "/:serviceId",
  authenticateToken,
  requireEditor,
  async (req, res) => {
    try {
      const { serviceId } = req.params;

      await Service.delete(serviceId);

      res.json({
        success: true,
        message: "Servicio eliminado exitosamente",
      });
    } catch (error) {
      console.error("Error eliminando servicio:", error);

      if (error.message.includes("no encontrado")) {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        error: "Error al eliminar el servicio",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

module.exports = router;
