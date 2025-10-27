/**
 * @fileoverview Modelo de BlogPost/Podcast para Boost Agency
 *
 * Gestiona los episodios del podcast BOOSTCAST:
 * - Crear y editar episodios
 * - Gestionar invitados y temas
 * - Marcar episodios destacados
 * - Estadísticas de visualizaciones
 *
 * Reemplaza: blog.json
 *
 * @author Boost Agency Development Team
 * @version 2.0.0
 */

const { query } = require("../config/database");

class BlogPost {
  /**
   * Crea un nuevo episodio de podcast
   *
   * DÓNDE SE USA: Cuando publicas un nuevo episodio desde el dashboard
   *
   * @param {Object} postData - Datos del episodio
   * @param {string} postData.episode_id - ID único ('ep-001', 'ep-002')
   * @param {number} postData.episode_number - Número del episodio
   * @param {string} postData.title - Título del episodio
   * @param {string} postData.description - Descripción
   * @param {string} postData.publish_date - Fecha de publicación (YYYY-MM-DD)
   * @param {string} [postData.duration] - Duración ('45:30')
   * @param {string} [postData.guest_name] - Nombre del invitado
   * @param {string} [postData.guest_title] - Cargo del invitado
   * @param {string} [postData.cover_image_url] - Imagen de portada
   * @param {string} [postData.audio_url] - URL del audio
   * @param {boolean} [postData.is_featured=false] - Episodio destacado
   * @param {Array} [postData.topics] - Array de temas
   * @param {string} [postData.status='draft'] - Estado ('draft', 'published', 'archived')
   * @param {string} postData.author_id - UUID del autor
   * @returns {Promise<Object>} Episodio creado
   */
  static async create(postData) {
    const {
      episode_id,
      episode_number,
      title,
      description,
      publish_date,
      duration = null,
      guest_name = null,
      guest_title = null,
      cover_image_url = null,
      audio_url = null,
      is_featured = false,
      topics = [],
      status = "draft",
      author_id,
    } = postData;

    const sql = `
      INSERT INTO blog_posts (
        episode_id, episode_number, title, description,
        publish_date, duration, guest_name, guest_title,
        cover_image_url, audio_url, is_featured, topics,
        status, author_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;

    const result = await query(sql, [
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
      is_featured,
      JSON.stringify(topics),
      status,
      author_id,
    ]);

    return this._parsePost(result.rows[0]);
  }

  /**
   * Obtiene un episodio por su episode_id
   *
   * DÓNDE SE USA: En la página de detalle del episodio
   * Ejemplo: BlogPost.getByEpisodeId('ep-001')
   *
   * @param {string} episodeId - ID del episodio
   * @returns {Promise<Object|null>} Episodio encontrado o null
   */
  static async getByEpisodeId(episodeId) {
    const sql = `
      SELECT 
        bp.*,
        u.full_name as author_name,
        u.email as author_email
      FROM blog_posts bp
      LEFT JOIN users u ON bp.author_id = u.id
      WHERE bp.episode_id = $1
    `;

    const result = await query(sql, [episodeId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this._parsePost(result.rows[0]);
  }

  /**
   * Obtiene un episodio por UUID
   *
   * @param {string} id - UUID del episodio
   * @returns {Promise<Object|null>} Episodio encontrado o null
   */
  static async getById(id) {
    const sql = `
      SELECT 
        bp.*,
        u.full_name as author_name
      FROM blog_posts bp
      LEFT JOIN users u ON bp.author_id = u.id
      WHERE bp.id = $1
    `;

    const result = await query(sql, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this._parsePost(result.rows[0]);
  }

  /**
   * Obtiene todos los episodios con filtros y paginación
   *
   * DÓNDE SE USA: En la página del podcast para listar todos los episodios
   *
   * @param {Object} options - Opciones de búsqueda
   * @param {number} [options.page=1] - Página actual
   * @param {number} [options.limit=20] - Episodios por página
   * @param {string} [options.status] - Filtrar por estado
   * @param {boolean} [options.onlyFeatured=false] - Solo destacados
   * @returns {Promise<Object>} { episodes: [], pagination: {} }
   */
  static async findAll(options = {}) {
    const {
      page = 1,
      limit = 20,
      status = "published",
      onlyFeatured = false,
    } = options;

    const offset = (page - 1) * limit;

    let sql = `
      SELECT 
        bp.*,
        u.full_name as author_name
      FROM blog_posts bp
      LEFT JOIN users u ON bp.author_id = u.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (status) {
      sql += ` AND bp.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (onlyFeatured) {
      sql += ` AND bp.is_featured = true`;
    }

    sql += ` ORDER BY bp.publish_date DESC, bp.episode_number DESC LIMIT $${paramIndex} OFFSET $${
      paramIndex + 1
    }`;
    params.push(limit, offset);

    const result = await query(sql, params);

    // Contar total
    let countSql = `SELECT COUNT(*) FROM blog_posts WHERE 1=1`;
    const countParams = [];
    let countIndex = 1;

    if (status) {
      countSql += ` AND status = $${countIndex}`;
      countParams.push(status);
      countIndex++;
    }

    if (onlyFeatured) {
      countSql += ` AND is_featured = true`;
    }

    const countResult = await query(countSql, countParams);
    const total = parseInt(countResult.rows[0].count);

    return {
      episodes: result.rows.map((row) => this._parsePost(row)),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtiene los episodios más recientes
   *
   * DÓNDE SE USA: En la home para mostrar últimos episodios
   *
   * @param {number} limit - Cantidad de episodios
   * @returns {Promise<Array>} Episodios recientes
   */
  static async getRecent(limit = 5) {
    const sql = `
      SELECT 
        bp.*,
        u.full_name as author_name
      FROM blog_posts bp
      LEFT JOIN users u ON bp.author_id = u.id
      WHERE bp.status = 'published'
      ORDER BY bp.publish_date DESC
      LIMIT $1
    `;

    const result = await query(sql, [limit]);
    return result.rows.map((row) => this._parsePost(row));
  }

  /**
   * Obtiene episodios destacados
   *
   * @returns {Promise<Array>} Episodios destacados
   */
  static async getFeatured() {
    const sql = `
      SELECT 
        bp.*,
        u.full_name as author_name
      FROM blog_posts bp
      LEFT JOIN users u ON bp.author_id = u.id
      WHERE bp.status = 'published' AND bp.is_featured = true
      ORDER BY bp.publish_date DESC
    `;

    const result = await query(sql);
    return result.rows.map((row) => this._parsePost(row));
  }

  /**
   * Actualiza un episodio existente
   *
   * @param {string} episodeId - episode_id del episodio
   * @param {Object} updates - Campos a actualizar
   * @returns {Promise<Object>} Episodio actualizado
   */
  static async update(episodeId, updates) {
    const allowedFields = [
      "title",
      "description",
      "publish_date",
      "duration",
      "guest_name",
      "guest_title",
      "cover_image_url",
      "audio_url",
      "is_featured",
      "topics",
      "status",
    ];

    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        // Convertir topics a JSON
        if (key === "topics") {
          updateFields.push(`${key} = ${paramIndex}::jsonb`);
          values.push(JSON.stringify(value));
        } else {
          updateFields.push(`${key} = ${paramIndex}`);
          values.push(value);
        }
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      throw new Error("No hay campos válidos para actualizar");
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(episodeId);

    const sql = `
      UPDATE blog_posts
      SET ${updateFields.join(", ")}
      WHERE episode_id = ${paramIndex}
      RETURNING *
    `;

    const result = await query(sql, values);

    if (result.rows.length === 0) {
      throw new Error("Episodio no encontrado");
    }

    return this._parsePost(result.rows[0]);
  }

  /**
   * Marca/desmarca un episodio como destacado
   *
   * @param {string} episodeId - episode_id del episodio
   * @param {boolean} featured - true para destacar, false para quitar
   * @returns {Promise<Object>} Episodio actualizado
   */
  static async setFeatured(episodeId, featured) {
    const sql = `
      UPDATE blog_posts
      SET is_featured = $1, updated_at = CURRENT_TIMESTAMP
      WHERE episode_id = $2
      RETURNING *
    `;

    const result = await query(sql, [featured, episodeId]);

    if (result.rows.length === 0) {
      throw new Error("Episodio no encontrado");
    }

    return this._parsePost(result.rows[0]);
  }

  /**
   * Incrementa el contador de vistas
   *
   * DÓNDE SE USA: Cuando alguien reproduce el episodio
   *
   * @param {string} episodeId - episode_id del episodio
   * @returns {Promise<number>} Nuevo número de vistas
   */
  static async incrementViews(episodeId) {
    const sql = `
      UPDATE blog_posts
      SET views_count = views_count + 1
      WHERE episode_id = $1
      RETURNING views_count
    `;

    const result = await query(sql, [episodeId]);

    if (result.rows.length === 0) {
      throw new Error("Episodio no encontrado");
    }

    return result.rows[0].views_count;
  }

  /**
   * Cambia el estado de publicación
   *
   * @param {string} episodeId - episode_id del episodio
   * @param {string} newStatus - Nuevo estado ('draft', 'published', 'archived')
   * @returns {Promise<Object>} Episodio actualizado
   */
  static async changeStatus(episodeId, newStatus) {
    const validStatuses = ["draft", "published", "archived"];

    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Estado inválido. Debe ser: ${validStatuses.join(", ")}`);
    }

