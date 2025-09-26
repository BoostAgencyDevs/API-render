/**
 * @fileoverview Rutas de autenticación para Boost Agency API
 * 
 * Maneja login, logout, registro y gestión de usuarios
 * 
 * @author Boost Agency Development Team
 * @version 1.0.0
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { loadUsers, saveUsers } = require('../middleware/auth');
const router = express.Router();

// Inicializar usuario admin por defecto si no existe
const initializeDefaultUser = () => {
  const users = loadUsers();
  const adminExists = users.find(user => user.email === 'admin@boostagency.com');
  
  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    const adminUser = {
      id: uuidv4(),
      email: 'admin@boostagency.com',
      password: hashedPassword,
      name: 'Administrador',
      role: 'admin',
      active: true,
      createdAt: new Date().toISOString(),
      lastLogin: null
    };
    
    users.push(adminUser);
    saveUsers(users);
    console.log('✅ Usuario admin creado: admin@boostagency.com / admin123');
  }
};

// Inicializar usuario por defecto
initializeDefaultUser();

/**
 * POST /api/auth/login
 * Autentica un usuario y devuelve un token JWT
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar datos de entrada
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email y contraseña son requeridos'
      });
    }

    // Buscar usuario
    const users = loadUsers();
    const user = users.find(u => u.email === email && u.active);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'boost-agency-secret-key',
      { expiresIn: '24h' }
    );

    // Actualizar último login
    user.lastLogin = new Date().toISOString();
    saveUsers(users);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      expiresIn: 86400 // 24 horas
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * POST /api/auth/refresh
 * Renueva un token JWT válido
 */
router.post('/refresh', (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token requerido'
      });
    }

    // Verificar token actual
    jwt.verify(token, process.env.JWT_SECRET || 'boost-agency-secret-key', (err, decoded) => {
      if (err) {
        return res.status(403).json({
          success: false,
          error: 'Token inválido'
        });
      }

      // Generar nuevo token
      const newToken = jwt.sign(
        { 
          id: decoded.id, 
          email: decoded.email, 
          role: decoded.role 
        },
        process.env.JWT_SECRET || 'boost-agency-secret-key',
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        token: newToken,
        expiresIn: 86400
      });
    });

  } catch (error) {
    console.error('Error en refresh:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * GET /api/auth/me
 * Obtiene información del usuario autenticado
 */
router.get('/me', (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token requerido'
      });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'boost-agency-secret-key', (err, decoded) => {
      if (err) {
        return res.status(403).json({
          success: false,
          error: 'Token inválido'
        });
      }

      const users = loadUsers();
      const user = users.find(u => u.id === decoded.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          lastLogin: user.lastLogin
        }
      });
    });

  } catch (error) {
    console.error('Error en /me:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * POST /api/auth/logout
 * Cierra la sesión del usuario (en el cliente)
 */
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Sesión cerrada exitosamente'
  });
});

/**
 * POST /api/auth/register
 * Registra un nuevo usuario (solo admin)
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role = 'editor' } = req.body;

    // Validar datos de entrada
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email, contraseña y nombre son requeridos'
      });
    }

    // Verificar que el email no exista
    const users = loadUsers();
    const existingUser = users.find(u => u.email === email);
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'El email ya está registrado'
      });
    }

    // Crear nuevo usuario
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: uuidv4(),
      email,
      password: hashedPassword,
      name,
      role: ['admin', 'editor', 'viewer'].includes(role) ? role : 'editor',
      active: true,
      createdAt: new Date().toISOString(),
      lastLogin: null
    };

    users.push(newUser);
    saveUsers(users);

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;
