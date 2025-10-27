/**
 * @fileoverview Modelo de Lead para Boost Agency CRM
 *
 * Gestiona todos los leads capturados desde formularios web.
 * Este modelo reemplaza completamente el sistema de archivos JSON.
 *
 * Estados posibles: 'nuevo', 'contactado', 'calificado', 'cerrado'
 *
 * @author Boost Agency Development Team
 * @version 2.0.0
 */

const { query } = require("../config/database");

class Lead {
  /**
   * Crea un nuevo lead en la base de datos
   *
   * DÓNDE SE USA: Cuando alguien llena el formulario de contacto en el sitio web
   *
   * @param {Object} leadData - Datos del lead
   * @param {string} leadData.nombre - Nombre del contacto
   * @param {string} leadData.email - Email del contacto
   * @param {string} leadData.telefono - Teléfono del contacto
   * @param {string} leadData.servicio_interes - Servicio que le interesa
   * @param {string} [leadData.empresa] - Empresa (opcional)
   * @param {string} [leadData.presupuesto] - Presupuesto estimado (opcional)
   * @param {string} [leadData.mensaje] - Mensaje adicional (opcional)
   * @param {string} [leadData.origen='formulario-web'] - De dónde viene el lead
   * @returns {Promise<Object>} Lead creado con su ID
   */
  static async create(leadData) {
    const {
      nombre,
      email,
      telefono,
      empresa = "",
      servicio_interes,
      presupuesto = "",
      mensaje = "",
      origen = "formulario-web",
    } = leadData;

    const sql = `
      INSERT INTO leads (
        nombre, email, telefono, empresa, 
        servicio_interes, presupuesto, mensaje, 
        origen, estado, fecha
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'nuevo', CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const result = await query(sql, [
      nombre,
      email,
      telefono,
      empresa,
      servicio_interes,
      presupuesto,
      mensaje,
      origen,
    ]);

    return result.rows[0];
  }

  /**
   * Busca un lead por su ID
   *
   * @param {string} leadId - UUID del lead
   * @returns {Promise<Object|null>} Lead encontrado o null
   */
  static async findById(leadId) {
    const sql = `
      SELECT 
        l.*,
        u.full_name as assigned_to_name,
        u.email as assigned_to_email
      FROM leads l
      LEFT JOIN users u ON l.assigned_to = u.id
      WHERE l.id = $1
    `;

    const result = await query(sql, [leadId]);
    return result.rows[0] || null;
  }

  /**
   * Obtiene todos los leads con filtros y paginación
   *
   * DÓNDE SE USA: En el dashboard del CRM para listar todos los leads
   *
   * @param {Object} filters - Filtros de búsqueda
   * @param {string} [filters.estado] - Filtrar por estado
   * @param {string} [filters.servicio] - Filtrar por servicio de interés
   * @param {string} [filters.fecha_desde] - Filtrar desde fecha (ISO string)
   * @param {string} [filters.fecha_hasta] - Filtrar hasta fecha (ISO string)
   * @param {string} [filters.assigned_to] - Filtrar por usuario asignado
   * @param {number} [filters.page=1] - Página actual
   * @param {number} [filters.limit=20] - Leads por página
   * @returns {Promise<Object>} { leads: [], pagination: {} }
   */
  static async findAll(filters = {}) {
    const {
      estado,
      servicio,
      fecha_desde,
      fecha_hasta,
      assigned_to,
      page = 1,
      limit = 20,
    } = filters;

    const offset = (page - 1) * limit;

    let sql = `
      SELECT 
        l.*,
        u.full_name as assigned_to_name
      FROM leads l
      LEFT JOIN users u ON l.assigned_to = u.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    // Aplicar filtros dinámicamente
    if (estado) {
      sql += ` AND l.estado = $${paramIndex}`;
      params.push(estado);
      paramIndex++;
    }

    if (servicio) {
      sql += ` AND l.servicio_interes = $${paramIndex}`;
      params.push(servicio);
      paramIndex++;
    }

    if (fecha_desde) {
      sql += ` AND l.fecha >= $${paramIndex}`;
      params.push(fecha_desde);
      paramIndex++;
    }

    if (fecha_hasta) {
      sql += ` AND l.fecha <= $${paramIndex}`;
      params.push(fecha_hasta);
      paramIndex++;
    }

    if (assigned_to) {
      sql += ` AND l.assigned_to = $${paramIndex}`;
      params.push(assigned_to);
      paramIndex++;
    }

    // Ordenar por fecha (más recientes primero)
    sql += ` ORDER BY l.fecha DESC LIMIT $${paramIndex} OFFSET $${
      paramIndex + 1
    }`;
    params.push(limit, offset);

    const result = await query(sql, params);

    // Contar total para paginación
    let countSql = `SELECT COUNT(*) FROM leads WHERE 1=1`;
    const countParams = [];
    let countIndex = 1;

    if (estado) {
      countSql += ` AND estado = $${countIndex}`;
      countParams.push(estado);
      countIndex++;
    }
    if (servicio) {
      countSql += ` AND servicio_interes = $${countIndex}`;
      countParams.push(servicio);
      countIndex++;
    }
    if (fecha_desde) {
      countSql += ` AND fecha >= $${countIndex}`;
      countParams.push(fecha_desde);
      countIndex++;
    }
    if (fecha_hasta) {
      countSql += ` AND fecha <= $${countIndex}`;
      countParams.push(fecha_hasta);
      countIndex++;
    }
    if (assigned_to) {
      countSql += ` AND assigned_to = $${countIndex}`;
      countParams.push(assigned_to);
    }

    const countResult = await query(countSql, countParams);
    const total = parseInt(countResult.rows[0].count);

    return {
      leads: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Actualiza el estado de un lead
   *
   * DÓNDE SE USA: Cuando un vendedor cambia el estado del lead en el CRM
   *
   * @param {string} leadId - UUID del lead
   * @param {string} nuevoEstado - Nuevo estado ('nuevo', 'contactado', 'calificado', 'cerrado')
   * @returns {Promise<Object>} Lead actualizado
   */
  static async updateEstado(leadId, nuevoEstado) {
    const estadosValidos = ["nuevo", "contactado", "calificado", "cerrado"];

    if (!estadosValidos.includes(nuevoEstado)) {
      throw new Error(
        `Estado inválido. Debe ser uno de: ${estadosValidos.join(", ")}`
      );
    }

    const sql = `
      UPDATE leads 
      SET estado = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    const result = await query(sql, [nuevoEstado, leadId]);

    if (result.rows.length === 0) {
      throw new Error("Lead no encontrado");
    }

    return result.rows[0];
  }

  /**
   * Actualiza completamente un lead
   *
   * @param {string} leadId - UUID del lead
   * @param {Object} updates - Campos a actualizar
   * @returns {Promise<Object>} Lead actualizado
   */
  static async update(leadId, updates) {
    const allowedFields = [
      "nombre",
      "email",
      "telefono",
      "empresa",
      "servicio_interes",
      "presupuesto",
      "mensaje",
      "estado",
    ];

    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    // Construir query dinámicamente
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      throw new Error("No hay campos válidos para actualizar");
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(leadId);

    const sql = `
      UPDATE leads 
      SET ${updateFields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await query(sql, values);

    if (result.rows.length === 0) {
      throw new Error("Lead no encontrado");
    }

    return result.rows[0];
  }

  /**
   * Asigna un lead a un usuario (vendedor)
   *
   * @param {string} leadId - UUID del lead
   * @param {string} userId - UUID del usuario a asignar
   * @returns {Promise<Object>} Lead actualizado
   */
  static async assignTo(leadId, userId) {
    const sql = `
      UPDATE leads 
      SET assigned_to = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    const result = await query(sql, [userId, leadId]);

    if (result.rows.length === 0) {
      throw new Error("Lead no encontrado");
    }

    return result.rows[0];
  }

  /**
   * Elimina un lead permanentemente
   *
   * @param {string} leadId - UUID del lead
   * @returns {Promise<Object>} Lead eliminado
   */
  static async delete(leadId) {
    const sql = `
      DELETE FROM leads 
      WHERE id = $1
      RETURNING *
    `;

    const result = await query(sql, [leadId]);

    if (result.rows.length === 0) {
      throw new Error("Lead no encontrado");
    }

    return result.rows[0];
  }

  /**
   * Obtiene estadísticas generales de leads
   *
   * DÓNDE SE USA: En el dashboard principal para mostrar métricas
   *
   * @returns {Promise<Object>} Estadísticas detalladas
   */
  static async getEstadisticas() {
    // Estadísticas por estado
    const estadosSql = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE estado = 'nuevo') as nuevos,
        COUNT(*) FILTER (WHERE estado = 'contactado') as contactados,
        COUNT(*) FILTER (WHERE estado = 'calificado') as calificados,
        COUNT(*) FILTER (WHERE estado = 'cerrado') as cerrados
      FROM leads
    `;
    const estadosResult = await query(estadosSql);

    // Estadísticas por servicio
    const serviciosSql = `
      SELECT servicio_interes, COUNT(*) as cantidad
      FROM leads
      GROUP BY servicio_interes
      ORDER BY cantidad DESC
    `;
    const serviciosResult = await query(serviciosSql);

    // Estadísticas por mes (últimos 12 meses)
    const mesesSql = `
      SELECT 
        TO_CHAR(fecha, 'YYYY-MM') as mes,
        COUNT(*) as cantidad
      FROM leads
      WHERE fecha >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY mes
      ORDER BY mes DESC
    `;
    const mesesResult = await query(mesesSql);

    // Convertir por_servicio a objeto
    const porServicio = {};
    serviciosResult.rows.forEach((row) => {
      porServicio[row.servicio_interes] = parseInt(row.cantidad);
    });

    // Convertir por_mes a objeto
    const porMes = {};
    mesesResult.rows.forEach((row) => {
      porMes[row.mes] = parseInt(row.cantidad);
    });

    return {
      ...estadosResult.rows[0],
      por_servicio: porServicio,
      por_mes: porMes,
    };
  }

  /**
   * Busca leads por texto (nombre, email, empresa, mensaje)
   *
   * @param {string} searchTerm - Término de búsqueda
   * @param {number} limit - Máximo de resultados
   * @returns {Promise<Array>} Leads encontrados
   */
  static async search(searchTerm, limit = 10) {
    const sql = `
      SELECT *
      FROM leads
      WHERE 
        nombre ILIKE $1 OR
        email ILIKE $1 OR
        empresa ILIKE $1 OR
        mensaje ILIKE $1
      ORDER BY fecha DESC
      LIMIT $2
    `;

    const result = await query(sql, [`%${searchTerm}%`, limit]);
    return result.rows;
  }
}

module.exports = Lead;
