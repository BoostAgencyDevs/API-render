/**
 * @fileoverview Rutas de gestión de tienda para Boost Agency API
 * 
 * Maneja CRUD de productos y categorías de la tienda
 * 
 * @author Boost Agency Development Team
 * @version 1.0.0
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken, requireRole } = require('../middleware/auth');
const router = express.Router();

// Cargar tienda desde archivo JSON
const loadTienda = () => {
  try {
    const tiendaPath = path.join(__dirname, '../content/tienda.json');
    return JSON.parse(fs.readFileSync(tiendaPath, 'utf8'));
  } catch (error) {
    console.error('Error loading tienda:', error);
    return { categorias: [], productos: [], beneficios_compra: [], metodos_pago: [] };
  }
};

// Guardar tienda en archivo JSON
const saveTienda = (tienda) => {
  try {
    const tiendaPath = path.join(__dirname, '../content/tienda.json');
    fs.writeFileSync(tiendaPath, JSON.stringify(tienda, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving tienda:', error);
    return false;
  }
};

// ==================== PRODUCTOS ====================

/**
 * GET /api/tienda/productos
 * Obtiene todos los productos
 */
router.get('/productos', (req, res) => {
  try {
    const { categoria, destacado, page = 1, limit = 20 } = req.query;
    const data = loadTienda();
    let productos = data.productos || [];

    // Aplicar filtros
    if (categoria) {
      productos = productos.filter(p => p.categoria === categoria);
    }
    
    if (destacado !== undefined) {
      productos = productos.filter(p => p.destacado === (destacado === 'true'));
    }

    // Paginación
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedProductos = productos.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedProductos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: productos.length,
        pages: Math.ceil(productos.length / limit)
      }
    });
  } catch (error) {
    console.error('Error getting productos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al cargar los productos'
    });
  }
});

/**
 * GET /api/tienda/productos/:id
 * Obtiene un producto específico por ID
 */
router.get('/productos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const data = loadTienda();
    const producto = data.productos.find(p => p.id === id);

    if (!producto) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      data: producto
    });
  } catch (error) {
    console.error('Error getting producto:', error);
    res.status(500).json({
      success: false,
      error: 'Error al cargar el producto'
    });
  }
});

/**
 * POST /api/tienda/productos
 * Crea un nuevo producto
 */
