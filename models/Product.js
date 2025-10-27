/**
 * @fileoverview Modelo de Productos para Boost Agency
 *
 * Gestiona los productos digitales de la tienda:
 * - Cursos digitales
 * - Templates
 * - E-books
 *
 * Reemplaza: tienda.json
 *
 * @author Boost Agency Development Team
 * @version 2.0.0
 */

const { query } = require("../config/database");

class Product {
  /**
   * Crea un nuevo producto
   *
   * DÓNDE SE USA: Cuando un admin añade un nuevo producto a la tienda
   *
   * @param {Object} productData - Datos del producto
   * @param {string} productData.product_id - ID único
   * @param {string} productData.name - Nombre del producto
   * @param {string} productData.description - Descripción completa
   * @param {number} productData.price - Precio regular
   * @param {number} [productData.discount_price] - Precio con descuento
   * @param {string} [productData.price_currency='USD'] - Moneda
   * @param {string} [productData.image_url] - URL de la imagen
   * @param {boolean} [productData.is_featured=false] - Producto destacado
   * @param {Array} [productData.features] - Array de características
   * @param {Array} [productData.includes] - Array de lo que incluye
   * @param {string} [productData.category_id] - UUID de la categoría
   * @param {number} [productData.display_order=0] - Orden de visualización
   * @param {string} [productData.status='active'] - Estado
   * @returns {Promise<Object>} Producto creado
   */
  static async create(productData) {
    const {
      product_id,
      name,
      description,
      price,
      discount_price = null,
      price_currency = "USD",
      image_url = null,
      is_featured = false,
      features = [],
      includes = [],
      category_id = null,
      display_order = 0,
      status = "active",
    } = productData;

    const sql = `
      INSERT INTO products (
        product_id, name, description, price, discount_price,
        price_currency, image_url, is_featured, features,
        includes, category_id, display_order, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const result = await query(sql, [
      product_id,
      name,
      description,
      price,
      discount_price,
      price_currency,
      image_url,
      is_featured,
      JSON.stringify(features),
      JSON.stringify(includes),
      category_id,
      display_order,
      status,
    ]);

    return this._parseProduct(result.rows[0]);
  }

  /**
   * Obtiene un producto por su product_id
   *
   * DÓNDE SE USA: En la página de detalle del producto
   * Ejemplo: Product.getByProductId('curso-marketing-digital')
   *
   * @param {string} productId - ID del producto
   * @returns {Promise<Object|null>} Producto encontrado o null
   */
  static async getByProductId(productId) {
    const sql = `
      SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.product_id = $1 AND p.status = 'active'
    `;

    const result = await query(sql, [productId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this._parseProduct(result.rows[0]);
  }

  /**
   * Obtiene un producto por UUID
   *
   * @param {string} id - UUID del producto
   * @returns {Promise<Object|null>} Producto encontrado o null
   */
  static async getById(id) {
    const sql = `
      SELECT 
        p.*,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1
    `;

    const result = await query(sql, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this._parseProduct(result.rows[0]);
  }

  /**
   * Obtiene todos los productos con filtros y paginación
   *
   * DÓNDE SE USA: En la tienda para listar todos los productos
   *
   * @param {Object} options - Opciones de búsqueda
   * @param {number} [options.page=1] - Página actual
   * @param {number} [options.limit=20] - Productos por página
   * @param {string} [options.category_id] - Filtrar por categoría
   * @param {string} [options.status] - Filtrar por estado
   * @param {boolean} [options.onlyFeatured=false] - Solo destacados
   * @returns {Promise<Object>} { products: [], pagination: {} }
   */
  static async findAll(options = {}) {
    const {
      page = 1,
      limit = 20,
      category_id,
      status = "active",
      onlyFeatured = false,
    } = options;

    const offset = (page - 1) * limit;

    let sql = `
      SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (status) {
      sql += ` AND p.status = ${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (category_id) {
      sql += ` AND p.category_id = ${paramIndex}`;
      params.push(category_id);
      paramIndex++;
    }

    if (onlyFeatured) {
      sql += ` AND p.is_featured = true`;
    }

    sql += ` ORDER BY p.display_order ASC, p.created_at DESC LIMIT ${paramIndex} OFFSET ${
      paramIndex + 1
    }`;
    params.push(limit, offset);

    const result = await query(sql, params);

    // Contar total
    let countSql = `SELECT COUNT(*) FROM products WHERE 1=1`;
    const countParams = [];
    let countIndex = 1;

    if (status) {
      countSql += ` AND status = ${countIndex}`;
      countParams.push(status);
      countIndex++;
    }

    if (category_id) {
      countSql += ` AND category_id = ${countIndex}`;
      countParams.push(category_id);
      countIndex++;
    }

    if (onlyFeatured) {
      countSql += ` AND is_featured = true`;
    }

    const countResult = await query(countSql, countParams);
    const total = parseInt(countResult.rows[0].count);

    return {
      products: result.rows.map((row) => this._parseProduct(row)),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtiene productos por categoría
   *
   * @param {string} categorySlug - Slug de la categoría ('cursos', 'templates', 'ebooks')
   * @returns {Promise<Array>} Productos de la categoría
   */
  static async getByCategory(categorySlug) {
    const sql = `
      SELECT 
        p.*,
        c.name as category_name
      FROM products p
      INNER JOIN categories c ON p.category_id = c.id
      WHERE c.slug = $1 AND p.status = 'active'
      ORDER BY p.display_order ASC, p.created_at DESC
    `;

    const result = await query(sql, [categorySlug]);
    return result.rows.map((row) => this._parseProduct(row));
  }

  /**
   * Obtiene productos destacados
   *
   * DÓNDE SE USA: En la home para mostrar productos destacados
   *
   * @param {number} limit - Cantidad máxima
   * @returns {Promise<Array>} Productos destacados
   */
  static async getFeatured(limit = 3) {
    const sql = `
      SELECT 
        p.*,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'active' AND p.is_featured = true
      ORDER BY p.display_order ASC
      LIMIT $1
    `;

    const result = await query(sql, [limit]);
    return result.rows.map((row) => this._parseProduct(row));
  }

  /**
   * Actualiza un producto existente
   *
   * @param {string} productId - product_id del producto
   * @param {Object} updates - Campos a actualizar
   * @returns {Promise<Object>} Producto actualizado
   */
  static async update(productId, updates) {
    const allowedFields = [
      "name",
      "description",
      "price",
      "discount_price",
      "price_currency",
      "image_url",
      "is_featured",
      "features",
      "includes",
      "category_id",
      "display_order",
      "status",
    ];

    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        // Convertir arrays a JSON
        if (key === "features" || key === "includes") {
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
    values.push(productId);

    const sql = `
      UPDATE products
      SET ${updateFields.join(", ")}
      WHERE product_id = ${paramIndex}
      RETURNING *
    `;

    const result = await query(sql, values);

    if (result.rows.length === 0) {
      throw new Error("Producto no encontrado");
    }

    return this._parseProduct(result.rows[0]);
  }

  /**
   * Marca/desmarca un producto como destacado
   *
   * @param {string} productId - product_id del producto
   * @param {boolean} featured - true para destacar, false para quitar
   * @returns {Promise<Object>} Producto actualizado
   */
  static async setFeatured(productId, featured) {
    const sql = `
      UPDATE products
      SET is_featured = $1, updated_at = CURRENT_TIMESTAMP
      WHERE product_id = $2
      RETURNING *
    `;

    const result = await query(sql, [featured, productId]);

    if (result.rows.length === 0) {
      throw new Error("Producto no encontrado");
    }

    return this._parseProduct(result.rows[0]);
  }

  /**
   * Cambia el estado de un producto
   *
   * @param {string} productId - product_id del producto
   * @param {string} newStatus - Nuevo estado ('active', 'inactive')
   * @returns {Promise<Object>} Producto actualizado
   */
  static async changeStatus(productId, newStatus) {
    const validStatuses = ["active", "inactive"];

    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Estado inválido. Debe ser: ${validStatuses.join(", ")}`);
    }

