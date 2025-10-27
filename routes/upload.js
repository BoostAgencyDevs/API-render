/**
 * @fileoverview Rutas de gestión de archivos para Boost Agency API
 *
 * ✅ MIGRADO A POSTGRESQL
 *
 * CAMBIOS PRINCIPALES:
 * - ❌ Eliminado: loadFiles() y saveFiles() con archivos JSON
 * - ❌ Eliminado: database/files.json
 * - ✅ Nuevo: Usa la tabla 'images' de PostgreSQL
 * - ✅ Nuevo: Extrae dimensiones de imágenes con sharp (opcional)
 * - ✅ Nuevo: Mejor organización de archivos por carpetas
 *
 * Maneja upload, listado y eliminación de archivos
 *
 * @author Boost Agency Development Team
 * @version 2.0.0
 */

const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const {
  authenticateToken,
  requireRole,
  requireEditor,
  requireAdmin,
} = require("../middleware/auth");
const { query } = require("../config/database");
const router = express.Router();

// Configuración de multer para upload de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Organizar archivos por tipo en subcarpetas
    const fileType = getFileCategory(file.mimetype);
    const uploadDir = path.join(__dirname, "../uploads/", fileType);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Nombre único: timestamp-random-nombre-original
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const baseName = path
      .basename(file.originalname, ext)
      .replace(/[^a-z0-9]/gi, "-")
      .toLowerCase();
    cb(null, `${uniqueSuffix}-${baseName}${ext}`);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB límite
  },
  fileFilter: (req, file, cb) => {
    // Tipos de archivo permitidos
    const allowedTypes =
      /jpeg|jpg|png|gif|webp|svg|pdf|doc|docx|mp3|mp4|webm|wav/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(
        new Error(
          "Tipo de archivo no permitido. Permitidos: imágenes, documentos, audio, video"
        )
      );
    }
  },
});

/**
 * Helper: Determina la categoría del archivo según su MIME type
 */
function getFileCategory(mimetype) {
  if (mimetype.startsWith("image/")) return "imagenes";
  if (mimetype.startsWith("audio/")) return "audio";
  if (mimetype.startsWith("video/")) return "video";
  if (mimetype.includes("pdf") || mimetype.includes("document"))
    return "documentos";
  return "otros";
}

/**
 * Helper: Obtiene dimensiones de imagen (requiere sharp - opcional)
 * Si no tienes sharp instalado, esta función retorna null
 */
async function getImageDimensions(filePath) {
  try {
    // Intenta usar sharp si está instalado
    const sharp = require("sharp");
    const metadata = await sharp(filePath).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
    };
  } catch (error) {
    // Si sharp no está instalado o hay error, retorna null
    return { width: null, height: null };
  }
}

/**
 * POST /api/upload
 * Sube un archivo al servidor y lo registra en PostgreSQL
 *
 * CAMBIOS:
 * - ANTES: Guardaba en files.json
 * - AHORA: INSERT en tabla images de PostgreSQL
 */
