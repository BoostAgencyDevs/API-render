/**
 * @fileoverview Middleware de autenticación para Boost Agency API
 *
 * ACTUALIZADO PARA POSTGRESQL
 *
 * Cambios principales:
 * - ❌ Eliminado: loadUsers() y saveUsers() con archivos JSON
 * - ✅ Nuevo: Usa el modelo User de PostgreSQL
 * - ✅ Nuevo: Validación de usuarios desde base de datos
 *
 * @author Boost Agency Development Team
 * @version 2.0.0
 */

const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Middleware de autenticación JWT
 * Verifica el token en el header Authorization
 *
 * CAMBIOS: Ahora verifica contra la base de datos en lugar de archivo JSON
 */
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Token de acceso requerido",
    });
  }

  try {
    // Verificar el token JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "boost-agency-secret-key"
    );

    // NUEVO: Verificar que el usuario aún existe y está activo en la BD
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(403).json({
        success: false,
        error: "Usuario no encontrado",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        error: "Usuario inactivo o suspendido",
      });
    }

    // Agregar información del usuario al request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
    };

    next();
  } catch (error) {
    console.error("Error en autenticación:", error);
    return res.status(403).json({
      success: false,
      error: "Token inválido o expirado",
    });
  }
};

/**
 * Middleware de verificación de roles
 * Verifica que el usuario tenga uno de los roles permitidos
 *
 * SIN CAMBIOS: Funciona igual, pero ahora req.user viene de PostgreSQL
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Usuario no autenticado",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: "Permisos insuficientes",
        required_roles: roles,
        user_role: req.user.role,
      });
    }
    next();
  };
};

/**
 * Middleware opcional de autenticación
 * No falla si no hay token, pero agrega user si existe
 *
 * CAMBIOS: Ahora también verifica contra base de datos
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "boost-agency-secret-key"
    );

    // NUEVO: Verificar contra base de datos
    const user = await User.findById(decoded.id);

    if (user && user.status === "active") {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
      };
    }
  } catch (error) {
    // Si hay error, simplemente continuar sin usuario
    console.log("Token inválido en optionalAuth, continuando sin usuario");
  }

  next();
};

/**
 * NUEVO: Middleware para verificar si el usuario es admin
 * Shorthand para requireRole(['admin'])
 */
const requireAdmin = requireRole(["admin"]);

/**
 * NUEVO: Middleware para verificar si el usuario es admin o editor
 * Shorthand para requireRole(['admin', 'editor'])
 */
const requireEditor = requireRole(["admin", "editor"]);

module.exports = {
  authenticateToken,
  requireRole,
  optionalAuth,
  requireAdmin,
  requireEditor,
};
