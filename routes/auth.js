/**
 * @fileoverview Rutas de autenticación para Boost Agency API
 *
 * 🆕 ARCHIVO NUEVO - No existía en la versión JSON
 *
 * Maneja:
 * - Login (generación de JWT)
 * - Registro de usuarios
 * - Verificación de token
 * - Cambio de contraseña
 * - Reset de contraseña
 *
 * @author Boost Agency Development Team
 * @version 2.0.0
 */

const express = require("express");
const jwt = require("jsonwebtoken");
const { authenticateToken } = require("../middleware/auth");
const User = require("../models/User");
const router = express.Router();

// Configuración JWT
const JWT_SECRET = process.env.JWT_SECRET || "boost-agency-secret-key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

/**
 * POST /api/auth/login
 * Inicia sesión y devuelve un token JWT
 *
 * Body:
 * {
 *   "email": "admin@boostagency.com",
 *   "password": "Admin123!"
 * }
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar campos requeridos
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email y contraseña son requeridos",
      });
    }

    // Buscar usuario con contraseña incluida
    const user = await User.findByEmail(email, true);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Credenciales inválidas",
      });
    }

    // Verificar que el usuario esté activo
    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        error: "Usuario inactivo o suspendido",
      });
    }

    // Verificar contraseña
    const isPasswordValid = await User.verifyPassword(
      password,
      user.password_hash
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: "Credenciales inválidas",
      });
    }

    // Actualizar último login
    await User.updateLastLogin(user.id);

    // Generar token JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Devolver token y datos del usuario (sin password_hash)
    res.json({
      success: true,
      message: "Login exitoso",
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          avatar_url: user.avatar_url,
        },
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({
      success: false,
      error: "Error en el proceso de autenticación",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * POST /api/auth/register
 * Registra un nuevo usuario (solo admins pueden crear usuarios)
 *
 * Body:
 * {
 *   "email": "nuevo@boostagency.com",
 *   "password": "Password123!",
 *   "full_name": "Nombre Completo",
 *   "role": "user",
 *   "phone": "+1234567890"
 * }
 */
router.post("/register", authenticateToken, async (req, res) => {
  try {
    // Solo admins pueden crear usuarios
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Solo administradores pueden crear usuarios",
      });
    }

    const { email, password, full_name, role, phone } = req.body;

    // Validar campos requeridos
    if (!email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        error: "Email, contraseña y nombre completo son requeridos",
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "Formato de email inválido",
      });
    }

    // Validar contraseña (mínimo 8 caracteres, una mayúscula, un número)
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: "La contraseña debe tener al menos 8 caracteres",
      });
    }

    // Verificar si el email ya existe
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "El email ya está registrado",
      });
    }

    // Crear usuario
    const newUser = await User.create({
      email,
      password,
      full_name,
      role: role || "user",
      phone,
    });

    res.status(201).json({
      success: true,
      message: "Usuario creado exitosamente",
      data: newUser,
    });
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({
      success: false,
      error: "Error al crear el usuario",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * GET /api/auth/me
 * Obtiene información del usuario autenticado
 * Útil para verificar si el token sigue válido
 */
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Usuario no encontrado",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error obteniendo usuario:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener información del usuario",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * PUT /api/auth/change-password
 * Cambia la contraseña del usuario autenticado
 *
 * Body:
 * {
 *   "current_password": "Password123!",
 *   "new_password": "NewPassword456!"
 * }
 */
router.put("/change-password", authenticateToken, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    // Validar campos requeridos
    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        error: "Contraseña actual y nueva contraseña son requeridas",
      });
    }

    // Validar nueva contraseña
    if (new_password.length < 8) {
      return res.status(400).json({
        success: false,
        error: "La nueva contraseña debe tener al menos 8 caracteres",
      });
    }

    // Obtener usuario con contraseña
    const user = await User.findByEmail(req.user.email, true);

    // Verificar contraseña actual
    const isPasswordValid = await User.verifyPassword(
      current_password,
      user.password_hash
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: "Contraseña actual incorrecta",
      });
    }

    // Cambiar contraseña
    await User.changePassword(req.user.id, new_password);

    res.json({
      success: true,
      message: "Contraseña actualizada exitosamente",
    });
  } catch (error) {
    console.error("Error cambiando contraseña:", error);
    res.status(500).json({
      success: false,
      error: "Error al cambiar la contraseña",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * POST /api/auth/reset-password/:userId
 * Resetea la contraseña de un usuario (solo admins)
 *
 * Body:
 * {
 *   "new_password": "TempPassword123!"
 * }
 */
router.post("/reset-password/:userId", authenticateToken, async (req, res) => {
  try {
    // Solo admins pueden resetear contraseñas
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Solo administradores pueden resetear contraseñas",
      });
    }

    const { userId } = req.params;
    const { new_password } = req.body;

    if (!new_password) {
      return res.status(400).json({
        success: false,
        error: "Nueva contraseña es requerida",
      });
    }

    if (new_password.length < 8) {
      return res.status(400).json({
        success: false,
        error: "La contraseña debe tener al menos 8 caracteres",
      });
    }

    // Verificar que el usuario existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Usuario no encontrado",
      });
    }

    // Cambiar contraseña
    await User.changePassword(userId, new_password);

    res.json({
      success: true,
      message: "Contraseña reseteada exitosamente",
    });
  } catch (error) {
    console.error("Error reseteando contraseña:", error);
    res.status(500).json({
      success: false,
      error: "Error al resetear la contraseña",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * POST /api/auth/refresh
 * Renueva el token JWT (útil antes de que expire)
 */
router.post("/refresh", authenticateToken, async (req, res) => {
  try {
    // Verificar que el usuario siga activo
    const user = await User.findById(req.user.id);

    if (!user || user.status !== "active") {
      return res.status(403).json({
        success: false,
        error: "Usuario no válido para renovar token",
      });
    }

    // Generar nuevo token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: "Token renovado exitosamente",
      data: {
        token,
      },
    });
  } catch (error) {
    console.error("Error renovando token:", error);
    res.status(500).json({
      success: false,
      error: "Error al renovar el token",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * POST /api/auth/logout
 * Cierra sesión (del lado del cliente debe eliminar el token)
 * Esta ruta existe principalmente para logging/auditoría
 */
router.post("/logout", authenticateToken, async (req, res) => {
  try {
    // Aquí podrías agregar lógica para invalidar tokens
    // o registrar el logout en una tabla de auditoría

    res.json({
      success: true,
      message: "Sesión cerrada exitosamente",
    });
  } catch (error) {
    console.error("Error en logout:", error);
    res.status(500).json({
      success: false,
      error: "Error al cerrar sesión",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;