    const sql = `
      UPDATE blog_posts
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE episode_id = $2
      RETURNING *
    `;

    const result = await query(sql, [newStatus, episodeId]);

    if (result.rows.length === 0) {
      throw new Error("Episodio no encontrado");
    }

    return this._parsePost(result.rows[0]);
  }

  /**
   * Elimina un episodio (soft delete - cambia a 'archived')
   *
   * @param {string} episodeId - episode_id del episodio
   * @returns {Promise<boolean>} true si se archivó
   */
  static async delete(episodeId) {
    await this.changeStatus(episodeId, "archived");
    return true;
  }

  /**
   * Elimina permanentemente un episodio
   * ⚠️ PRECAUCIÓN: No se puede deshacer
   *
   * @param {string} episodeId - episode_id del episodio
   * @returns {Promise<boolean>} true si se eliminó
   */
  static async deleteHard(episodeId) {
    const sql = `
      DELETE FROM blog_posts
      WHERE episode_id = $1
      RETURNING *
    `;

    const result = await query(sql, [episodeId]);

    if (result.rows.length === 0) {
      throw new Error("Episodio no encontrado");
    }

    return true;
  }

  /**
   * Busca episodios por tema
   *
   * @param {string} topic - Tema a buscar
   * @returns {Promise<Array>} Episodios que contienen el tema
   */
  static async findByTopic(topic) {
    const sql = `
      SELECT 
        bp.*,
        u.full_name as author_name
      FROM blog_posts bp
      LEFT JOIN users u ON bp.author_id = u.id
      WHERE bp.status = 'published' 
        AND bp.topics @> $1::jsonb
      ORDER BY bp.publish_date DESC
    `;

    const result = await query(sql, [JSON.stringify([topic])]);
    return result.rows.map((row) => this._parsePost(row));
  }

  /**
   * Obtiene estadísticas del podcast
   *
   * DÓNDE SE USA: Dashboard de analytics
   *
   * @returns {Promise<Object>} Estadísticas generales
   */
  static async getStats() {
    const sql = `
      SELECT 
        COUNT(*) as total_episodios,
        COUNT(*) FILTER (WHERE status = 'published') as publicados,
        COUNT(*) FILTER (WHERE status = 'draft') as borradores,
        SUM(views_count) as total_vistas,
        AVG(views_count) as promedio_vistas
      FROM blog_posts
    `;

    const result = await query(sql);
    return result.rows[0];
  }

  /**
   * Importa episodios desde JSON (para migración)
   *
   * @param {Array} episodesArray - Array de episodios del JSON
   * @param {string} userId - UUID del usuario que importa
   * @returns {Promise<Array>} Episodios importados
   */
  static async importFromJSON(episodesArray, userId) {
    const imported = [];

    for (const episode of episodesArray) {
      try {
        const created = await this.create({
          episode_id: episode.id,
          episode_number: episode.numero,
          title: episode.titulo,
          description: episode.descripcion,
          publish_date: episode.fecha,
          duration: episode.duracion,
          guest_name: episode.invitado,
          guest_title: episode.cargo_invitado,
          cover_image_url: episode.imagen,
          audio_url: episode.audio_url,
          is_featured: episode.destacado || false,
          topics: episode.temas || [],
          status: "published",
          author_id: userId,
        });

        imported.push(created);
      } catch (error) {
        // Si ya existe, actualizar
        if (error.message.includes("duplicate")) {
          const updated = await this.update(episode.id, {
            title: episode.titulo,
            description: episode.descripcion,
            publish_date: episode.fecha,
            duration: episode.duracion,
            guest_name: episode.invitado,
            guest_title: episode.cargo_invitado,
            cover_image_url: episode.imagen,
            audio_url: episode.audio_url,
            is_featured: episode.destacado || false,
            topics: episode.temas || [],
          });
          imported.push(updated);
        } else {
          throw error;
        }
      }
    }

    return imported;
  }

  /**
   * Helper privado para parsear posts (convierte JSON strings a objetos)
   *
   * @private
   * @param {Object} row - Fila de la base de datos
   * @returns {Object} Post parseado
   */
  static _parsePost(row) {
    return {
      ...row,
      topics:
        typeof row.topics === "string" ? JSON.parse(row.topics) : row.topics,
    };
  }
}

module.exports = BlogPost;
