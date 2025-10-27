/**
 * @fileoverview Rutas de gestión del podcast BOOSTCAST
 *
 * 🆕 ARCHIVO NUEVO - Reemplaza blog.json
 *
 * Gestiona:
 * - Episodios del podcast
 * - Invitados y temas
 * - Estadísticas de reproducciones
 * - Episodios destacados
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
const BlogPost = require("../models/BlogPost");
const router = express.Router();

/**
 * GET /api/blog
 * Obtiene todos los episodios con paginación y filtros
 *
 * Query params:
 * - page: número de página (default: 1)
 * - limit: episodios por página (default: 20)
 * - status: 'published', 'draft', 'archived'
 * - onlyFeatured: true/false
 */
router.get("/", async (req, res) => {
  try {
    const { page, limit, status, onlyFeatured } = req.query;

    const result = await BlogPost.findAll({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      status: status || "published",
      onlyFeatured: onlyFeatured === "true",
    });

    res.json({
      success: true,
      data: result.episodes,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error obteniendo episodios:", error);
    res.status(500).json({
      success: false,
      error: "Error al cargar los episodios",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * GET /api/blog/recent
 * Obtiene los episodios más recientes
 *
 * Query params:
 * - limit: cantidad de episodios (default: 5)
 */
router.get("/recent", async (req, res) => {
  try {
    const { limit } = req.query;

    const episodes = await BlogPost.getRecent(limit ? parseInt(limit) : 5);

    res.json({
      success: true,
      data: episodes,
      count: episodes.length,
    });
  } catch (error) {
    console.error("Error obteniendo episodios recientes:", error);
    res.status(500).json({
      success: false,
      error: "Error al cargar los episodios recientes",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * GET /api/blog/featured
 * Obtiene los episodios destacados
 */
router.get("/featured", async (req, res) => {
  try {
    const episodes = await BlogPost.getFeatured();

    res.json({
      success: true,
      data: episodes,
      count: episodes.length,
    });
  } catch (error) {
    console.error("Error obteniendo episodios destacados:", error);
    res.status(500).json({
      success: false,
      error: "Error al cargar los episodios destacados",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * GET /api/blog/stats
 * Obtiene estadísticas del podcast
 */
router.get("/stats", authenticateToken, requireEditor, async (req, res) => {
  try {
    const stats = await BlogPost.getStats();

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
});

/**
 * GET /api/blog/topics/:topic
 * Busca episodios por tema
 *
 * Ejemplo: GET /api/blog/topics/SEO
 */
router.get("/topics/:topic", async (req, res) => {
  try {
    const { topic } = req.params;

    const episodes = await BlogPost.findByTopic(topic);

    res.json({
      success: true,
      data: episodes,
      count: episodes.length,
    });
  } catch (error) {
    console.error("Error buscando por tema:", error);
    res.status(500).json({
      success: false,
      error: "Error en la búsqueda",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * GET /api/blog/:episodeId
 * Obtiene un episodio específico por su episode_id
 *
 * Ejemplo: GET /api/blog/ep-001
 */
router.get("/:episodeId", async (req, res) => {
  try {
    const { episodeId } = req.params;

    const episode = await BlogPost.getByEpisodeId(episodeId);

    if (!episode) {
      return res.status(404).json({
        success: false,
        error: "Episodio no encontrado",
      });
    }

    res.json({
      success: true,
      data: episode,
    });
  } catch (error) {
    console.error("Error obteniendo episodio:", error);
    res.status(500).json({
      success: false,
      error: "Error al cargar el episodio",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * POST /api/blog
 * Crea un nuevo episodio de podcast
 *
 * Body:
 * {
 *   "episode_id": "ep-004",
 *   "episode_number": 4,
 *   "title": "Título del episodio",
 *   "description": "Descripción completa",
 *   "publish_date": "2024-02-15",
 *   "duration": "42:30",
 *   "guest_name": "Nombre Invitado",
 *   "guest_title": "Cargo del invitado",
 *   "cover_image_url": "/uploads/ep004.jpg",
 *   "audio_url": "/audio/ep004.mp3",
 *   "topics": ["Marketing", "SEO"],
 *   "is_featured": false,
 *   "status": "draft"
 * }
 */
router.post("/", authenticateToken, requireEditor, async (req, res) => {
  try {
    const {
      episode_id,
      episode_number,
      title,
      description,
      publish_date,
      duration,
      guest_name,
      guest_title,
      cover_image_url,
      audio_url,
      topics,
      is_featured,
      status,
    } = req.body;

    // Validar campos requeridos
    if (
      !episode_id ||
      !episode_number ||
      !title ||
      !description ||
      !publish_date
    ) {
      return res.status(400).json({
        success: false,
        error:
          "episode_id, episode_number, title, description y publish_date son requeridos",
      });
    }

    // Validar formato de episode_id
    if (!/^ep-\d+$/.test(episode_id)) {
      return res.status(400).json({
        success: false,
        error: 'episode_id debe tener el formato "ep-XXX" (ej: ep-001)',
      });
    }

    const newEpisode = await BlogPost.create({
      episode_id,
      episode_number,
      title,
      description,
      publish_date,
      duration,
      guest_name,
      guest_title,
      cover_image_url,
      audio_url,
      topics: topics || [],
      is_featured: is_featured || false,
      status: status || "draft",
      author_id: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Episodio creado exitosamente",
      data: newEpisode,
    });
  } catch (error) {
    console.error("Error creando episodio:", error);

    if (
      error.message.includes("duplicate") ||
      error.message.includes("already exists")
    ) {
      return res.status(409).json({
        success: false,
        error: "Ya existe un episodio con ese episode_id",
      });
    }

    res.status(500).json({
      success: false,
      error: "Error al crear el episodio",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * PUT /api/blog/:episodeId
 * Actualiza un episodio existente
 */
router.put(
  "/:episodeId",
  authenticateToken,
  requireEditor,
  async (req, res) => {
    try {
      const { episodeId } = req.params;
      const updates = req.body;

      // Remover campos que no deben actualizarse
      delete updates.episode_id;
      delete updates.id;
      delete updates.created_at;
      delete updates.author_id;

      const episodeUpdated = await BlogPost.update(episodeId, updates);

      res.json({
        success: true,
        message: "Episodio actualizado exitosamente",
        data: episodeUpdated,
      });
    } catch (error) {
      console.error("Error actualizando episodio:", error);

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
        error: "Error al actualizar el episodio",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

/**
 * PATCH /api/blog/:episodeId/status
 * Cambia el estado de un episodio (publicar/archivar)
 *
 * Body:
 * {
 *   "status": "published"
 * }
 */
router.patch(
  "/:episodeId/status",
  authenticateToken,
  requireEditor,
  async (req, res) => {
    try {
      const { episodeId } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          error: "El campo status es requerido",
        });
      }

      const episodeUpdated = await BlogPost.changeStatus(episodeId, status);

      res.json({
        success: true,
        message: `Episodio ${
          status === "published" ? "publicado" : "actualizado"
        } exitosamente`,
        data: episodeUpdated,
      });
    } catch (error) {
      console.error("Error cambiando estado del episodio:", error);

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
 * PATCH /api/blog/:episodeId/featured
 * Marca/desmarca un episodio como destacado
 *
 * Body:
 * {
 *   "featured": true
 * }
 */
router.patch(
  "/:episodeId/featured",
  authenticateToken,
  requireEditor,
  async (req, res) => {
    try {
      const { episodeId } = req.params;
      const { featured } = req.body;

      if (featured === undefined) {
        return res.status(400).json({
          success: false,
          error: "El campo featured es requerido",
        });
      }

      const episodeUpdated = await BlogPost.setFeatured(episodeId, featured);

      res.json({
        success: true,
        message: `Episodio ${
          featured ? "destacado" : "no destacado"
        } exitosamente`,
        data: episodeUpdated,
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
        error: "Error al actualizar el episodio",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

/**
 * POST /api/blog/:episodeId/view
 * Incrementa el contador de vistas (cuando alguien reproduce el episodio)
 */
router.post("/:episodeId/view", async (req, res) => {
  try {
    const { episodeId } = req.params;

    const viewCount = await BlogPost.incrementViews(episodeId);

    res.json({
      success: true,
      data: {
        views_count: viewCount,
      },
    });
  } catch (error) {
    console.error("Error incrementando vistas:", error);

    if (error.message.includes("no encontrado")) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: "Error al registrar la vista",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * DELETE /api/blog/:episodeId
 * Elimina un episodio (soft delete - lo archiva)
 */
router.delete(
  "/:episodeId",
  authenticateToken,
  requireEditor,
  async (req, res) => {
    try {
      const { episodeId } = req.params;

      await BlogPost.delete(episodeId);

      res.json({
        success: true,
        message: "Episodio eliminado exitosamente",
      });
    } catch (error) {
      console.error("Error eliminando episodio:", error);

      if (error.message.includes("no encontrado")) {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        error: "Error al eliminar el episodio",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

module.exports = router;
