/**
 * @fileoverview Modelo de Servicios para Boost Agency
 *
 * Gestiona todos los servicios que ofrece la agencia:
 * - Marketing Digital
 * - Desarrollo Web
 * - Branding
 * - Social Media
 *
 * Reemplaza: servicios.json
 *
 * @author Boost Agency Development Team
 * @version 2.0.0
 */

const { query } = require("../config/database");

class Service {
  /**
   * Crea un nuevo servicio
   *
   * DÓNDE SE USA: Cuando un admin añade un nuevo servicio al catálogo
   *
   * @param {Object} serviceData - Datos del servicio
   * @param {string} serviceData.service_id - ID único ('marketing-digital', 'desarrollo-web')
   * @param {string} serviceData.title - Título del servicio
   * @param {string} serviceData.description - Descripción completa
   * @param {string} [serviceData.image_url] - URL de la imagen
   * @param {Array} [serviceData.features] - Array de características
   * @param {Array} [serviceData.benefits] - Array de beneficios
   * @param {number} [serviceData.display_order=0] - Orden de visualización
   * @param {string} [serviceData.status='active'] - Estado del servicio
   * @param {string} serviceData.created_by - UUID del usuario creador
   * @returns {Promise<Object>} Servicio creado
   */
  static async create(serviceData) {
    const {
      service_id,
      title,
      description,
      image_url = null,
      features = [],
      benefits = [],
      display_order = 0,
      status = "active",
      created_by,
    } = serviceData;

    const sql = `
      INSERT INTO services (
        service_id, title, description, image_url,
        features, benefits, display_order, status, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await query(sql, [
      service_id,
      title,
      description,
      image_url,
      JSON.stringify(features),
      JSON.stringify(benefits),
      display_order,
      status,
      created_by,
    ]);

    return this._parseService(result.rows[0]);
  }

  /**
   * Obtiene un servicio por su service_id
   *
   * DÓNDE SE USA: En la página de detalle del servicio
   * Ejemplo: Service.getByServiceId('marketing-digital')
   *
   * @param {string} serviceId - ID del servicio
   * @returns {Promise<Object|null>} Servicio encontrado o null
   */
  static async getByServiceId(serviceId) {
    const sql = `
      SELECT * FROM services
      WHERE service_id = $1 AND status = 'active'
    `;

    const result = await query(sql, [serviceId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this._parseService(result.rows[0]);
  }

  /**
   * Obtiene un servicio por UUID
   *
   * @param {string} id - UUID del servicio
   * @returns {Promise<Object|null>} Servicio encontrado o null
   */
  static async getById(id) {
    const sql = `
      SELECT * FROM services
      WHERE id = $1
    `;

    const result = await query(sql, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this._parseService(result.rows[0]);
  }

  /**
   * Obtiene todos los servicios activos
   *
   * DÓNDE SE USA: En la página de servicios para listar todos
   *
   * @param {Object} options - Opciones de filtrado
   * @param {string} [options.status] - Filtrar por estado
   * @param {boolean} [options.includeInactive=false] - Incluir inactivos
   * @returns {Promise<Array>} Lista de servicios ordenados
   */
  static async getAll(options = {}) {
    const { status, includeInactive = false } = options;

    let sql = `
      SELECT * FROM services
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (status) {
      sql += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    } else if (!includeInactive) {
      sql += ` AND status = 'active'`;
    }

    sql += ` ORDER BY display_order ASC, created_at ASC`;

    const result = await query(sql, params);

    return result.rows.map((row) => this._parseService(row));
  }

  /**
   * Actualiza un servicio existente
   *
   * @param {string} serviceId - service_id del servicio
   * @param {Object} updates - Campos a actualizar
   * @returns {Promise<Object>} Servicio actualizado
   */
  static async update(serviceId, updates) {
    const allowedFields = [
      "title",
      "description",
      "image_url",
      "features",
      "benefits",
      "display_order",
      "status",
    ];

    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        // Convertir arrays a JSON
        if (key === "features" || key === "benefits") {
          updateFields.push(`${key} = $${paramIndex}::jsonb`);
          values.push(JSON.stringify(value));
        } else {
          updateFields.push(`${key} = $${paramIndex}`);
          values.push(value);
        }
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      throw new Error("No hay campos válidos para actualizar");
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(serviceId);

    const sql = `
      UPDATE services
      SET ${updateFields.join(", ")}
      WHERE service_id = $${paramIndex}
      RETURNING *
    `;

    const result = await query(sql, values);

    if (result.rows.length === 0) {
      throw new Error("Servicio no encontrado");
    }

    return this._parseService(result.rows[0]);
  }

