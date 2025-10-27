/**
 * @fileoverview Modelo de Planes para Boost Agency
 *
 * Gestiona los planes de servicio de la agencia:
 * - Starter
 * - Professional
 * - Enterprise
 *
 * Reemplaza: planes.json
 *
 * @author Boost Agency Development Team
 * @version 2.0.0
 */

const { query } = require("../config/database");

class Plan {
  /**
   * Crea un nuevo plan
   *
   * DÓNDE SE USA: Cuando un admin crea un nuevo plan de servicio
   *
   * @param {Object} planData - Datos del plan
   * @param {string} planData.plan_id - ID único ('starter', 'professional', 'enterprise')
   * @param {string} planData.name - Nombre del plan
   * @param {number} planData.price - Precio del plan
   * @param {string} [planData.price_currency='USD'] - Moneda
   * @param {string} [planData.billing_period='mes'] - Periodo ('mes', 'año')
   * @param {string} planData.description - Descripción
   * @param {Array} planData.features - Array de características incluidas
   * @param {boolean} [planData.is_featured=false] - Plan destacado
   * @param {string} [planData.cta_text] - Texto del botón CTA
   * @param {string} [planData.notes] - Notas adicionales
   * @param {number} [planData.display_order=0] - Orden de visualización
   * @param {string} [planData.status='active'] - Estado del plan
   * @returns {Promise<Object>} Plan creado
   */
  static async create(planData) {
    const {
      plan_id,
      name,
      price,
      price_currency = "USD",
      billing_period = "mes",
      description,
      features,
      is_featured = false,
      cta_text = "Comenzar Ahora",
      notes = null,
      display_order = 0,
      status = "active",
    } = planData;

    const sql = `
      INSERT INTO plans (
        plan_id, name, price, price_currency, billing_period,
        description, features, is_featured, cta_text, notes,
        display_order, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const result = await query(sql, [
      plan_id,
      name,
      price,
      price_currency,
      billing_period,
      description,
      JSON.stringify(features),
      is_featured,
      cta_text,
      notes,
      display_order,
      status,
    ]);

    return this._parsePlan(result.rows[0]);
  }

  /**
   * Obtiene un plan por su plan_id
   *
   * DÓNDE SE USA: En la página de pricing para mostrar detalles del plan
   * Ejemplo: Plan.getByPlanId('professional')
   *
   * @param {string} planId - ID del plan
   * @returns {Promise<Object|null>} Plan encontrado o null
   */
  static async getByPlanId(planId) {
    const sql = `
      SELECT * FROM plans
      WHERE plan_id = $1 AND status = 'active'
    `;

    const result = await query(sql, [planId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this._parsePlan(result.rows[0]);
  }

  /**
   * Obtiene un plan por UUID
   *
   * @param {string} id - UUID del plan
   * @returns {Promise<Object|null>} Plan encontrado o null
   */
  static async getById(id) {
    const sql = `
      SELECT * FROM plans
      WHERE id = $1
    `;

    const result = await query(sql, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this._parsePlan(result.rows[0]);
  }

  /**
   * Obtiene todos los planes activos
   *
   * DÓNDE SE USA: En la página de pricing para mostrar todos los planes
   *
   * @param {Object} options - Opciones de filtrado
   * @param {string} [options.status] - Filtrar por estado
   * @param {boolean} [options.includeInactive=false] - Incluir inactivos
   * @returns {Promise<Array>} Lista de planes ordenados
   */
  static async getAll(options = {}) {
    const { status, includeInactive = false } = options;

    let sql = `
      SELECT * FROM plans
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

    sql += ` ORDER BY display_order ASC, price ASC`;

    const result = await query(sql, params);

    return result.rows.map((row) => this._parsePlan(row));
  }

  /**
   * Obtiene el plan destacado (featured)
   *
   * DÓNDE SE USA: Para resaltar el plan recomendado en la página de pricing
   *
   * @returns {Promise<Object|null>} Plan destacado o null
   */
  static async getFeatured() {
    const sql = `
      SELECT * FROM plans
      WHERE status = 'active' AND is_featured = true
      ORDER BY display_order ASC
      LIMIT 1
    `;

    const result = await query(sql);

    if (result.rows.length === 0) {
      return null;
    }

    return this._parsePlan(result.rows[0]);
  }