router.post('/productos', authenticateToken, requireRole(['admin', 'editor']), (req, res) => {
  try {
    const { 
      categoria, 
      nombre, 
      descripcion, 
      precio, 
      precio_descuento, 
      imagen, 
      destacado, 
      caracteristicas, 
      incluye 
    } = req.body;

    // Validar datos requeridos
    if (!categoria || !nombre || !precio) {
      return res.status(400).json({
        success: false,
        error: 'Categoría, nombre y precio son requeridos'
      });
    }

    const data = loadTienda();
    const nuevoProducto = {
      id: uuidv4(),
      categoria,
      nombre,
      descripcion: descripcion || '',
      precio: parseFloat(precio),
      precio_descuento: precio_descuento ? parseFloat(precio_descuento) : null,
      imagen: imagen || '/uploads/producto-default.jpg',
      destacado: destacado || false,
      caracteristicas: caracteristicas || [],
      incluye: incluye || []
    };

    data.productos.push(nuevoProducto);

    if (saveTienda(data)) {
      res.status(201).json({
        success: true,
        message: 'Producto creado exitosamente',
        data: nuevoProducto
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error al guardar el producto'
      });
    }
  } catch (error) {
    console.error('Error creating producto:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * PUT /api/tienda/productos/:id
 * Actualiza un producto existente
 */
router.put('/productos/:id', authenticateToken, requireRole(['admin', 'editor']), (req, res) => {
  try {
    const { id } = req.params;
    const { 
      categoria, 
      nombre, 
      descripcion, 
      precio, 
      precio_descuento, 
      imagen, 
      destacado, 
      caracteristicas, 
      incluye 
    } = req.body;

    const data = loadTienda();
    const productoIndex = data.productos.findIndex(p => p.id === id);

    if (productoIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }

    // Actualizar producto
    data.productos[productoIndex] = {
      ...data.productos[productoIndex],
      categoria: categoria || data.productos[productoIndex].categoria,
      nombre: nombre || data.productos[productoIndex].nombre,
      descripcion: descripcion || data.productos[productoIndex].descripcion,
      precio: precio ? parseFloat(precio) : data.productos[productoIndex].precio,
      precio_descuento: precio_descuento ? parseFloat(precio_descuento) : data.productos[productoIndex].precio_descuento,
      imagen: imagen || data.productos[productoIndex].imagen,
      destacado: destacado !== undefined ? destacado : data.productos[productoIndex].destacado,
      caracteristicas: caracteristicas || data.productos[productoIndex].caracteristicas,
      incluye: incluye || data.productos[productoIndex].incluye
    };

    if (saveTienda(data)) {
      res.json({
        success: true,
        message: 'Producto actualizado exitosamente',
        data: data.productos[productoIndex]
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error al guardar el producto'
      });
    }
  } catch (error) {
    console.error('Error updating producto:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * DELETE /api/tienda/productos/:id
 * Elimina un producto
 */
router.delete('/productos/:id', authenticateToken, requireRole(['admin']), (req, res) => {
  try {
    const { id } = req.params;

    const data = loadTienda();
    const productoIndex = data.productos.findIndex(p => p.id === id);

    if (productoIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }

    const productoEliminado = data.productos.splice(productoIndex, 1)[0];

    if (saveTienda(data)) {
      res.json({
        success: true,
        message: 'Producto eliminado exitosamente',
        data: productoEliminado
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error al guardar los cambios'
      });
    }
  } catch (error) {
    console.error('Error deleting producto:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// ==================== CATEGORÍAS ====================

/**
 * GET /api/tienda/categorias
 * Obtiene todas las categorías
 */
router.get('/categorias', (req, res) => {
  try {
    const data = loadTienda();
    res.json({
      success: true,
      data: data.categorias || []
    });
  } catch (error) {
    console.error('Error getting categorias:', error);
    res.status(500).json({
      success: false,
      error: 'Error al cargar las categorías'
    });
  }
});

/**
 * GET /api/tienda/categorias/:id
 * Obtiene una categoría específica por ID
 */
router.get('/categorias/:id', (req, res) => {
  try {
    const { id } = req.params;
    const data = loadTienda();
    const categoria = data.categorias.find(c => c.id === id);

    if (!categoria) {
      return res.status(404).json({
        success: false,
        error: 'Categoría no encontrada'
      });
    }

    res.json({
      success: true,
      data: categoria
    });
  } catch (error) {
    console.error('Error getting categoria:', error);
    res.status(500).json({
      success: false,
      error: 'Error al cargar la categoría'
    });
  }
});

/**
 * POST /api/tienda/categorias
 * Crea una nueva categoría
 */
router.post('/categorias', authenticateToken, requireRole(['admin', 'editor']), (req, res) => {
  try {
    const { nombre, descripcion } = req.body;

    // Validar datos requeridos
    if (!nombre) {
      return res.status(400).json({
        success: false,
        error: 'Nombre es requerido'
      });
    }

    const data = loadTienda();
    const nuevaCategoria = {
      id: uuidv4(),
      nombre,
      descripcion: descripcion || ''
    };

    data.categorias.push(nuevaCategoria);

    if (saveTienda(data)) {
      res.status(201).json({
        success: true,
        message: 'Categoría creada exitosamente',
        data: nuevaCategoria
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error al guardar la categoría'
      });
    }
  } catch (error) {
    console.error('Error creating categoria:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * PUT /api/tienda/categorias/:id
 * Actualiza una categoría existente
 */
router.put('/categorias/:id', authenticateToken, requireRole(['admin', 'editor']), (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;

    const data = loadTienda();
    const categoriaIndex = data.categorias.findIndex(c => c.id === id);

    if (categoriaIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Categoría no encontrada'
      });
    }

    // Actualizar categoría
    data.categorias[categoriaIndex] = {
      ...data.categorias[categoriaIndex],
      nombre: nombre || data.categorias[categoriaIndex].nombre,
      descripcion: descripcion || data.categorias[categoriaIndex].descripcion
    };

    if (saveTienda(data)) {
      res.json({
        success: true,
        message: 'Categoría actualizada exitosamente',
        data: data.categorias[categoriaIndex]
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error al guardar la categoría'
      });
    }
  } catch (error) {
    console.error('Error updating categoria:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * DELETE /api/tienda/categorias/:id
 * Elimina una categoría
 */
router.delete('/categorias/:id', authenticateToken, requireRole(['admin']), (req, res) => {
  try {
    const { id } = req.params;

    const data = loadTienda();
    const categoriaIndex = data.categorias.findIndex(c => c.id === id);

    if (categoriaIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Categoría no encontrada'
      });
    }

    // Verificar que no haya productos usando esta categoría
    const productosEnCategoria = data.productos.filter(p => p.categoria === id);
    if (productosEnCategoria.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar la categoría porque tiene productos asociados'
      });
    }

    const categoriaEliminada = data.categorias.splice(categoriaIndex, 1)[0];

    if (saveTienda(data)) {
      res.json({
        success: true,
        message: 'Categoría eliminada exitosamente',
        data: categoriaEliminada
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error al guardar los cambios'
      });
    }
  } catch (error) {
    console.error('Error deleting categoria:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;
