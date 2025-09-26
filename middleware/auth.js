/**
 * @fileoverview Middleware de autenticación para Boost Agency API
 * 
 * Maneja la autenticación JWT y verificación de roles
 * 
 * @author Boost Agency Development Team
 * @version 1.0.0
 */

const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Cargar usuarios desde archivo JSON
const loadUsers = () => {
  try {
    const usersPath = path.join(__dirname, '../database/users.json');
    if (fs.existsSync(usersPath)) {
      return JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    }
    return [];
  } catch (error) {
    console.error('Error loading users:', error);
    return [];
  }
};

// Guardar usuarios en archivo JSON
const saveUsers = (users) => {
  try {
    const usersPath = path.join(__dirname, '../database/users.json');
    const usersDir = path.dirname(usersPath);
    
    if (!fs.existsSync(usersDir)) {
      fs.mkdirSync(usersDir, { recursive: true });
    }
    
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error saving users:', error);
  }
};

/**
 * Middleware de autenticación JWT
 * Verifica el token en el header Authorization
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false,
      error: 'Token de acceso requerido' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'boost-agency-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false,
        error: 'Token inválido o expirado' 
      });
    }
    req.user = user;
    next();
  });
};

/**
 * Middleware de verificación de roles
 * Verifica que el usuario tenga uno de los roles permitidos
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        error: 'Usuario no autenticado' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        error: 'Permisos insuficientes' 
      });
    }
    next();
  };
};

/**
 * Middleware opcional de autenticación
 * No falla si no hay token, pero agrega user si existe
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET || 'boost-agency-secret-key', (err, user) => {
    if (!err) {
      req.user = user;
    }
    next();
  });
};

module.exports = {
  authenticateToken,
  requireRole,
  optionalAuth,
  loadUsers,
  saveUsers
};
