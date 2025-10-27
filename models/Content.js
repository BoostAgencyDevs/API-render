/**
 * @fileoverview Modelo de Contenido para Boost Agency
 *
 * Gestiona todo el contenido dinámico del sitio web:
 * - Página de inicio (hero, servicios destacados, estadísticas)
 * - Página nosotros (misión, visión, equipo)
 * - Página de contacto (información, horarios, redes sociales)
 * - Footer (enlaces, copyright)
 * - Fundación (programas, impacto, testimonios)
 *
 * Este modelo reemplaza los archivos JSON:
 * - contenido.json
 * - fundacion.json
 *
 * @author Boost Agency Development Team
 * @version 2.0.0
 */

const { query } = require("../config/database");

class Content {
  /**
   * Crea o actualiza una sección de contenido
   *
   * DÓNDE SE USA: Cuando un admin edita el contenido desde el dashboard
   *
   * @param {Object} contentData - Datos del contenido
   * @param {string} contentData.section_key - Clave única ('inicio', 'nosotros', 'contacto', 'footer', 'fundacion')
   * @param {string} contentData.section_name - Nombre descriptivo de la sección
   * @param {Object} contentData.content_data - Todo el contenido en formato JSON
   * @param {string} [contentData.status='published'] - Estado ('draft', 'published', 'archived')
   * @param {string} contentData.updated_by - UUID del usuario que actualiza
   * @returns {Promise<Object>} Contenido creado/actualizado
   */
  static async upsert(contentData) {
    const {
      section_key,
      section_name,
      content_data,
      status = "published",
      updated_by,
    } = contentData;

    // UPSERT: Si existe actualiza, si no existe crea
    const sql = `
      INSERT INTO content (section_key, section_name, content_data, status, created_by, updated_by)
      VALUES ($1, $2, $3, $4, $5, $5)
      ON CONFLICT (section_key) 
      DO UPDATE SET
        section_name = EXCLUDED.section_name,
        content_data = EXCLUDED.content_data,
        status = EXCLUDED.status,
        updated_by = EXCLUDED.updated_by,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const result = await query(sql, [
      section_key,
      section_name,
      JSON.stringify(content_data),
      status,
      updated_by,
    ]);

    return result.rows[0];
  }

  /**
   * Obtiene el contenido de una sección específica
   *
   * DÓNDE SE USA: En el frontend para mostrar contenido de páginas
   * Ejemplo: Content.getBySectionKey('inicio') → Devuelve todo el contenido de la home
   *
   * @param {string} sectionKey - Clave de la sección ('inicio', 'nosotros', etc.)
   * @returns {Promise<Object|null>} Contenido de la sección o null si no existe
   */
  static async getBySectionKey(sectionKey) {
    const sql = `
      SELECT 
        id,
        section_key,
        section_name,
        content_data,
        status,
        created_at,
        updated_at
      FROM content
      WHERE section_key = $1 AND status = 'published'
    `;

    const result = await query(sql, [sectionKey]);

    if (result.rows.length === 0) {
      return null;
    }

    const content = result.rows[0];

    // Parsear el JSON automáticamente
    return {
      ...content,
      content_data:
        typeof content.content_data === "string"
          ? JSON.parse(content.content_data)
          : content.content_data,
    };
  }

  /**
   * Obtiene todas las secciones de contenido
   *
   * DÓNDE SE USA: En el dashboard para listar todas las secciones editables
   *
   * @param {Object} options - Opciones de filtrado
   * @param {string} [options.status] - Filtrar por estado
   * @returns {Promise<Array>} Lista de todas las secciones
   */
  static async getAll(options = {}) {
    const { status } = options;

    let sql = `
      SELECT 
        id,
        section_key,
        section_name,
        content_data,
        status,
        created_at,
        updated_at
      FROM content
      WHERE 1=1
    `;

    const params = [];

    if (status) {
      sql += ` AND status = $1`;
      params.push(status);
    }

    sql += ` ORDER BY section_key ASC`;

    const result = await query(sql, params);

    // Parsear todos los JSON
    return result.rows.map((row) => ({
      ...row,
      content_data:
        typeof row.content_data === "string"
          ? JSON.parse(row.content_data)
          : row.content_data,
    }));
  }

  /**
   * Actualiza solo una parte específica del contenido (sin reemplazar todo)
   *
   * EJEMPLO: Actualizar solo el hero de inicio sin tocar servicios_destacados
   *
   * @param {string} sectionKey - Clave de la sección
   * @param {string} path - Ruta JSON (ej: 'hero.titulo', 'nosotros.mision')
   * @param {any} value - Nuevo valor
   * @param {string} updatedBy - UUID del usuario
   * @returns {Promise<Object>} Contenido actualizado
   */
  static async updatePartial(sectionKey, path, value, updatedBy) {
    // PostgreSQL tiene funciones JSON muy potentes
    const sql = `
      UPDATE content
      SET 
        content_data = jsonb_set(
          content_data::jsonb,
          $1,
          $2::jsonb,
          true
        ),
        updated_by = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE section_key = $4
      RETURNING *
    `;

    // Convertir 'hero.titulo' a array ['{hero', 'titulo}']
    const jsonPath = `{${path.split(".").join(",")}}`;

    const result = await query(sql, [
      jsonPath,
      JSON.stringify(value),
      updatedBy,
      sectionKey,
    ]);

    if (result.rows.length === 0) {
      throw new Error("Sección no encontrada");
    }

    return result.rows[0];
  }

  /**
   * Elimina una sección de contenido (soft delete - cambia a 'archived')
   *
   * @param {string} sectionKey - Clave de la sección
   * @returns {Promise<boolean>} true si se archivó correctamente
   */
  static async archive(sectionKey) {
    const sql = `
      UPDATE content
      SET status = 'archived', updated_at = CURRENT_TIMESTAMP
      WHERE section_key = $1
    `;

    await query(sql, [sectionKey]);
    return true;
  }

  /**
   * Restaura una sección archivada
   *
   * @param {string} sectionKey - Clave de la sección
   * @returns {Promise<boolean>} true si se restauró correctamente
   */
  static async restore(sectionKey) {
    const sql = `
      UPDATE content
      SET status = 'published', updated_at = CURRENT_TIMESTAMP
      WHERE section_key = $1
    `;

    await query(sql, [sectionKey]);
    return true;
  }

  /**
   * Obtiene el historial de cambios (versiones anteriores)
   * Nota: Requiere una tabla adicional 'content_history' que podemos crear después
   *
   * @param {string} sectionKey - Clave de la sección
   * @returns {Promise<Array>} Historial de versiones
   */
  static async getHistory(sectionKey) {
    // Por ahora retornamos array vacío
    // Podemos implementar versionado completo después si lo necesitas
    return [];
  }

  /**
   * Importa contenido desde JSON (para migración inicial)
   *
   * DÓNDE SE USA: Script de migración para importar datos de contenido.json
   *
   * @param {Object} jsonData - Datos del JSON original
   * @param {string} sectionKey - Clave de la sección
   * @param {string} userId - UUID del usuario que importa
   * @returns {Promise<Object>} Contenido importado
   */
  static async importFromJSON(jsonData, sectionKey, userId) {
    return await this.upsert({
      section_key: sectionKey,
      section_name: this._getSectionName(sectionKey),
      content_data: jsonData,
      status: "published",
      updated_by: userId,
    });
  }

  /**
   * Helper privado para obtener nombres descriptivos
   *
   * @private
   * @param {string} key - Clave de la sección
   * @returns {string} Nombre descriptivo
   */
  static _getSectionName(key) {
    const names = {
      inicio: "Página de Inicio",
      nosotros: "Sobre Nosotros",
      contacto: "Contacto",
      footer: "Pie de Página",
      fundacion: "Fundación BOOST",
    };
    return names[key] || key;
  }
}

module.exports = Content;
