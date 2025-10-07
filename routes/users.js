/**
 * @fileoverview Rutas de gestión de usuarios para Boost Agency API
 * 
 * Maneja CRUD de usuarios del sistema
 * 
 * @author Boost Agency Development Team
 * @version 1.0.0
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { loadUsers, saveUsers, authenticateToken, requireRole } = require('../middleware/auth');
const router = express.Router();

/**
 * GET /api/users
 * Obtiene todos los usuarios
 */
router.get('/', authenticateToken, requireRole(['admin']), (req, res) => {
  try {
    const users = loadUsers();
    // No devolver contraseñas
    const usersWithoutPasswords = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      lastname: user.lastname,
      username: user.username,
      role: user.role,
      active: user.active,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    }));

    res.json({
      success: true,
      data: usersWithoutPasswords
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({
      success: false,
      error: 'Error al cargar los usuarios'
    });
  }
});

/**
 * GET /api/users/:id
 * Obtiene un usuario específico por ID
 */
router.get('/:id', authenticateToken, requireRole(['admin']), (req, res) => {
  try {
    const { id } = req.params;
    const users = loadUsers();
    const user = users.find(u => u.id === id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // No devolver contraseña
    const { password, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({
      success: false,
      error: 'Error al cargar el usuario'
    });
  }
});

/**
 * POST /api/users
 * Crea un nuevo usuario
 */
router.post('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { email, password, name, lastname, username, role = 'editor' } = req.body;

    // Validar datos requeridos
    if (!email || !password || !name || !lastname || !username) {
      return res.status(400).json({
        success: false,
        error: 'Email, contraseña, nombre, apellido y nombre de usuario son requeridos'
      });
    }

    const users = loadUsers();
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'El email ya está registrado'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: uuidv4(),
      email,
      password: hashedPassword,
      name,
      lastname,
      username,
      role: ['admin', 'editor', 'viewer'].includes(role) ? role : 'editor',
      active: true,
      createdAt: new Date().toISOString(),
      lastLogin: null
    };

    users.push(newUser);
    saveUsers(users);

    // No devolver contraseña
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * PUT /api/users/:id
 * Actualiza un usuario existente
 */
router.put('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password, name, lastname, username, role, active } = req.body;

    const users = loadUsers();
    const userIndex = users.findIndex(u => u.id === id);

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Verificar que el email no esté en uso por otro usuario
    if (email && email !== users[userIndex].email) {
      const existingUser = users.find(u => u.email === email && u.id !== id);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'El email ya está en uso por otro usuario'
        });
      }
    }

    // Actualizar usuario
    if (email) users[userIndex].email = email;
    if (name) users[userIndex].name = name;
    if (lastname) users[userIndex].lastname = lastname;
    if (username) users[userIndex].username = username;
    if (role && ['admin', 'editor', 'viewer'].includes(role)) {
      users[userIndex].role = role;
    }
    if (active !== undefined) users[userIndex].active = active;

    // Actualizar contraseña si se proporciona
    if (password) {
      users[userIndex].password = await bcrypt.hash(password, 10);
    }

    saveUsers(users);

    // No devolver contraseña
    const { password: _, ...userWithoutPassword } = users[userIndex];

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * DELETE /api/users/:id
 * Elimina un usuario
 */
router.delete('/:id', authenticateToken, requireRole(['admin']), (req, res) => {
  try {
    const { id } = req.params;
    const users = loadUsers();
    const userIndex = users.findIndex(u => u.id === id);

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // No permitir eliminar el último admin
    const adminUsers = users.filter(u => u.role === 'admin' && u.active);
    if (users[userIndex].role === 'admin' && adminUsers.length === 1) {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar el último usuario administrador'
      });
    }

    const userEliminado = users.splice(userIndex, 1)[0];
    saveUsers(users);

    // No devolver contraseña
    const { password, ...userWithoutPassword } = userEliminado;

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente',
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * PATCH /api/users/:id/status
 * Cambia el estado activo/inactivo de un usuario
 */
router.patch('/:id/status', authenticateToken, requireRole(['admin']), (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;

    if (typeof active !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'El campo active debe ser true o false'
      });
    }

    const users = loadUsers();
    const userIndex = users.findIndex(u => u.id === id);

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // No permitir desactivar el último admin
    if (!active && users[userIndex].role === 'admin') {
      const adminUsers = users.filter(u => u.role === 'admin' && u.active);
      if (adminUsers.length === 1) {
        return res.status(400).json({
          success: false,
          error: 'No se puede desactivar el último usuario administrador'
        });
      }
    }

    users[userIndex].active = active;
    saveUsers(users);

    // No devolver contraseña
    const { password, ...userWithoutPassword } = users[userIndex];

    res.json({
      success: true,
      message: `Usuario ${active ? 'activado' : 'desactivado'} exitosamente`,
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * POST /api/users/:id/reset-password
 * Resetea la contraseña de un usuario
 */
router.post('/:id/reset-password', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'La nueva contraseña debe tener al menos 6 caracteres'
      });
    }

    const users = loadUsers();
    const userIndex = users.findIndex(u => u.id === id);

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    users[userIndex].password = await bcrypt.hash(newPassword, 10);
    saveUsers(users);

    res.json({
      success: true,
      message: 'Contraseña restablecida exitosamente'
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;
