/**
 * @fileoverview Configuración de conexión a PostgreSQL
 *
 * @author Boost Agency Development Team
 * @version 2.0.0
 */

const { Pool } = require("pg");
require("dotenv").config();

// Configuración del pool de conexiones
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "boostagency",
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Máximo de conexiones en el pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Manejo de errores del pool
pool.on("error", (err, client) => {
  console.error("Error inesperado en el cliente de PostgreSQL", err);
  process.exit(-1);
});

// Función helper para queries
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;

    if (process.env.NODE_ENV === "development") {
      console.log("Executed query", { text, duration, rows: res.rowCount });
    }

    return res;
  } catch (error) {
    console.error("Error en query de base de datos:", error);
    throw error;
  }
};

// Función para transacciones
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// Test de conexión
const testConnection = async () => {
  try {
    const result = await query("SELECT NOW() as now");
    console.log("✅ Conexión a PostgreSQL exitosa:", result.rows[0].now);
    return true;
  } catch (error) {
    console.error("❌ Error conectando a PostgreSQL:", error.message);
    return false;
  }
};

module.exports = {
  pool,
  query,
  transaction,
  testConnection,
};