  /**
   * Actualiza un plan existente
   *
   * @param {string} planId - plan_id del plan
   * @param {Object} updates - Campos a actualizar
   * @returns {Promise<Object>} Plan actualizado
   */
  static async update(planId, updates) {
    const allowedFields = [
      "name",
      "price",
      "price_currency",
      "billing_period",
      "description",
      "features",
      "is_featured",
      "cta_text",
      "notes",
      "display_order",
      "status",
    ];

    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        // Convertir features a JSON
        if (key === "features") {
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
    values.push(planId);

    const sql = `
      UPDATE plans
      SET ${updateFields.join(", ")}
      WHERE plan_id = $${paramIndex}
      RETURNING *
    `;

    const result = await query(sql, values);

    if (result.rows.length === 0) {
      throw new Error("Plan no encontrado");
    }

    return this._parsePlan(result.rows[0]);
  }

  /**
   * Marca/desmarca un plan como destacado
   * Solo puede haber un plan destacado a la vez
   *
   * @param {string} planId - plan_id del plan
   * @param {boolean} featured - true para destacar, false para quitar
   * @returns {Promise<Object>} Plan actualizado
   */
  static async setFeatured(planId, featured) {
    const { transaction } = require("../config/database");

    return await transaction(async (client) => {
      // Si se está marcando como featured, quitar featured de los demás
      if (featured) {
        await client.query(
          "UPDATE plans SET is_featured = false WHERE is_featured = true"
        );
      }

      // Actualizar el plan seleccionado
      const result = await client.query(
        "UPDATE plans SET is_featured = $1, updated_at = CURRENT_TIMESTAMP WHERE plan_id = $2 RETURNING *",
        [featured, planId]
      );

      if (result.rows.length === 0) {
        throw new Error("Plan no encontrado");
      }

      return this._parsePlan(result.rows[0]);
    });
  }

  /**
   * Cambia el estado de un plan
   *
   * @param {string} planId - plan_id del plan
   * @param {string} newStatus - Nuevo estado ('active', 'inactive')
   * @returns {Promise<Object>} Plan actualizado
   */
  static async changeStatus(planId, newStatus) {
    const validStatuses = ["active", "inactive"];

    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Estado inválido. Debe ser: ${validStatuses.join(", ")}`);
    }

    const sql = `
      UPDATE plans
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE plan_id = $2
      RETURNING *
    `;

    const result = await query(sql, [newStatus, planId]);

    if (result.rows.length === 0) {
      throw new Error("Plan no encontrado");
    }

    return this._parsePlan(result.rows[0]);
  }

  /**
   * Elimina un plan (soft delete - cambia estado a 'inactive')
   *
   * @param {string} planId - plan_id del plan
   * @returns {Promise<boolean>} true si se desactivó
   */
  static async delete(planId) {
    await this.changeStatus(planId, "inactive");
    return true;
  }

  /**
   * Elimina permanentemente un plan
   * ⚠️ PRECAUCIÓN: No se puede deshacer
   *
   * @param {string} planId - plan_id del plan
   * @returns {Promise<boolean>} true si se eliminó
   */
  static async deleteHard(planId) {
    const sql = `
      DELETE FROM plans
      WHERE plan_id = $1
      RETURNING *
    `;

    const result = await query(sql, [planId]);

    if (result.rows.length === 0) {
      throw new Error("Plan no encontrado");
    }

    return true;
  }

  /**
   * Reordena los planes
   *
   * @param {Array} orderArray - Array de objetos [{plan_id: 'x', order: 1}, ...]
   * @returns {Promise<boolean>} true si se reordenó correctamente
   */
  static async reorder(orderArray) {
    const { transaction } = require("../config/database");

    await transaction(async (client) => {
      for (const item of orderArray) {
        await client.query(
          "UPDATE plans SET display_order = $1 WHERE plan_id = $2",
          [item.order, item.plan_id]
        );
      }
    });

    return true;
  }

  /**
   * Importa planes desde JSON (para migración)
   *
   * @param {Array} plansArray - Array de planes del JSON
   * @returns {Promise<Array>} Planes importados
   */
  static async importFromJSON(plansArray) {
    const imported = [];

    for (let i = 0; i < plansArray.length; i++) {
      const plan = plansArray[i];

      try {
        const created = await this.create({
          plan_id: plan.id,
          name: plan.nombre,
          price: parseFloat(plan.precio),
          price_currency: "USD",
          billing_period: plan.periodo,
          description: plan.descripcion,
          features: plan.caracteristicas,
          is_featured: plan.destacado || false,
          cta_text: plan.cta_texto,
          notes: plan.notas,
          display_order: i,
          status: "active",
        });

        imported.push(created);
      } catch (error) {
        // Si ya existe, actualizar
        if (error.message.includes("duplicate")) {
          const updated = await this.update(plan.id, {
            name: plan.nombre,
            price: parseFloat(plan.precio),
            billing_period: plan.periodo,
            description: plan.descripcion,
            features: plan.caracteristicas,
            is_featured: plan.destacado || false,
            cta_text: plan.cta_texto,
            notes: plan.notas,
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
   * Helper privado para parsear planes (convierte JSON strings a objetos)
   *
   * @private
   * @param {Object} row - Fila de la base de datos
   * @returns {Object} Plan parseado
   */
  static _parsePlan(row) {
    return {
      ...row,
      features:
        typeof row.features === "string"
          ? JSON.parse(row.features)
          : row.features,
    };
  }
}

module.exports = Plan;