  /**
   * Cambia el estado de un servicio
   *
   * @param {string} serviceId - service_id del servicio
   * @param {string} newStatus - Nuevo estado ('active', 'inactive')
   * @returns {Promise<Object>} Servicio actualizado
   */
  static async changeStatus(serviceId, newStatus) {
    const validStatuses = ["active", "inactive"];

    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Estado inválido. Debe ser: ${validStatuses.join(", ")}`);
    }

    const sql = `
      UPDATE services
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE service_id = $2
      RETURNING *
    `;

    const result = await query(sql, [newStatus, serviceId]);

    if (result.rows.length === 0) {
      throw new Error("Servicio no encontrado");
    }

    return this._parseService(result.rows[0]);
  }

  /**
   * Elimina un servicio (soft delete - cambia estado a 'inactive')
   *
   * @param {string} serviceId - service_id del servicio
   * @returns {Promise<boolean>} true si se desactivó
   */
  static async delete(serviceId) {
    await this.changeStatus(serviceId, "inactive");
    return true;
  }

  /**
   * Elimina permanentemente un servicio
   * ⚠️ PRECAUCIÓN: No se puede deshacer
   *
   * @param {string} serviceId - service_id del servicio
   * @returns {Promise<boolean>} true si se eliminó
   */
  static async deleteHard(serviceId) {
    const sql = `
      DELETE FROM services
      WHERE service_id = $1
      RETURNING *
    `;

    const result = await query(sql, [serviceId]);

    if (result.rows.length === 0) {
      throw new Error("Servicio no encontrado");
    }

    return true;
  }

  /**
   * Reordena los servicios
   *
   * @param {Array} orderArray - Array de objetos [{service_id: 'x', order: 1}, ...]
   * @returns {Promise<boolean>} true si se reordenó correctamente
   */
  static async reorder(orderArray) {
    // Usar transacción para actualizar todos a la vez
    const { transaction } = require("../config/database");

    await transaction(async (client) => {
      for (const item of orderArray) {
        await client.query(
          "UPDATE services SET display_order = $1 WHERE service_id = $2",
          [item.order, item.service_id]
        );
      }
    });

    return true;
  }

  /**
   * Importa servicios desde JSON (para migración)
   *
   * @param {Array} servicesArray - Array de servicios del JSON
   * @param {string} userId - UUID del usuario que importa
   * @returns {Promise<Array>} Servicios importados
   */
  static async importFromJSON(servicesArray, userId) {
    const imported = [];

    for (let i = 0; i < servicesArray.length; i++) {
      const service = servicesArray[i];

      try {
        const created = await this.create({
          service_id: service.id,
          title: service.titulo,
          description: service.descripcion,
          image_url: service.imagen,
          features: service.caracteristicas || [],
          benefits: service.beneficios || [],
          display_order: i,
          status: "active",
          created_by: userId,
        });

        imported.push(created);
      } catch (error) {
        // Si ya existe, actualizar
        if (error.message.includes("duplicate")) {
          const updated = await this.update(service.id, {
            title: service.titulo,
            description: service.descripcion,
            image_url: service.imagen,
            features: service.caracteristicas || [],
            benefits: service.beneficios || [],
            display_order: i,
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
   * Helper privado para parsear servicios (convierte JSON strings a objetos)
   *
   * @private
   * @param {Object} row - Fila de la base de datos
   * @returns {Object} Servicio parseado
   */
  static _parseService(row) {
    return {
      ...row,
      features:
        typeof row.features === "string"
          ? JSON.parse(row.features)
          : row.features,
      benefits:
        typeof row.benefits === "string"
          ? JSON.parse(row.benefits)
          : row.benefits,
    };
  }
}

module.exports = Service;
