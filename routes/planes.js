/**
 * @fileoverview Rutas de gestión de planes de servicio
 *
 * 🆕 ARCHIVO NUEVO - Reemplaza planes.json
 *
 * Gestiona los planes de servicio:
 * - Starter
 * - Professional
 * - Enterprise
 *
 * @author Boost Agency Development Team
 * @version 2.0.0
 */

const express = require("express");
const { authenticateToken, requireEditor } = require("../middleware/auth");
const Plan = require("../models/Plan");
const router = express.Router();

/**
 * GET /api/planes
 * Obtiene todos los planes activos
 *
 * Query params:
 * - status: 'active', 'inactive'
 * - includeInactive: true/false
 */
router.get("/", async (req, res) => {
  try {
    const { status, includeInactive } = req.query;

    const plans = await Plan.getAll({
      status,
      includeInactive: includeInactive === "true",
    });

    res.json({
      success: true,
      data: plans,
      count: plans.length,
    });
  } catch (error) {
    console.error("Error obteniendo planes:", error);
    res.status(500).json({
      success: false,
      error: "Error al cargar los planes",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * GET /api/planes/featured
 * Obtiene el plan destacado (recomendado)
 */
router.get("/featured", async (req, res) => {
  try {
    const plan = await Plan.getFeatured();

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: "No hay plan destacado configurado",
      });
    }

    res.json({
      success: true,
      data: plan,
    });
  } catch (error) {
    console.error("Error obteniendo plan destacado:", error);
    res.status(500).json({
      success: false,
      error: "Error al cargar el plan destacado",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * GET /api/planes/:planId
 * Obtiene un plan específico por su plan_id
 *
 * Ejemplo: GET /api/planes/professional
 */
router.get("/:planId", async (req, res) => {
  try {
    const { planId } = req.params;

    const plan = await Plan.getByPlanId(planId);

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: "Plan no encontrado",
      });
    }

    res.json({
      success: true,
      data: plan,
    });
  } catch (error) {
    console.error("Error obteniendo plan:", error);
    res.status(500).json({
      success: false,
      error: "Error al cargar el plan",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * POST /api/planes
 * Crea un nuevo plan
 *
 * Body:
 * {
 *   "plan_id": "premium",
 *   "name": "Premium",
 *   "price": 3999,
 *   "billing_period": "mes",
 *   "description": "Plan premium para empresas grandes",
 *   "features": [
 *     "Característica 1",
 *     "Característica 2"
 *   ],
 *   "is_featured": false,
 *   "cta_text": "Elegir Premium",
 *   "notes": "Nota adicional",
 *   "display_order": 3
 * }
 */
router.post("/", authenticateToken, requireEditor, async (req, res) => {
  try {
    const {
      plan_id,
      name,
      price,
      price_currency,
      billing_period,
      description,
      features,
      is_featured,
      cta_text,
      notes,
      display_order,
      status,
    } = req.body;

    // Validar campos requeridos
    if (!plan_id || !name || !price || !description || !features) {
      return res.status(400).json({
        success: false,
        error: "plan_id, name, price, description y features son requeridos",
      });
    }

    // Validar que plan_id sea lowercase
    if (!/^[a-z0-9-]+$/.test(plan_id)) {
      return res.status(400).json({
        success: false,
        error:
          "plan_id debe ser lowercase y solo contener letras, números y guiones",
      });
    }

    // Validar que features sea un array
    if (!Array.isArray(features)) {
      return res.status(400).json({
        success: false,
        error: "features debe ser un array",
      });
    }

    // Validar precio
    if (isNaN(price) || price < 0) {
      return res.status(400).json({
        success: false,
        error: "price debe ser un número positivo",
      });
    }

    const newPlan = await Plan.create({
      plan_id,
      name,
      price: parseFloat(price),
      price_currency: price_currency || "USD",
      billing_period: billing_period || "mes",
      description,
      features,
      is_featured: is_featured || false,
      cta_text: cta_text || "Comenzar Ahora",
      notes,
      display_order: display_order || 0,
      status: status || "active",
    });

    res.status(201).json({
      success: true,
      message: "Plan creado exitosamente",
      data: newPlan,
    });
  } catch (error) {
    console.error("Error creando plan:", error);

    if (
      error.message.includes("duplicate") ||
      error.message.includes("already exists")
    ) {
      return res.status(409).json({
        success: false,
        error: "Ya existe un plan con ese plan_id",
      });
    }

    res.status(500).json({
      success: false,
      error: "Error al crear el plan",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * PUT /api/planes/:planId
 * Actualiza un plan existente
 */
router.put("/:planId", authenticateToken, requireEditor, async (req, res) => {
  try {
    const { planId } = req.params;
    const updates = req.body;

    // Remover campos que no deben actualizarse
    delete updates.plan_id;
    delete updates.id;
    delete updates.created_at;

    const planUpdated = await Plan.update(planId, updates);

    res.json({
      success: true,
      message: "Plan actualizado exitosamente",
      data: planUpdated,
    });
  } catch (error) {
    console.error("Error actualizando plan:", error);

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
      error: "Error al actualizar el plan",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * PATCH /api/planes/:planId/status
 * Cambia el estado de un plan
 *
 * Body:
 * {
 *   "status": "inactive"
 * }
 */
router.patch(
  "/:planId/status",
  authenticateToken,
  requireEditor,
  async (req, res) => {
    try {
      const { planId } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          error: "El campo status es requerido",
        });
      }

      const planUpdated = await Plan.changeStatus(planId, status);

      res.json({
        success: true,
        message: `Plan ${
          status === "active" ? "activado" : "desactivado"
        } exitosamente`,
        data: planUpdated,
      });
    } catch (error) {
      console.error("Error cambiando estado del plan:", error);

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
 * PATCH /api/planes/:planId/featured
 * Marca/desmarca un plan como destacado
 * Solo puede haber un plan destacado a la vez
 *
 * Body:
 * {
 *   "featured": true
 * }
 */
router.patch(
  "/:planId/featured",
  authenticateToken,
  requireEditor,
  async (req, res) => {
    try {
      const { planId } = req.params;
      const { featured } = req.body;

      if (featured === undefined) {
        return res.status(400).json({
          success: false,
          error: "El campo featured es requerido",
        });
      }

      const planUpdated = await Plan.setFeatured(planId, featured);

      res.json({
        success: true,
        message: `Plan ${featured ? "destacado" : "no destacado"} exitosamente`,
        data: planUpdated,
      });
    } catch (error) {
      console.error("Error cambiando featured:", error);

      if (error.message.includes("no encontrado")) {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        error: "Error al actualizar el plan",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

/**
 * POST /api/planes/reorder
 * Reordena los planes
 *
 * Body:
 * {
 *   "order": [
 *     { "plan_id": "starter", "order": 1 },
 *     { "plan_id": "professional", "order": 2 },
 *     { "plan_id": "enterprise", "order": 3 }
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

    await Plan.reorder(order);

    res.json({
      success: true,
      message: "Planes reordenados exitosamente",
    });
  } catch (error) {
    console.error("Error reordenando planes:", error);
    res.status(500).json({
      success: false,
      error: "Error al reordenar los planes",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * DELETE /api/planes/:planId
 * Elimina un plan (soft delete - lo desactiva)
 */
router.delete(
  "/:planId",
  authenticateToken,
  requireEditor,
  async (req, res) => {
    try {
      const { planId } = req.params;

      await Plan.delete(planId);

      res.json({
        success: true,
        message: "Plan eliminado exitosamente",
      });
    } catch (error) {
      console.error("Error eliminando plan:", error);

      if (error.message.includes("no encontrado")) {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        error: "Error al eliminar el plan",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

module.exports = router;
