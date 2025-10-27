const bcrypt = require("bcryptjs");

const password = "Admin123!"; // La contraseña que quieres usar
const hash = bcrypt.hashSync(password, 10);

console.log("\n=== GENERADOR DE USUARIO ADMIN ===\n");
console.log("Contraseña:", password);
console.log("Hash:", hash);
console.log("\nCopia el siguiente SQL y ejecútalo en PostgreSQL:\n");

const sql = `
-- Primero elimina el admin actual si existe
DELETE FROM users WHERE email = 'admin@boostagency.com';

-- Crea el nuevo admin con hash correcto
INSERT INTO users (email, password_hash, full_name, role, status, phone)
VALUES (
  'admin@boostagency.com',
  '${hash}',
  'Administrador Boost Agency',
  'admin',
  'active',
  NULL
);

-- Verifica que se creó
SELECT id, email, full_name, role, status FROM users WHERE email = 'admin@boostagency.com';
`;

console.log(sql);