router.post(
  "/",
  authenticateToken,
  requireEditor,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No se subió ningún archivo",
        });
      }

      const { alt_text, caption, folder } = req.body;
      const fileType = getFileCategory(req.file.mimetype);
      const relativePath = `/uploads/${fileType}/${req.file.filename}`;

      // Obtener dimensiones si es imagen
      let dimensions = { width: null, height: null };
      if (fileType === "imagenes") {
        dimensions = await getImageDimensions(req.file.path);
      }

      // Insertar en PostgreSQL
      const sql = `
      INSERT INTO images (
        filename, original_filename, file_path, file_url,
        mime_type, file_size, width, height,
        alt_text, caption, folder, uploaded_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

      const result = await query(sql, [
        req.file.filename,
        req.file.originalname,
        req.file.path,
        relativePath,
        req.file.mimetype,
        req.file.size,
        dimensions.width,
        dimensions.height,
        alt_text || null,
        caption || null,
        folder || fileType,
        req.user.id,
      ]);

      res.json({
        success: true,
        message: "Archivo subido exitosamente",
        data: result.rows[0],
      });
    } catch (error) {
      console.error("Error uploading file:", error);

      // Si hay error, eliminar el archivo físico
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        success: false,
        error: "Error al subir el archivo",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

/**
 * POST /api/upload/multiple
 * Sube múltiples archivos a la vez
 *
 * NUEVO ENDPOINT: No existía en la versión JSON
 */
router.post(
  "/multiple",
  authenticateToken,
  requireEditor,
  upload.array("files", 10),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: "No se subieron archivos",
        });
      }

      const uploadedFiles = [];
      const { folder } = req.body;

      // Procesar cada archivo
      for (const file of req.files) {
        const fileType = getFileCategory(file.mimetype);
        const relativePath = `/uploads/${fileType}/${file.filename}`;

        let dimensions = { width: null, height: null };
        if (fileType === "imagenes") {
          dimensions = await getImageDimensions(file.path);
        }

        const sql = `
        INSERT INTO images (
          filename, original_filename, file_path, file_url,
          mime_type, file_size, width, height, folder, uploaded_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

        const result = await query(sql, [
          file.filename,
          file.originalname,
          file.path,
          relativePath,
          file.mimetype,
          file.size,
          dimensions.width,
          dimensions.height,
          folder || fileType,
          req.user.id,
        ]);

        uploadedFiles.push(result.rows[0]);
      }

      res.json({
        success: true,
        message: `${uploadedFiles.length} archivos subidos exitosamente`,
        data: uploadedFiles,
      });
    } catch (error) {
      console.error("Error uploading multiple files:", error);

      // Limpiar archivos si hay error
      if (req.files) {
        req.files.forEach((file) => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }

      res.status(500).json({
        success: false,
        error: "Error al subir los archivos",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

/**
 * GET /api/upload/list
 * Lista todos los archivos subidos con filtros y paginación
 *
 * CAMBIOS:
 * - ANTES: Leía files.json y filtraba en JavaScript
 * - AHORA: SELECT con filtros en PostgreSQL (mucho más rápido)
 */
router.get("/list", authenticateToken, requireEditor, async (req, res) => {
  try {
    const {
      categoria,
      folder,
      search,
      page = 1,
      limit = 20,
      sortBy = "created_at",
      sortOrder = "DESC",
    } = req.query;

    let sql = `
      SELECT 
        i.*,
        u.full_name as uploaded_by_name
      FROM images i
      LEFT JOIN users u ON i.uploaded_by = u.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    // Filtrar por categoría (tipo de archivo)
    if (categoria) {
      sql += ` AND i.folder = $${paramIndex}`;
      params.push(categoria);
      paramIndex++;
    }

    // Filtrar por carpeta específica
    if (folder) {
      sql += ` AND i.folder = $${paramIndex}`;
      params.push(folder);
      paramIndex++;
    }

    // Búsqueda por nombre de archivo
    if (search) {
      sql += ` AND (i.filename ILIKE $${paramIndex} OR i.original_filename ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Ordenamiento
    const validSortFields = [
      "created_at",
      "file_size",
      "filename",
      "mime_type",
    ];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "created_at";
    const sortDirection = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

    sql += ` ORDER BY i.${sortField} ${sortDirection}`;

    // Paginación
    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, (page - 1) * limit);

    const result = await query(sql, params);

    // Contar total
    let countSql = `SELECT COUNT(*) FROM images WHERE 1=1`;
    const countParams = [];
    let countIndex = 1;

    if (categoria) {
      countSql += ` AND folder = $${countIndex}`;
      countParams.push(categoria);
      countIndex++;
    }

    if (folder) {
      countSql += ` AND folder = $${countIndex}`;
      countParams.push(folder);
      countIndex++;
    }

    if (search) {
      countSql += ` AND (filename ILIKE $${countIndex} OR original_filename ILIKE $${countIndex})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await query(countSql, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error listing files:", error);
    res.status(500).json({
      success: false,
      error: "Error al listar los archivos",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * GET /api/upload/:id
 * Obtiene información de un archivo específico por UUID
 *
 * CAMBIOS:
 * - ANTES: Buscaba por filename en array JSON
 * - AHORA: SELECT por UUID en PostgreSQL
 */
router.get("/:id", authenticateToken, requireEditor, async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `
      SELECT 
        i.*,
        u.full_name as uploaded_by_name,
        u.email as uploaded_by_email
      FROM images i
      LEFT JOIN users u ON i.uploaded_by = u.id
      WHERE i.id = $1
    `;

    const result = await query(sql, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Archivo no encontrado",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error getting file info:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener información del archivo",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * PUT /api/upload/:id
 * Actualiza metadatos de un archivo (alt_text, caption)
 *
 * NUEVO ENDPOINT: No existía en la versión JSON
 */
router.put("/:id", authenticateToken, requireEditor, async (req, res) => {
  try {
    const { id } = req.params;
    const { alt_text, caption, folder } = req.body;

    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    if (alt_text !== undefined) {
      updateFields.push(`alt_text = $${paramIndex}`);
      values.push(alt_text);
      paramIndex++;
    }

    if (caption !== undefined) {
      updateFields.push(`caption = $${paramIndex}`);
      values.push(caption);
      paramIndex++;
    }

    if (folder !== undefined) {
      updateFields.push(`folder = $${paramIndex}`);
      values.push(folder);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No hay campos para actualizar",
      });
    }

    values.push(id);

    const sql = `
      UPDATE images
      SET ${updateFields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await query(sql, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Archivo no encontrado",
      });
    }

    res.json({
      success: true,
      message: "Archivo actualizado exitosamente",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating file:", error);
    res.status(500).json({
      success: false,
      error: "Error al actualizar el archivo",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * DELETE /api/upload/:id
 * Elimina un archivo (físico y registro en BD)
 *
 * CAMBIOS:
 * - ANTES: Eliminaba de files.json por filename
 * - AHORA: DELETE en PostgreSQL por UUID
 */
router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener información del archivo antes de eliminarlo
    const selectSql = `SELECT * FROM images WHERE id = $1`;
    const selectResult = await query(selectSql, [id]);

    if (selectResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Archivo no encontrado",
      });
    }

    const file = selectResult.rows[0];

    // Eliminar archivo físico
    if (fs.existsSync(file.file_path)) {
      fs.unlinkSync(file.file_path);
    }

    // Eliminar de la base de datos
    const deleteSql = `DELETE FROM images WHERE id = $1 RETURNING *`;
    const deleteResult = await query(deleteSql, [id]);

    res.json({
      success: true,
      message: "Archivo eliminado exitosamente",
      data: deleteResult.rows[0],
    });
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({
      success: false,
      error: "Error al eliminar el archivo",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * GET /api/upload/stats
 * Obtiene estadísticas de archivos
 *
 * CAMBIOS:
 * - ANTES: Iteraba array JSON en JavaScript
 * - AHORA: PostgreSQL hace los cálculos con COUNT, SUM, GROUP BY
 */
router.get("/stats", authenticateToken, requireEditor, async (req, res) => {
  try {
    // Estadísticas generales
    const generalSql = `
      SELECT 
        COUNT(*) as total,
        SUM(file_size) as total_size,
        AVG(file_size) as avg_size,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as recientes
      FROM images
    `;
    const generalResult = await query(generalSql);

    // Estadísticas por tipo/folder
    const byFolderSql = `
      SELECT 
        folder,
        COUNT(*) as cantidad,
        SUM(file_size) as size
      FROM images
      GROUP BY folder
      ORDER BY cantidad DESC
    `;
    const byFolderResult = await query(byFolderSql);

    // Estadísticas por extensión
    const byExtSql = `
      SELECT 
        SUBSTRING(filename FROM '\\.([^.]+)$') as extension,
        COUNT(*) as cantidad
      FROM images
      GROUP BY extension
      ORDER BY cantidad DESC
      LIMIT 10
    `;
    const byExtResult = await query(byExtSql);

    res.json({
      success: true,
      data: {
        total: parseInt(generalResult.rows[0].total),
        totalSize: parseInt(generalResult.rows[0].total_size) || 0,
        avgSize: Math.round(parseFloat(generalResult.rows[0].avg_size)) || 0,
        recientes: parseInt(generalResult.rows[0].recientes),
        porFolder: byFolderResult.rows.reduce((acc, row) => {
          acc[row.folder] = parseInt(row.cantidad);
          return acc;
        }, {}),
        porExtension: byExtResult.rows.reduce((acc, row) => {
          acc[row.extension] = parseInt(row.cantidad);
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    console.error("Error getting file stats:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener estadísticas de archivos",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;
