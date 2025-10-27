const path = require("path");

// Cargar dotenv con path absoluto
require("dotenv").config({
  path: path.join(__dirname, ".env"),
  debug: true, // Esto mostrará logs de lo que está cargando
});

const { Pool } = require("pg");

console.log("🔍 Probando conexión a PostgreSQL...\n");
console.log("Configuración:");
console.log("- Host:", process.env.DB_HOST);
console.log("- Port:", process.env.DB_PORT);
console.log("- Database:", process.env.DB_NAME);
console.log("- User:", process.env.DB_USER);
console.log(
  "- Password:",
  process.env.DB_PASSWORD ? "Configurada ✓" : "NO CONFIGURADA ✗"
);
console.log("");

const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "boostagency",
  user: "postgres",
  password: "admin123",
});

pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("❌ Error de conexión:", err.message);
    console.error("Detalles:", err);
  } else {
    console.log("✅ Conexión exitosa!");
    console.log("Timestamp del servidor:", res.rows[0].now);
  }
  pool.end();
});
