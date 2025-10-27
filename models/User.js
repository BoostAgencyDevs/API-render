/**
 * @fileoverview Modelo de Usuario para Boost Agency
 *
 * Este modelo encapsula toda la lógica relacionada con usuarios:
 * - Crear nuevos usuarios
 * - Autenticación y validación
 * - Gestión de roles y permisos
 * - Actualización de perfil
 *
 * @author Boost Agency Development Team
 * @version 2.0.0
 */

const { query } = require("../config/database");
const bcrypt = require("bcryptjs");

class User {
  /**
   * Crea un nuevo usuario en la base de datos
   *
   * @param {Object} userData - Datos del usuario
   * @param {string} userData.email - Email del usuario
   * @param {string} userData.password - Contraseña en texto plano (se hashea automáticamente)
   * @param {string} userData.full_name - Nombre completo
   * @param {string} [userData.role='user'] - Rol del usuario (admin, editor, user)
   * @param {string} [userData.phone] - Teléfono (opcional)
   * @returns {Promise<Object>} Usuario creado (sin password_hash)
   */
  static async create(userData) {
    const { email, password, full_name, role = "user", phone } = userData;

    // Hashear la contraseña con bcrypt (10 rounds)
    const password_hash = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO users (email, password_hash, full_name, role, phone, status)
      VALUES ($1, $2, $3, $4, $5, 'active')
      RETURNING id, email, full_name, role, status, phone, created_at
    `;

    const result = await query(sql, [
      email,
      password_hash,
      full_name,
      role,
      phone,
    ]);
    return result.rows[0];
  }

  /**
   * Busca un usuario por email
   *
   * @param {string} email - Email del usuario
   * @param {boolean} [includePassword=false] - Si incluir el hash de contraseña
   * @returns {Promise<Object|null>} Usuario encontrado o null
   */
  static async findByEmail(email, includePassword = false) {
    const fields = includePassword
      ? "id, email, password_hash, full_name, role, status, phone, avatar_url, created_at, last_login"
      : "id, email, full_name, role, status, phone, avatar_url, created_at, last_login";

    const sql = `SELECT ${fields} FROM users WHERE email = $1`;
    const result = await query(sql, [email]);

    return result.rows[0] || null;
  }

  /**
   * Busca un usuario por ID
   *
   * @param {string} userId - UUID del usuario
   * @returns {Promise<Object|null>} Usuario encontrado o null
   */
  static async findById(userId) {
    const sql = `
      SELECT id, email, full_name, role, status, phone, avatar_url, created_at, last_login
      FROM users
      WHERE id = $1
    `;

    const result = await query(sql, [userId]);
    return result.rows[0] || null;
  }

  /**
   * Verifica si una contraseña coincide con el hash almacenado
   *
   * @param {string} plainPassword - Contraseña en texto plano
   * @param {string} hashedPassword - Hash almacenado en la BD
   * @returns {Promise<boolean>} true si coincide, false si no
   */
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Actualiza el timestamp de último login
   *
   * @param {string} userId - UUID del usuario
   * @returns {Promise<void>}
   */
  static async updateLastLogin(userId) {
    const sql = `
      UPDATE users 
      SET last_login = CURRENT_TIMESTAMP 
      WHERE id = $1
    `;

    await query(sql, [userId]);
  }

  /**
   * Obtiene todos los usuarios con paginación y filtros
   *
   * @param {Object} options - Opciones de búsqueda
   * @param {number} [options.page=1] - Página actual
   * @param {number} [options.limit=20] - Usuarios por página
   * @param {string} [options.role] - Filtrar por rol
   * @param {string} [options.status] - Filtrar por estado
   * @returns {Promise<Object>} { users: [], pagination: {} }
   */
  static async findAll(options = {}) {
    const { page = 1, limit = 20, role, status } = options;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT id, email, full_name, role, status, phone, created_at, last_login
      FROM users
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    // Aplicar filtros opcionales
    if (role) {
      sql += ` AND role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }

    if (status) {
      sql += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // Ordenar y paginar
    sql += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${
      paramIndex + 1
    }`;
    params.push(limit, offset);

    const result = await query(sql, params);

    // Contar total para paginación
    const countSql =
      `SELECT COUNT(*) FROM users WHERE 1=1` +
      (role ? ` AND role = '${role}'` : "") +
      (status ? ` AND status = '${status}'` : "");
    const countResult = await query(countSql);
    const total = parseInt(countResult.rows[0].count);

    return {
      users: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Actualiza un usuario existente
   *
   * @param {string} userId - UUID del usuario
   * @param {Object} updates - Campos a actualizar
   * @returns {Promise<Object>} Usuario actualizado
   */
  static async update(userId, updates) {
    const allowedFields = [
      "full_name",
      "phone",
      "avatar_url",
      "role",
      "status",
    ];
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    // Construir query dinámicamente solo con campos permitidos
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

    values.push(userId);

    const sql = `
      UPDATE users 
      SET ${updateFields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING id, email, full_name, role, status, phone, avatar_url, updated_at
    `;

    const result = await query(sql, values);
    return result.rows[0];
  }

  /**
   * Cambia la contraseña de un usuario
   *
   * @param {string} userId - UUID del usuario
   * @param {string} newPassword - Nueva contraseña en texto plano
   * @returns {Promise<boolean>} true si se actualizó correctamente
   */
  static async changePassword(userId, newPassword) {
    const password_hash = await bcrypt.hash(newPassword, 10);

    const sql = `
      UPDATE users 
      SET password_hash = $1 
      WHERE id = $2
    `;

    await query(sql, [password_hash, userId]);
    return true;
  }

  /**
   * Cambia el estado de un usuario (activar/desactivar/suspender)
   *
   * @param {string} userId - UUID del usuario
   * @param {string} newStatus - Nuevo estado ('active', 'inactive', 'suspended')
   * @returns {Promise<Object>} Usuario actualizado
   */
  static async changeStatus(userId, newStatus) {
    const validStatuses = ["active", "inactive", "suspended"];

    if (!validStatuses.includes(newStatus)) {
      throw new Error(
        `Estado inválido. Debe ser uno de: ${validStatuses.join(", ")}`
      );
    }

    const sql = `
      UPDATE users 
      SET status = $1 
      WHERE id = $2
      RETURNING id, email, full_name, role, status
    `;

    const result = await query(sql, [newStatus, userId]);
    return result.rows[0];
  }

  /**
   * Elimina un usuario (soft delete - cambia estado a 'inactive')
   * Para eliminar permanentemente, usar deleteHard()
   *
   * @param {string} userId - UUID del usuario
   * @returns {Promise<boolean>} true si se eliminó correctamente
   */
  static async delete(userId) {
    return await this.changeStatus(userId, "inactive");
  }

  /**
   * Elimina permanentemente un usuario de la base de datos
   * ⚠️ PRECAUCIÓN: Esta acción no se puede deshacer
   *
   * @param {string} userId - UUID del usuario
   * @returns {Promise<boolean>} true si se eliminó correctamente
   */
  static async deleteHard(userId) {
    const sql = `DELETE FROM users WHERE id = $1`;
    await query(sql, [userId]);
    return true;
  }

  /**
   * Verifica si un email ya está registrado
   *
   * @param {string} email - Email a verificar
   * @returns {Promise<boolean>} true si existe, false si no
   */
  static async emailExists(email) {
    const sql = `SELECT id FROM users WHERE email = $1`;
    const result = await query(sql, [email]);
    return result.rows.length > 0;
  }
}

module.exports = User;
