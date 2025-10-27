/**
 * @fileoverview Rutas de gestión de contenido dinámico
 *
 * 🆕 ARCHIVO NUEVO - Reemplaza contenido.json y fundacion.json
 *
 * Gestiona:
 * - Página de inicio (hero, servicios destacados, estadísticas)
 * - Página nosotros (misión, visión, equipo)
 * - Página de contacto
 * - Footer
 * - Fundación BOOST
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
const Content = require("../models/Content");
const router = express.Router();

/**
 * GET /api/content
 * Obtiene todas las secciones de contenido
 *
 * Query params:
 * - status: 'published', 'draft', 'archived'
 */
router.get("/", optionalAuth, async (req, res) => {
  try {
    const { status } = req.query;

    // Si el usuario NO está autenticado, solo mostrar publicado
    const filters = {};
    if (!req.user) {
      filters.status = "published";
    } else if (status) {
      filters.status = status;
    }

    const sections = await Content.getAll(filters);

    res.json({
      success: true,
      data: sections,
      count: sections.length,
    });
  } catch (error) {
    console.error("Error obteniendo contenido:", error);
    res.status(500).json({
      success: false,
      error: "Error al cargar el contenido",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * GET /api/content/:sectionKey
 * Obtiene el contenido de una sección específica
 *
 * Ejemplos:
 * - GET /api/content/inicio → Contenido de la home
 * - GET /api/content/nosotros → Contenido de about
 * - GET /api/content/contacto → Información de contacto
 * - GET /api/content/footer → Datos del footer
 * - GET /api/content/fundacion → Info de la fundación
 */
router.get("/:sectionKey", async (req, res) => {
  try {
    const { sectionKey } = req.params;

    const content = await Content.getBySectionKey(sectionKey);

    if (!content) {
      return res.status(404).json({
        success: false,
        error: `Sección '${sectionKey}' no encontrada`,
      });
    }

    res.json({
      success: true,
      data: content,
    });
  } catch (error) {
    console.error("Error obteniendo sección:", error);
    res.status(500).json({
      success: false,
      error: "Error al cargar la sección",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * POST /api/content
 * Crea o actualiza una sección de contenido
 *
 * Body:
 * {
 *   "section_key": "inicio",
 *   "section_name": "Página de Inicio",
 *   "content_data": { ... todo el contenido en JSON ... },
 *   "status": "published"
 * }
 */
router.post("/", authenticateToken, requireEditor, async (req, res) => {
  try {
    const { section_key, section_name, content_data, status } = req.body;

    // Validar campos requeridos
    if (!section_key || !section_name || !content_data) {
      return res.status(400).json({
        success: false,
        error: "section_key, section_name y content_data son requeridos",
      });
    }

    // Validar que content_data sea un objeto
    if (typeof content_data !== "object") {
      return res.status(400).json({
        success: false,
        error: "content_data debe ser un objeto JSON",
      });
    }

    const contentSaved = await Content.upsert({
      section_key,
      section_name,
      content_data,
      status: status || "published",
      updated_by: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Contenido guardado exitosamente",
      data: contentSaved,
    });
  } catch (error) {
    console.error("Error guardando contenido:", error);
    res.status(500).json({
      success: false,
      error: "Error al guardar el contenido",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * PUT /api/content/:sectionKey
 * Actualiza una sección de contenido completa
 *
 * Body:
 * {
 *   "section_name": "Nuevo nombre",
 *   "content_data": { ... nuevo contenido ... },
 *   "status": "published"
 * }
 */
router.put(
  "/:sectionKey",
  authenticateToken,
  requireEditor,
  async (req, res) => {
    try {
      const { sectionKey } = req.params;
      const { section_name, content_data, status } = req.body;

      // Verificar que la sección existe
      const existing = await Content.getBySectionKey(sectionKey);
      if (!existing) {
        return res.status(404).json({
          success: false,
          error: "Sección no encontrada",
        });
      }

      const contentUpdated = await Content.upsert({
        section_key: sectionKey,
        section_name: section_name || existing.section_name,
        content_data: content_data || existing.content_data,
        status: status || existing.status,
        updated_by: req.user.id,
      });

      res.json({
        success: true,
        message: "Contenido actualizado exitosamente",
        data: contentUpdated,
      });
    } catch (error) {
      console.error("Error actualizando contenido:", error);
      res.status(500).json({
        success: false,
        error: "Error al actualizar el contenido",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

/**
 * PATCH /api/content/:sectionKey/partial
 * Actualiza solo una parte específica del contenido
 *
 * Body:
 * {
 *   "path": "hero.titulo",
 *   "value": "Nuevo título del hero"
 * }
 *
 * Ejemplos de paths:
 * - "hero.titulo"
 * - "nosotros.mision"
 * - "estadisticas.clientes_satisfechos"
 */
router.patch(
  "/:sectionKey/partial",
  authenticateToken,
  requireEditor,
  async (req, res) => {
    try {
      const { sectionKey } = req.params;
      const { path, value } = req.body;

      if (!path) {
        return res.status(400).json({
          success: false,
          error: "El campo path es requerido",
        });
      }

      const contentUpdated = await Content.updatePartial(
        sectionKey,
        path,
        value,
        req.user.id
      );

      res.json({
        success: true,
        message: "Contenido parcial actualizado exitosamente",
        data: contentUpdated,
      });
    } catch (error) {
      console.error("Error actualizando contenido parcial:", error);

      if (error.message.includes("no encontrada")) {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        error: "Error al actualizar el contenido",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

/**
 * DELETE /api/content/:sectionKey
 * Archiva una sección (soft delete)
 */
router.delete(
  "/:sectionKey",
  authenticateToken,
  requireEditor,
  async (req, res) => {
    try {
      const { sectionKey } = req.params;

      await Content.archive(sectionKey);

      res.json({
        success: true,
        message: "Sección archivada exitosamente",
      });
    } catch (error) {
      console.error("Error archivando contenido:", error);
      res.status(500).json({
        success: false,
        error: "Error al archivar la sección",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

/**
 * POST /api/content/:sectionKey/restore
 * Restaura una sección archivada
 */
router.post(
  "/:sectionKey/restore",
  authenticateToken,
  requireEditor,
  async (req, res) => {
    try {
      const { sectionKey } = req.params;

      await Content.restore(sectionKey);

      res.json({
        success: true,
        message: "Sección restaurada exitosamente",
      });
    } catch (error) {
      console.error("Error restaurando contenido:", error);
      res.status(500).json({
        success: false,
        error: "Error al restaurar la sección",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

module.exports = router;