    const sql = `
      UPDATE products
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE product_id = $2
      RETURNING *
    `;

    const result = await query(sql, [newStatus, productId]);

    if (result.rows.length === 0) {
      throw new Error("Producto no encontrado");
    }

    return this._parseProduct(result.rows[0]);
  }

  /**
   * Elimina un producto (soft delete - cambia estado a 'inactive')
   *
   * @param {string} productId - product_id del producto
   * @returns {Promise<boolean>} true si se desactivó
   */
  static async delete(productId) {
    await this.changeStatus(productId, "inactive");
    return true;
  }

  /**
   * Elimina permanentemente un producto
   * ⚠️ PRECAUCIÓN: No se puede deshacer
   *
   * @param {string} productId - product_id del producto
   * @returns {Promise<boolean>} true si se eliminó
   */
  static async deleteHard(productId) {
    const sql = `
      DELETE FROM products
      WHERE product_id = $1
      RETURNING *
    `;

    const result = await query(sql, [productId]);

    if (result.rows.length === 0) {
      throw new Error("Producto no encontrado");
    }

    return true;
  }

  /**
   * Busca productos por texto
   *
   * @param {string} searchTerm - Término de búsqueda
   * @param {number} limit - Máximo de resultados
   * @returns {Promise<Array>} Productos encontrados
   */
  static async search(searchTerm, limit = 10) {
    const sql = `
      SELECT 
        p.*,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 
        p.status = 'active' AND (
          p.name ILIKE $1 OR
          p.description ILIKE $1
        )
      ORDER BY p.is_featured DESC, p.display_order ASC
      LIMIT $2
    `;

    const result = await query(sql, [`%${searchTerm}%`, limit]);
    return result.rows.map((row) => this._parseProduct(row));
  }

  /**
   * Reordena los productos
   *
   * @param {Array} orderArray - Array de objetos [{product_id: 'x', order: 1}, ...]
   * @returns {Promise<boolean>} true si se reordenó correctamente
   */
  static async reorder(orderArray) {
    const { transaction } = require("../config/database");

    await transaction(async (client) => {
      for (const item of orderArray) {
        await client.query(
          "UPDATE products SET display_order = $1 WHERE product_id = $2",
          [item.order, item.product_id]
        );
      }
    });

    return true;
  }

  /**
   * Importa productos desde JSON (para migración)
   *
   * @param {Array} productsArray - Array de productos del JSON
   * @param {Object} categoriesMap - Mapa de categorías {slug: uuid}
   * @returns {Promise<Array>} Productos importados
   */
  static async importFromJSON(productsArray, categoriesMap = {}) {
    const imported = [];

    for (let i = 0; i < productsArray.length; i++) {
      const product = productsArray[i];

      // Mapear la categoría del JSON al UUID de la BD
      const categoryId = categoriesMap[product.categoria] || null;

      try {
        const created = await this.create({
          product_id: product.id,
          name: product.nombre,
          description: product.descripcion,
          price: parseFloat(product.precio),
          discount_price: product.precio_descuento
            ? parseFloat(product.precio_descuento)
            : null,
          price_currency: "USD",
          image_url: product.imagen,
          is_featured: product.destacado || false,
          features: product.caracteristicas || [],
          includes: product.incluye || [],
          category_id: categoryId,
          display_order: i,
          status: "active",
        });

        imported.push(created);
      } catch (error) {
        // Si ya existe, actualizar
        if (error.message.includes("duplicate")) {
          const updated = await this.update(product.id, {
            name: product.nombre,
            description: product.descripcion,
            price: parseFloat(product.precio),
            discount_price: product.precio_descuento
              ? parseFloat(product.precio_descuento)
              : null,
            image_url: product.imagen,
            is_featured: product.destacado || false,
            features: product.caracteristicas || [],
            includes: product.incluye || [],
            category_id: categoryId,
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
   * Helper privado para parsear productos (convierte JSON strings a objetos)
   *
   * @private
   * @param {Object} row - Fila de la base de datos
   * @returns {Object} Producto parseado
   */
  static _parseProduct(row) {
    return {
      ...row,
      features:
        typeof row.features === "string"
          ? JSON.parse(row.features)
          : row.features,
      includes:
        typeof row.includes === "string"
          ? JSON.parse(row.includes)
          : row.includes,
    };
  }
}

module.exports = Product;
