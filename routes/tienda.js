/**
 * @fileoverview Rutas de gestión de la tienda digital
 *
 * 🆕 ARCHIVO NUEVO - Reemplaza tienda.json
 *
 * Gestiona productos digitales:
 * - Cursos
 * - Templates
 * - E-books
 *
 * @author Boost Agency Development Team
 * @version 2.0.0
 */

const express = require("express");
const { authenticateToken, requireEditor } = require("../middleware/auth");
const Product = require("../models/Product");
const router = express.Router();

/**
 * GET /api/tienda
 * Obtiene todos los productos con paginación y filtros
 *
 * Query params:
 * - page: número de página (default: 1)
 * - limit: productos por página (default: 20)
 * - category_id: UUID de la categoría
 * - status: 'active', 'inactive'
 * - onlyFeatured: true/false
 */
router.get("/", async (req, res) => {
  try {
    const { page, limit, category_id, status, onlyFeatured } = req.query;

    const result = await Product.findAll({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      category_id,
      status: status || "active",
      onlyFeatured: onlyFeatured === "true",
    });

    res.json({
      success: true,
      data: result.products,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error obteniendo productos:", error);
    res.status(500).json({
      success: false,
      error: "Error al cargar los productos",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * GET /api/tienda/featured
 * Obtiene productos destacados
 *
 * Query params:
 * - limit: cantidad (default: 3)
 */
router.get("/featured", async (req, res) => {
  try {
    const { limit } = req.query;

    const products = await Product.getFeatured(limit ? parseInt(limit) : 3);

    res.json({
      success: true,
      data: products,
      count: products.length,
    });
  } catch (error) {
    console.error("Error obteniendo productos destacados:", error);
    res.status(500).json({
      success: false,
      error: "Error al cargar los productos destacados",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * GET /api/tienda/search
 * Busca productos por texto
 *
 * Query params:
 * - q: término de búsqueda
 * - limit: máximo de resultados (default: 10)
 */
router.get("/search", async (req, res) => {
  try {
    const { q, limit } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: "El término de búsqueda debe tener al menos 2 caracteres",
      });
    }

    const products = await Product.search(q, limit ? parseInt(limit) : 10);

    res.json({
      success: true,
      data: products,
      count: products.length,
    });
  } catch (error) {
    console.error("Error buscando productos:", error);
    res.status(500).json({
      success: false,
      error: "Error en la búsqueda",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * GET /api/tienda/categoria/:categorySlug
 * Obtiene productos de una categoría específica
 *
 * Ejemplo: GET /api/tienda/categoria/cursos
 */
router.get("/categoria/:categorySlug", async (req, res) => {
  try {
    const { categorySlug } = req.params;

    const products = await Product.getByCategory(categorySlug);

    res.json({
      success: true,
      data: products,
      count: products.length,
    });
  } catch (error) {
    console.error("Error obteniendo productos por categoría:", error);
    res.status(500).json({
      success: false,
      error: "Error al cargar los productos",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * GET /api/tienda/:productId
 * Obtiene un producto específico por su product_id
 *
 * Ejemplo: GET /api/tienda/curso-marketing-digital
 */
router.get("/:productId", async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.getByProductId(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Producto no encontrado",
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Error obteniendo producto:", error);
    res.status(500).json({
      success: false,
      error: "Error al cargar el producto",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * POST /api/tienda
 * Crea un nuevo producto
 *
 * Body:
 * {
 *   "product_id": "nuevo-curso",
 *   "name": "Nombre del Producto",
 *   "description": "Descripción completa",
 *   "price": 199.99,
 *   "discount_price": 149.99,
 *   "image_url": "/uploads/producto.jpg",
 *   "features": ["Característica 1", "Característica 2"],
 *   "includes": ["Incluye 1", "Incluye 2"],
 *   "category_id": "uuid-de-categoria",
 *   "is_featured": false,
 *   "display_order": 1
 * }
 */
router.post("/", authenticateToken, requireEditor, async (req, res) => {
  try {
    const {
      product_id,
      name,
      description,
      price,
      discount_price,
      price_currency,
      image_url,
      is_featured,
      features,
      includes,
      category_id,
      display_order,
      status,
    } = req.body;

    // Validar campos requeridos
    if (!product_id || !name || !description || !price) {
      return res.status(400).json({
        success: false,
        error: "product_id, name, description y price son requeridos",
      });
    }

    // Validar que product_id sea lowercase con guiones
    if (!/^[a-z0-9-]+$/.test(product_id)) {
      return res.status(400).json({
        success: false,
        error:
          "product_id debe ser lowercase y solo contener letras, números y guiones",
      });
    }

    // Validar precio
    if (isNaN(price) || price < 0) {
      return res.status(400).json({
        success: false,
        error: "price debe ser un número positivo",
      });
    }

    // Validar precio de descuento si existe
    if (
      discount_price !== undefined &&
      (isNaN(discount_price) || discount_price < 0)
    ) {
      return res.status(400).json({
        success: false,
        error: "discount_price debe ser un número positivo",
      });
    }

    const newProduct = await Product.create({
      product_id,
      name,
      description,
      price: parseFloat(price),
      discount_price: discount_price ? parseFloat(discount_price) : null,
      price_currency: price_currency || "USD",
      image_url,
      is_featured: is_featured || false,
      features: features || [],
      includes: includes || [],
      category_id,
      display_order: display_order || 0,
      status: status || "active",
    });

    res.status(201).json({
      success: true,
      message: "Producto creado exitosamente",
      data: newProduct,
    });
  } catch (error) {
    console.error("Error creando producto:", error);

    if (
      error.message.includes("duplicate") ||
      error.message.includes("already exists")
    ) {
      return res.status(409).json({
        success: false,
        error: "Ya existe un producto con ese product_id",
      });
    }

    res.status(500).json({
      success: false,
      error: "Error al crear el producto",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * PUT /api/tienda/:productId
 * Actualiza un producto existente
 */
router.put(
  "/:productId",
  authenticateToken,
  requireEditor,
  async (req, res) => {
    try {
      const { productId } = req.params;
      const updates = req.body;

      // Remover campos que no deben actualizarse
      delete updates.product_id;
      delete updates.id;
      delete updates.created_at;

      const productUpdated = await Product.update(productId, updates);

      res.json({
        success: true,
        message: "Producto actualizado exitosamente",
        data: productUpdated,
      });
    } catch (error) {
      console.error("Error actualizando producto:", error);

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
        error: "Error al actualizar el producto",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

/**
 * PATCH /api/tienda/:productId/status
 * Cambia el estado de un producto
 *
 * Body:
 * {
 *   "status": "inactive"
 * }
 */
router.patch(
  "/:productId/status",
  authenticateToken,
  requireEditor,
  async (req, res) => {
    try {
      const { productId } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          error: "El campo status es requerido",
        });
      }

      const productUpdated = await Product.changeStatus(productId, status);

      res.json({
        success: true,
        message: `Producto ${
          status === "active" ? "activado" : "desactivado"
        } exitosamente`,
        data: productUpdated,
      });
    } catch (error) {
      console.error("Error cambiando estado del producto:", error);

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
 * PATCH /api/tienda/:productId/featured
 * Marca/desmarca un producto como destacado
 *
 * Body:
 * {
 *   "featured": true
 * }
 */
router.patch(
  "/:productId/featured",
  authenticateToken,
  requireEditor,
  async (req, res) => {
    try {
      const { productId } = req.params;
      const { featured } = req.body;

      if (featured === undefined) {
        return res.status(400).json({
          success: false,
          error: "El campo featured es requerido",
        });
      }

      const productUpdated = await Product.setFeatured(productId, featured);

      res.json({
        success: true,
        message: `Producto ${
          featured ? "destacado" : "no destacado"
        } exitosamente`,
        data: productUpdated,
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
        error: "Error al actualizar el producto",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

/**
 * POST /api/tienda/reorder
 * Reordena los productos
 *
 * Body:
 * {
 *   "order": [
 *     { "product_id": "curso-marketing", "order": 1 },
 *     { "product_id": "template-instagram", "order": 2 }
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

    await Product.reorder(order);

    res.json({
      success: true,
      message: "Productos reordenados exitosamente",
    });
  } catch (error) {
    console.error("Error reordenando productos:", error);
    res.status(500).json({
      success: false,
      error: "Error al reordenar los productos",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * DELETE /api/tienda/:productId
 * Elimina un producto (soft delete - lo desactiva)
 */
router.delete(
  "/:productId",
  authenticateToken,
  requireEditor,
  async (req, res) => {
    try {
      const { productId } = req.params;

      await Product.delete(productId);

      res.json({
        success: true,
        message: "Producto eliminado exitosamente",
      });
    } catch (error) {
      console.error("Error eliminando producto:", error);

      if (error.message.includes("no encontrado")) {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        error: "Error al eliminar el producto",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

module.exports = router;
